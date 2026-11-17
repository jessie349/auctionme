import { db } from '../../db/index.js'
import { auditLogs } from '../../db/schema.js'
import { clientIp } from './auth'

/** Append-only record of sensitive actions (admin, money, moderation). */
export async function audit(
  actorId: string | null,
  action: string,
  target?: { type: string; id: string },
  metadata: Record<string, unknown> = {},
) {
  await db.insert(auditLogs).values({
    actorId,
    action,
    targetType: target?.type,
    targetId: target?.id,
    ip: clientIp(),
    metadata,
  })
}
