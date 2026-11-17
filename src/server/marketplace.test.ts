// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { auctionQuerySchema, eventQuerySchema } from '@/lib/marketplace'
import { publicAuctionQuery, publicEventQuery } from './marketplace'

// Compile real Drizzle SQL without needing credentials or fabricating records.
vi.mock('../../db/index.js', async () => {
  const { drizzle } = await import('drizzle-orm/netlify-db')
  const schema = await import('../../db/schema.js')
  return { db: drizzle.mock({ schema }) }
})

describe('public marketplace query boundaries', () => {
  it('validates pagination, enums, text length and price bounds on the server', () => {
    for (const input of [
      { page: 0 },
      { page: 1.5 },
      { page: 10001 },
      { pageSize: 49 },
      { minPrice: -1 },
      { maxPrice: Infinity },
      { country: 'invalid' },
      { q: 'x'.repeat(121) },
      { sort: 'invalid' },
    ])
      expect(auctionQuerySchema.safeParse(input).success).toBe(false)
    expect(eventQuerySchema.safeParse({ pageSize: 100 }).success).toBe(false)
    expect(auctionQuerySchema.parse({}).pageSize).toBe(24)
  })

  it('keeps the public allowlist even when a caller explicitly asks for drafts', () => {
    const query = publicAuctionQuery(
      auctionQuerySchema.parse({ status: 'draft' }),
    ).toSQL()
    expect(query.params).toEqual(
      expect.arrayContaining([
        'scheduled',
        'active',
        'ended',
        'sold',
        'unsold',
        'cancelled',
        'draft',
      ]),
    )
    expect(query.sql).toContain('"auctions"."status" in (')
    expect(query.sql).toContain('"users"."status" =')
    expect(query.sql).toContain('"categories"."active" =')
    expect(query.sql).toContain(
      '"products"."seller_id" = "auctions"."seller_id"',
    )
    const selection = query.sql.split(' from ')[0]
    for (const privateColumn of [
      'email',
      'phone',
      'current_bidder_id',
      'moderation_note',
      'identity_id',
      'shipping_address',
    ]) {
      expect(selection).not.toContain(`"${privateColumn}"`)
    }
    // Only the reserve-met boolean is public; never select the reserve amount itself.
    expect(selection).not.toMatch(/, "auctions"\."reserve_price",/)
  })

  it('applies catalogue filters in SQL and requires a session for active live auctions', () => {
    const query = publicAuctionQuery(
      auctionQuerySchema.parse({
        category: 'electronics',
        country: 'US',
        condition: 'new',
        view: 'live',
      }),
    ).toSQL()
    expect(query.params).toEqual(
      expect.arrayContaining(['electronics', 'US', 'new', 'live', false]),
    )
    expect(query.sql).toContain('exists (select 1 from "live_auction_events"')
    expect(query.sql).toContain(
      '"live_auction_events"."id" = "auctions"."live_event_id"',
    )
  })

  it('uses the database clock and excludes expired auctions from ending soon', () => {
    const { sql } = publicAuctionQuery(
      auctionQuerySchema.parse({ view: 'ending-soon' }),
    ).toSQL()
    expect(sql).toContain('"auctions"."ends_at" > now()')
    expect(sql).toContain("interval '24 hours'")
    expect(sql).toContain("then 'ended'")
    expect(sql).toContain('"auctions"."starts_at" <= now()')
  })

  it('parameterizes literal searches and performs filtering, ordering and pagination in SQL', () => {
    const query = publicAuctionQuery(
      auctionQuerySchema.parse({
        q: "%' OR 1=1 --_",
        location: '100%',
        minPrice: 1.25,
        maxPrice: 10,
        sort: 'lowest-start',
        page: 3,
        pageSize: 12,
      }),
    ).toSQL()
    expect(query.sql).not.toContain('OR 1=1')
    expect(query.params).toContain("%\\%' OR 1=1 --\\_%")
    expect(query.params).toContain('%100\\%%')
    expect(query.sql).toContain('::numeric /')
    expect(query.sql).toContain("= 'JPY' then 1 else 100 end")
    expect(query.sql).toContain('order by')
    expect(query.sql).toContain('"auctions"."id" asc')
    expect(query.params.slice(-2)).toEqual([13, 24])
  })

  it('requires a real broadcast and connected video before showing an event as live', () => {
    const query = publicEventQuery(
      eventQuerySchema.parse({ page: 2, pageSize: 6 }),
    ).toSQL()
    expect(query.params).toContain(false)
    expect(query.sql).toContain('"live_auction_events"."broadcasting" =')
    expect(query.sql).toContain(
      '"live_auction_events"."started_at" is not null',
    )
    expect(query.sql).toContain('"live_auction_events"."ended_at" is null')
    expect(query.sql).toContain('"seller_profiles"."live_host_approved" =')
    expect(query.sql).toContain('"live_auction_events"."scheduled_at" >= now()')
    expect(query.sql).toContain("interval '60 seconds'")
    expect(query.params).not.toContain('pending_approval')
    expect(query.params.slice(-2)).toEqual([7, 6])
  })
})
