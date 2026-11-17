/**
 * Server-only account helpers. Every protected server function calls one of
 * `currentAccount` / `requireAccount` / `requireAdmin`. Identity (who you are)
 * comes from the Netlify Identity session cookie; everything else (status,
 * profile, seller state) comes from the database. Client values are never
 * trusted for authorization.
 */
import { getUser } from '@netlify/identity'
import { getRequestIP } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { sellerProfiles, userProfiles, users } from '../../db/schema.js'

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export interface Account {
  id: string
  identityId: string
  email: string
  fullName: string
  username: string
  country: string | null
  phone: string | null
  status: string
  emailVerified: boolean
  phoneVerified: boolean
  isAdmin: boolean
  seller: {
    verificationStatus: string
    liveHostApproved: boolean
    payoutsEnabled: boolean
    stripeAccountId: string | null
  } | null
}

function slugUsername(base: string) {
  const s = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 16)
  return s.length >= 3 ? s : `member${s}`
}

/** Loads (or creates on first sign-in) the database account for the session. */
export async function currentAccount(): Promise<Account | null> {
  const idUser = await getUser()
  if (!idUser?.id || !idUser.email) return null
  const isAdmin = (idUser.roles ?? []).includes('admin') || idUser.role === 'admin'
  const meta = (idUser.userMetadata ?? {}) as Record<string, unknown>
  const emailVerified = Boolean(idUser.confirmedAt)

  let [row] = await db
    .select({ u: users, p: userProfiles, s: sellerProfiles })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .leftJoin(sellerProfiles, eq(sellerProfiles.userId, users.id))
    .where(eq(users.identityId, idUser.id))
    .limit(1)

  if (!row) {
    const str = (k: string) => (typeof meta[k] === 'string' ? (meta[k] as string).slice(0, 120) : null)
    const [created] = await db
      .insert(users)
      .values({
        identityId: idUser.id,
        email: idUser.email,
        fullName: str('full_name') ?? '',
        phone: str('phone'),
        country: str('country'),
        emailVerified,
        termsAcceptedAt: meta.terms_accepted_at ? new Date(String(meta.terms_accepted_at)) : null,
        lastLoginAt: new Date(),
      })
      .onConflictDoNothing({ target: users.identityId })
      .returning()
    const u = created ?? (await db.select().from(users).where(eq(users.identityId, idUser.id)))[0]
    let username = slugUsername(idUser.email.split('@')[0])
    for (let i = 0; i < 5; i++) {
      const res = await db
        .insert(userProfiles)
        .values({ userId: u.id, username })
        .onConflictDoNothing()
        .returning()
      if (res.length) break
      const [exists] = await db.select().from(userProfiles).where(eq(userProfiles.userId, u.id))
      if (exists) break
      username = `${slugUsername(idUser.email.split('@')[0]).slice(0, 12)}${Math.floor(Math.random() * 9000 + 1000)}`
    }
    ;[row] = await db
      .select({ u: users, p: userProfiles, s: sellerProfiles })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .leftJoin(sellerProfiles, eq(sellerProfiles.userId, users.id))
      .where(eq(users.id, u.id))
  } else if (row.u.emailVerified !== emailVerified || row.u.email !== idUser.email) {
    await db.update(users).set({ emailVerified, email: idUser.email }).where(eq(users.id, row.u.id))
    row.u.emailVerified = emailVerified
  }

  const { u, p, s } = row
  return {
    id: u.id,
    identityId: u.identityId,
    email: u.email,
    fullName: u.fullName,
    username: p?.username ?? 'member',
    country: u.country,
    phone: u.phone,
    status: u.status,
    emailVerified: u.emailVerified,
    phoneVerified: u.phoneVerified,
    isAdmin,
    seller: s
      ? {
          verificationStatus: s.verificationStatus,
          liveHostApproved: s.liveHostApproved,
          payoutsEnabled: s.payoutsEnabled,
          stripeAccountId: s.stripeAccountId,
        }
      : null,
  }
}

export async function requireAccount(opts: { active?: boolean; verified?: boolean } = {}) {
  const account = await currentAccount()
  if (!account) throw new HttpError(401, 'Please sign in to continue.')
  if ((opts.active ?? true) && account.status !== 'active')
    throw new HttpError(403, `Your account is ${account.status}. Contact support for help.`)
  if (opts.verified && !account.emailVerified)
    throw new HttpError(403, 'Please confirm your email address first.')
  return account
}

export async function requireAdmin() {
  const account = await requireAccount()
  if (!account.isAdmin) throw new HttpError(403, 'Administrator access required.')
  return account
}

export function clientIp() {
  try {
    return getRequestIP({ xForwardedFor: true }) ?? null
  } catch {
    return null
  }
}
