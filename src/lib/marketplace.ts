/**
 * AuctionMe marketplace data module.
 *
 * This is the ONE place screens read marketplace data from. It holds:
 *  - platform configuration (categories, conditions, currencies, countries,
 *    auction statuses) — real reference data, not listings;
 *  - shared types for auctions and live events;
 *  - the data-access functions `listAuctions` / `listLiveEvents`.
 *
 * Public records are fetched through validated TanStack server functions.
 */
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export const CATEGORIES = [
  { slug: 'electronics', name: 'Electronics', icon: 'Cpu' },
  { slug: 'vehicles', name: 'Vehicles', icon: 'Car' },
  { slug: 'fashion', name: 'Fashion', icon: 'Shirt' },
  { slug: 'watches-jewellery', name: 'Watches & Jewellery', icon: 'Watch' },
  { slug: 'home-furniture', name: 'Home & Furniture', icon: 'Sofa' },
  { slug: 'collectibles', name: 'Collectibles', icon: 'Gem' },
  { slug: 'art', name: 'Art', icon: 'Palette' },
  { slug: 'sports', name: 'Sports Equipment', icon: 'Dumbbell' },
  { slug: 'machinery', name: 'Machinery', icon: 'Cog' },
  { slug: 'other', name: 'Other', icon: 'Package' },
] as const

export type CategorySlug = (typeof CATEGORIES)[number]['slug']

export const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like-new', label: 'Like new' },
  { value: 'used-excellent', label: 'Used — excellent' },
  { value: 'used-good', label: 'Used — good' },
  { value: 'used-fair', label: 'Used — fair' },
  { value: 'for-parts', label: 'For parts / not working' },
] as const

export type Condition = (typeof CONDITIONS)[number]['value']

/** Currencies the platform is designed to support. Payment availability per
 * currency is confirmed by the payment provider in a later milestone. */
export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'NGN', name: 'Nigerian Naira' },
  { code: 'KES', name: 'Kenyan Shilling' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'JPY', name: 'Japanese Yen' },
] as const

export type CurrencyCode = (typeof CURRENCIES)[number]['code']

export const COUNTRIES = [
  { code: 'US', name: 'United States', dial: '+1' },
  { code: 'GB', name: 'United Kingdom', dial: '+44' },
  { code: 'CA', name: 'Canada', dial: '+1' },
  { code: 'AU', name: 'Australia', dial: '+61' },
  { code: 'DE', name: 'Germany', dial: '+49' },
  { code: 'FR', name: 'France', dial: '+33' },
  { code: 'NL', name: 'Netherlands', dial: '+31' },
  { code: 'IE', name: 'Ireland', dial: '+353' },
  { code: 'ZA', name: 'South Africa', dial: '+27' },
  { code: 'NG', name: 'Nigeria', dial: '+234' },
  { code: 'KE', name: 'Kenya', dial: '+254' },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971' },
  { code: 'IN', name: 'India', dial: '+91' },
  { code: 'JP', name: 'Japan', dial: '+81' },
] as const

export type CountryCode = (typeof COUNTRIES)[number]['code']

export const AUCTION_STATUSES = [
  'draft',
  'pending_approval',
  'scheduled',
  'active',
  'ended',
  'sold',
  'unsold',
  'cancelled',
] as const

export type AuctionStatus = (typeof AUCTION_STATUSES)[number]

export const STATUS_LABELS: Record<AuctionStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending approval',
  scheduled: 'Scheduled',
  active: 'Active',
  ended: 'Ended',
  sold: 'Sold',
  unsold: 'Unsold',
  cancelled: 'Cancelled',
}

export type AuctionFormat = 'timed' | 'live'

export const SHIPPING_OPTIONS = [
  { value: 'domestic', label: 'Domestic shipping' },
  { value: 'international', label: 'International shipping' },
  { value: 'pickup', label: 'Local pickup' },
  { value: 'freight', label: 'Freight / specialist carrier' },
] as const

/** Shape of a publicly visible auction, as the database layer will return it. */
export interface Auction {
  id: string
  title: string
  category: CategorySlug
  condition: Condition
  format: AuctionFormat
  status: AuctionStatus
  currency: CurrencyCode
  startingPrice: number
  currentBid: number | null
  bidCount: number
  minIncrement: number
  hasReserve: boolean
  reserveMet: boolean
  startsAt: string
  endsAt: string
  imageUrl: string | null
  location: { city: string; country: CountryCode }
  seller: { username: string; verified: boolean }
  featured: boolean
  createdAt: string
}

export interface LiveEvent {
  id: string
  title: string
  coverImageUrl: string | null
  status: 'scheduled' | 'live' | 'ended' | 'cancelled'
  scheduledAt: string
  lotCount: number
  participantCount: number
  seller: { username: string; verified: boolean }
}

export type DiscoveryView =
  'all' | 'timed' | 'live' | 'upcoming' | 'ending-soon' | 'featured'

export type SortKey = 'newest' | 'ending-soon' | 'highest-bid' | 'lowest-start'

export interface AuctionQuery {
  view?: DiscoveryView
  q?: string
  category?: CategorySlug
  country?: CountryCode
  location?: string
  condition?: Condition
  status?: AuctionStatus
  minPrice?: number
  maxPrice?: number
  sort?: SortKey
  page?: number
  pageSize?: number
}

/** Validated again on the server, including direct server-function calls. */
export const auctionQuerySchema = z.object({
  view: z
    .enum(['all', 'timed', 'live', 'upcoming', 'ending-soon', 'featured'])
    .optional(),
  q: z.string().trim().max(120).optional(),
  category: z.enum(CATEGORIES.map((c) => c.slug)).optional(),
  country: z.enum(COUNTRIES.map((c) => c.code)).optional(),
  location: z.string().trim().max(80).optional(),
  condition: z.enum(CONDITIONS.map((c) => c.value)).optional(),
  status: z.enum(AUCTION_STATUSES).optional(),
  minPrice: z
    .number()
    .finite()
    .min(0)
    .max(Number.MAX_SAFE_INTEGER / 100)
    .optional(),
  maxPrice: z
    .number()
    .finite()
    .min(0)
    .max(Number.MAX_SAFE_INTEGER / 100)
    .optional(),
  sort: z
    .enum(['newest', 'ending-soon', 'highest-bid', 'lowest-start'])
    .optional(),
  page: z.number().int().min(1).max(10000).default(1),
  pageSize: z.number().int().min(1).max(48).default(24),
})

export const eventQuerySchema = z.object({
  page: z.number().int().min(1).max(10000).default(1),
  pageSize: z.number().int().min(1).max(48).default(24),
})

export interface PublicPage<T> {
  items: T[]
  page: number
  hasMore: boolean
}

const fetchPublicAuctions = createServerFn({ method: 'GET' })
  .validator(auctionQuerySchema)
  .handler(async ({ data }): Promise<PublicPage<Auction>> => {
    try {
      const { queryPublicAuctions } = await import('@/server/marketplace')
      return await queryPublicAuctions(data)
    } catch {
      throw new Error(
        'Marketplace data is temporarily unavailable. Please try again.',
      )
    }
  })

const fetchLiveEvents = createServerFn({ method: 'GET' })
  .validator(eventQuerySchema)
  .handler(async ({ data }): Promise<PublicPage<LiveEvent>> => {
    try {
      const { queryPublicEvents } = await import('@/server/marketplace')
      return await queryPublicEvents(data)
    } catch {
      throw new Error(
        'Live event data is temporarily unavailable. Please try again.',
      )
    }
  })

export function listAuctionPage(query: AuctionQuery = {}) {
  return fetchPublicAuctions({ data: query })
}

export async function listAuctions(query: AuctionQuery = {}) {
  return (await listAuctionPage(query)).items
}

export function listLiveEventPage(
  query: { page?: number; pageSize?: number } = {},
) {
  return fetchLiveEvents({ data: query })
}

export async function listLiveEvents(
  query: { page?: number; pageSize?: number } = {},
) {
  return (await listLiveEventPage(query)).items
}

export function formatMoney(amount: number, currency: CurrencyCode) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount)
}

/** Live status of each external service the marketplace depends on. Updated
 * as each milestone connects a provider; screens show these honestly. */
export const PLATFORM_SERVICES = [
  {
    key: 'database',
    name: 'Marketplace database',
    provider: 'Netlify Database (Postgres)',
    purpose: 'Public auction and event queries; marketplace schema',
    status: 'connected',
  },
  {
    key: 'auth',
    name: 'Accounts & sign-in',
    provider: 'Secure authentication service',
    purpose: 'Registration, email verification, sessions, roles',
    status: 'pending',
  },
  {
    key: 'storage',
    name: 'Image storage',
    provider: 'Netlify Blobs + Image CDN',
    purpose: 'Seller product photography',
    status: 'pending',
  },
  {
    key: 'realtime',
    name: 'Real-time bidding',
    provider: 'WebSocket service',
    purpose: 'Instant bid and chat updates',
    status: 'pending',
  },
  {
    key: 'video',
    name: 'Live video streaming',
    provider: 'LiveKit',
    purpose: 'Seller broadcasts and buyer viewing',
    status: 'pending',
  },
  {
    key: 'payments',
    name: 'Payments & payouts',
    provider: 'Stripe Connect',
    purpose: 'Checkout, webhooks, refunds, seller payouts',
    status: 'pending',
  },
  {
    key: 'email',
    name: 'Email notifications',
    provider: 'Resend',
    purpose: 'Verification, outbid, win and order emails',
    status: 'pending',
  },
  {
    key: 'identity',
    name: 'Identity verification',
    provider: 'KYC provider (e.g. Stripe Identity)',
    purpose: 'Seller and live-host verification',
    status: 'pending',
  },
] as const
