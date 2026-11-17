import { sql } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { HttpError } from './auth'

/**
 * Fixed-window rate limiter backed by Postgres, so limits hold across every
 * serverless instance. Throws 429 when `limit` is exceeded within `windowSec`.
 */
export async function rateLimit(key: string, limit: number, windowSec: number) {
  const rows = await db.execute<{ count: number }>(sql`
    INSERT INTO rate_limits (key, window_start, count)
    VALUES (${key}, now(), 1)
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSec}) THEN 1 ELSE rate_limits.count + 1 END,
      window_start = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSec}) THEN now() ELSE rate_limits.window_start END
    RETURNING count
  `)
  const count = Number((rows as unknown as { rows?: { count: number }[] }).rows?.[0]?.count ?? (rows as unknown as { count: number }[])[0]?.count ?? 0)
  if (count > limit) throw new HttpError(429, 'Too many attempts. Please wait a moment and try again.')
}
