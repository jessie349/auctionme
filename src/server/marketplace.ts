import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
} from 'drizzle-orm'
import type { z } from 'zod'
import { db } from '../../db/index.js'
import {
  auctions,
  categories,
  liveAuctionEvents,
  liveAuctionParticipants,
  liveAuctionProducts,
  products,
  sellerProfiles,
  userProfiles,
  users,
} from '../../db/schema.js'
import { PLATFORM_SERVICES } from '@/lib/marketplace'
import type {
  Auction,
  LiveEvent,
  PublicPage,
  auctionQuerySchema,
  eventQuerySchema,
} from '@/lib/marketplace'

// Schema money is in minor units; the existing public UI uses major units.
const scale = sql`case when ${auctions.currency} = 'JPY' then 1 else 100 end`
const price = sql`coalesce(${auctions.currentBid}, ${auctions.startingPrice})::numeric / (${scale})`
const publicStatus = sql<string>`case when ${auctions.status} = 'active' and ${auctions.endsAt} <= now() then 'ended' else ${auctions.status} end`
const videoConnected = PLATFORM_SERVICES.some(
  (s) => s.key === 'video' && (s.status as string) === 'connected',
)
const broadcastingSession = and(
  eq(liveAuctionEvents.status, 'live'),
  eq(liveAuctionEvents.broadcasting, true),
  sql`${liveAuctionEvents.startedAt} is not null`,
  sql`${liveAuctionEvents.endedAt} is null`,
  eq(sellerProfiles.verificationStatus, 'verified'),
  eq(sellerProfiles.liveHostApproved, true),
  sql`${videoConnected}`,
)

// Escape LIKE metacharacters so searches behave as literal substrings.
const contains = (value: string) => `%${value.replace(/[\\%_]/g, '\\$&')}%`

export function publicAuctionQuery(query: z.output<typeof auctionQuerySchema>) {
  const conditions = [
    inArray(auctions.status, [
      'scheduled',
      'active',
      'ended',
      'sold',
      'unsold',
      'cancelled',
    ]),
    eq(users.status, 'active'),
    eq(categories.active, true),
    eq(products.sellerId, auctions.sellerId),
    or(
      sql`${auctions.format} <> 'live'`,
      sql`${auctions.status} <> 'active'`,
      sql`exists (select 1 from ${liveAuctionEvents} where ${liveAuctionEvents.id} = ${auctions.liveEventId} and ${liveAuctionEvents.sellerId} = ${auctions.sellerId} and ${broadcastingSession})`,
    ),
    // A future start must never be advertised as an active auction.
    or(sql`${auctions.status} <> 'active'`, lte(auctions.startsAt, sql`now()`)),
  ]
  if (query.view === 'timed' || query.view === 'live')
    conditions.push(eq(auctions.format, query.view))
  if (query.view === 'upcoming')
    conditions.push(
      eq(auctions.status, 'scheduled'),
      gte(auctions.startsAt, sql`now()`),
    )
  if (query.view === 'ending-soon')
    conditions.push(
      eq(auctions.status, 'active'),
      sql`${auctions.endsAt} > now()`,
      sql`${auctions.endsAt} <= now() + interval '24 hours'`,
    )
  if (query.view === 'featured') conditions.push(eq(auctions.featured, true))
  if (query.status) conditions.push(eq(publicStatus, query.status))
  if (query.category) conditions.push(eq(products.categorySlug, query.category))
  if (query.country) conditions.push(eq(products.country, query.country))
  if (query.condition) conditions.push(eq(products.condition, query.condition))
  if (query.location)
    conditions.push(ilike(products.city, contains(query.location)))
  if (query.q)
    conditions.push(
      or(
        ilike(products.title, contains(query.q)),
        ilike(userProfiles.username, contains(query.q)),
        ilike(categories.slug, contains(query.q)),
      )!,
    )
  if (query.minPrice !== undefined) conditions.push(gte(price, query.minPrice))
  if (query.maxPrice !== undefined) conditions.push(lte(price, query.maxPrice))

  const sort =
    query.sort === 'ending-soon'
      ? asc(auctions.endsAt)
      : query.sort === 'highest-bid'
        ? desc(sql`coalesce(${auctions.currentBid}, 0)::numeric / (${scale})`)
        : query.sort === 'lowest-start'
          ? asc(sql`${auctions.startingPrice}::numeric / (${scale})`)
          : desc(auctions.createdAt)

  return db
    .select({
      id: auctions.id,
      title: products.title,
      category: products.categorySlug,
      condition: products.condition,
      format: auctions.format,
      status: publicStatus,
      currency: auctions.currency,
      startingPrice: sql<number>`(${auctions.startingPrice}::numeric / (${scale}))::float8`,
      currentBid: sql<
        number | null
      >`(${auctions.currentBid}::numeric / (${scale}))::float8`,
      bidCount: auctions.bidCount,
      minIncrement: sql<number>`(${auctions.minIncrement}::numeric / (${scale}))::float8`,
      hasReserve: sql<boolean>`${auctions.reservePrice} is not null`,
      reserveMet: sql<boolean>`${auctions.reservePrice} is null or coalesce(${auctions.currentBid}, 0) >= ${auctions.reservePrice}`,
      startsAt: auctions.startsAt,
      endsAt: auctions.endsAt,
      createdAt: auctions.createdAt,
      city: products.city,
      country: products.country,
      username: userProfiles.username,
      verified: sql<boolean>`${sellerProfiles.verificationStatus} = 'verified'`,
      featured: auctions.featured,
    })
    .from(auctions)
    .innerJoin(products, eq(products.id, auctions.productId))
    .innerJoin(categories, eq(categories.slug, products.categorySlug))
    .innerJoin(users, eq(users.id, auctions.sellerId))
    .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
    .innerJoin(sellerProfiles, eq(sellerProfiles.userId, users.id))
    .where(and(...conditions))
    .orderBy(sort, asc(auctions.id))
    .limit(query.pageSize + 1)
    .offset((query.page - 1) * query.pageSize)
}

export async function queryPublicAuctions(
  query: z.output<typeof auctionQuerySchema>,
): Promise<PublicPage<Auction>> {
  const rows = await publicAuctionQuery(query)
  return {
    page: query.page,
    hasMore: rows.length > query.pageSize,
    items: rows.slice(0, query.pageSize).map((r) => ({
      id: r.id,
      title: r.title,
      startingPrice: r.startingPrice,
      currentBid: r.currentBid,
      minIncrement: r.minIncrement,
      bidCount: r.bidCount,
      hasReserve: r.hasReserve,
      reserveMet: r.reserveMet,
      featured: r.featured,
      category: r.category as Auction['category'],
      condition: r.condition as Auction['condition'],
      format: r.format as Auction['format'],
      status: r.status as Auction['status'],
      currency: r.currency as Auction['currency'],
      startsAt: r.startsAt.toISOString(),
      endsAt: r.endsAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
      location: {
        city: r.city,
        country: r.country as Auction['location']['country'],
      },
      seller: { username: r.username, verified: r.verified },
      // Image serving is enabled with the listing/image milestone.
      imageUrl: null,
    })),
  }
}

export function publicEventQuery(query: z.output<typeof eventQuerySchema>) {
  return db
    .select({
      id: liveAuctionEvents.id,
      title: liveAuctionEvents.title,
      status: liveAuctionEvents.status,
      scheduledAt: liveAuctionEvents.scheduledAt,
      username: userProfiles.username,
      verified: sql<boolean>`${sellerProfiles.verificationStatus} = 'verified'`,
      lotCount: sql<number>`(select count(*)::int from ${liveAuctionProducts} inner join ${auctions} on ${auctions.id} = ${liveAuctionProducts.auctionId} where ${liveAuctionProducts.eventId} = ${liveAuctionEvents.id} and ${auctions.sellerId} = ${liveAuctionEvents.sellerId} and ${auctions.status} in ('scheduled', 'active', 'ended', 'sold', 'unsold'))`,
      participantCount: sql<number>`(select count(*)::int from ${liveAuctionParticipants} where ${liveAuctionParticipants.eventId} = ${liveAuctionEvents.id} and ${liveAuctionParticipants.lastSeenAt} > now() - interval '60 seconds')`,
    })
    .from(liveAuctionEvents)
    .innerJoin(users, eq(users.id, liveAuctionEvents.sellerId))
    .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
    .innerJoin(sellerProfiles, eq(sellerProfiles.userId, users.id))
    .where(
      and(
        eq(users.status, 'active'),
        or(
          and(
            eq(liveAuctionEvents.status, 'scheduled'),
            gte(liveAuctionEvents.scheduledAt, sql`now()`),
          ),
          broadcastingSession,
        ),
      ),
    )
    .orderBy(
      sql`case when ${liveAuctionEvents.status} = 'live' then 0 else 1 end`,
      asc(liveAuctionEvents.scheduledAt),
      asc(liveAuctionEvents.id),
    )
    .limit(query.pageSize + 1)
    .offset((query.page - 1) * query.pageSize)
}

export async function queryPublicEvents(
  query: z.output<typeof eventQuerySchema>,
): Promise<PublicPage<LiveEvent>> {
  const rows = await publicEventQuery(query)
  return {
    page: query.page,
    hasMore: rows.length > query.pageSize,
    items: rows.slice(0, query.pageSize).map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status as LiveEvent['status'],
      scheduledAt: r.scheduledAt.toISOString(),
      coverImageUrl: null,
      lotCount: r.lotCount,
      participantCount: r.participantCount,
      seller: { username: r.username, verified: r.verified },
    })),
  }
}
