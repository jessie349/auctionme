/**
 * AuctionMe relational schema (Netlify Database / Postgres, Drizzle ORM).
 *
 * Conventions:
 *  - Money is stored as integer minor units (`bigint`, number mode) with an
 *    ISO currency code beside it. Format with `formatMoney`.
 *  - All timestamps are `timestamptz`; the database clock is the authority.
 *  - Bids are append-only. Nothing in the app updates or deletes a bid row.
 *  - Residential addresses live only in `shipping_addresses` and are only
 *    ever returned to the owner and to the seller of a paid order.
 */
import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

const ts = (name: string) => timestamp(name, { withTimezone: true })
const money = (name: string) => bigint(name, { mode: 'number' })
const createdAt = () => ts('created_at').notNull().defaultNow()

/* ------------------------------------------------------------------ users */

export const users = pgTable(
  'users',
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Netlify Identity user id (JWT `sub`). */
    identityId: text('identity_id').notNull().unique(),
    email: text().notNull(),
    fullName: text('full_name').notNull().default(''),
    phone: text(),
    country: text(),
    emailVerified: boolean('email_verified').notNull().default(false),
    phoneVerified: boolean('phone_verified').notNull().default(false),
    /** active | suspended | banned */
    status: text().notNull().default('active'),
    statusReason: text('status_reason'),
    termsAcceptedAt: ts('terms_accepted_at'),
    lastLoginAt: ts('last_login_at'),
    createdAt: createdAt(),
  },
  (t) => [index('users_email_idx').on(t.email), index('users_status_idx').on(t.status)],
)

export const userProfiles = pgTable('user_profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  username: text().notNull().unique(),
  avatarKey: text('avatar_key'),
  bio: text().notNull().default(''),
  timezone: text(),
  /** { email: { outbid, won, orders, marketing }, inApp: true } */
  contactPreferences: jsonb('contact_preferences')
    .$type<ContactPreferences>()
    .notNull()
    .default({ outbid: true, endingSoon: true, results: true, orders: true, messages: true, liveEvents: true }),
  updatedAt: ts('updated_at').notNull().defaultNow(),
})

export interface ContactPreferences {
  outbid: boolean
  endingSoon: boolean
  results: boolean
  orders: boolean
  messages: boolean
  liveEvents: boolean
}

export const sellerProfiles = pgTable('seller_profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  about: text().notNull().default(''),
  /** individual | business */
  sellerType: text('seller_type').notNull().default('individual'),
  businessName: text('business_name'),
  businessRegistration: text('business_registration'),
  /** unverified | pending | verified | rejected */
  verificationStatus: text('verification_status').notNull().default('unverified'),
  liveHostApproved: boolean('live_host_approved').notNull().default(false),
  stripeAccountId: text('stripe_account_id').unique(),
  payoutsEnabled: boolean('payouts_enabled').notNull().default(false),
  createdAt: createdAt(),
})

export const verificationRecords = pgTable(
  'verification_records',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** email | phone | identity | business */
    kind: text().notNull(),
    /** pending | approved | rejected */
    status: text().notNull().default('pending'),
    provider: text().notNull().default('manual'),
    providerRef: text('provider_ref'),
    details: text().notNull().default(''),
    reviewedBy: uuid('reviewed_by').references(() => users.id),
    reviewNote: text('review_note'),
    reviewedAt: ts('reviewed_at'),
    createdAt: createdAt(),
  },
  (t) => [index('verification_user_idx').on(t.userId), index('verification_status_idx').on(t.status)],
)

/* --------------------------------------------------------------- catalogue */

export const categories = pgTable('categories', {
  slug: text().primaryKey(),
  name: text().notNull(),
  icon: text().notNull().default('Package'),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean().notNull().default(true),
})

export const products = pgTable(
  'products',
  {
    id: uuid().primaryKey().defaultRandom(),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => users.id),
    title: text().notNull(),
    description: text().notNull(),
    categorySlug: text('category_slug')
      .notNull()
      .references(() => categories.slug),
    condition: text().notNull(),
    quantity: integer().notNull().default(1),
    city: text().notNull(),
    country: text().notNull(),
    shippingOptions: text('shipping_options').array().notNull().default(sql`'{}'::text[]`),
    createdAt: createdAt(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('products_seller_idx').on(t.sellerId),
    index('products_category_idx').on(t.categorySlug),
    index('products_country_idx').on(t.country),
    index('products_search_idx').using(
      'gin',
      sql`to_tsvector('simple', ${t.title} || ' ' || ${t.description})`,
    ),
    check('products_quantity_check', sql`${t.quantity} >= 1`),
  ],
)

export const productImages = pgTable(
  'product_images',
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    blobKey: text('blob_key').notNull().unique(),
    contentType: text('content_type').notNull(),
    byteSize: integer('byte_size').notNull(),
    position: smallint().notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index('product_images_product_idx').on(t.productId, t.position)],
)

/* ----------------------------------------------------------------- auctions */

export const liveAuctionEvents = pgTable(
  'live_auction_events',
  {
    id: uuid().primaryKey().defaultRandom(),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => users.id),
    title: text().notNull(),
    description: text().notNull().default(''),
    coverKey: text('cover_key'),
    scheduledAt: ts('scheduled_at').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    /** pending_approval | scheduled | live | ended | cancelled */
    status: text().notNull().default('pending_approval'),
    roomName: text('room_name').notNull().unique(),
    /** Server-side record of whether the seller's broadcast is connected. */
    broadcasting: boolean().notNull().default(false),
    startedAt: ts('started_at'),
    endedAt: ts('ended_at'),
    currentLotId: uuid('current_lot_id'),
    moderationNote: text('moderation_note'),
    createdAt: createdAt(),
  },
  (t) => [
    index('live_events_status_idx').on(t.status, t.scheduledAt),
    index('live_events_seller_idx').on(t.sellerId),
  ],
)

export const auctions = pgTable(
  'auctions',
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .unique()
      .references(() => products.id, { onDelete: 'cascade' }),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => users.id),
    /** timed | live */
    format: text().notNull().default('timed'),
    /** draft | pending_approval | scheduled | active | ended | sold | unsold | cancelled */
    status: text().notNull().default('pending_approval'),
    currency: text().notNull(),
    startingPrice: money('starting_price').notNull(),
    minIncrement: money('min_increment').notNull(),
    reservePrice: money('reserve_price'),
    currentBid: money('current_bid'),
    currentBidderId: uuid('current_bidder_id').references(() => users.id),
    bidCount: integer('bid_count').notNull().default(0),
    startsAt: ts('starts_at').notNull(),
    endsAt: ts('ends_at').notNull(),
    originalEndsAt: ts('original_ends_at').notNull(),
    extensionCount: integer('extension_count').notNull().default(0),
    featured: boolean().notNull().default(false),
    liveEventId: uuid('live_event_id').references(() => liveAuctionEvents.id),
    moderationNote: text('moderation_note'),
    reviewedBy: uuid('reviewed_by').references(() => users.id),
    reviewedAt: ts('reviewed_at'),
    endingSoonNotifiedAt: ts('ending_soon_notified_at'),
    closedAt: ts('closed_at'),
    winnerId: uuid('winner_id').references(() => users.id),
    createdAt: createdAt(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('auctions_status_ends_idx').on(t.status, t.endsAt),
    index('auctions_status_starts_idx').on(t.status, t.startsAt),
    index('auctions_seller_idx').on(t.sellerId),
    index('auctions_live_event_idx').on(t.liveEventId),
    check('auctions_prices_check', sql`${t.startingPrice} > 0 AND ${t.minIncrement} > 0`),
    check('auctions_reserve_check', sql`${t.reservePrice} IS NULL OR ${t.reservePrice} >= ${t.startingPrice}`),
    check('auctions_window_check', sql`${t.endsAt} > ${t.startsAt}`),
  ],
)

export const auctionBids = pgTable(
  'auction_bids',
  {
    id: uuid().primaryKey().defaultRandom(),
    auctionId: uuid('auction_id')
      .notNull()
      .references(() => auctions.id),
    bidderId: uuid('bidder_id')
      .notNull()
      .references(() => users.id),
    amount: money('amount').notNull(),
    /** Client-generated key per bid attempt; prevents duplicate submissions. */
    idempotencyKey: text('idempotency_key').notNull(),
    /** Whether this bid triggered an anti-sniping extension. */
    extended: boolean().notNull().default(false),
    ip: text(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('auction_bids_idempotency_idx').on(t.bidderId, t.idempotencyKey),
    uniqueIndex('auction_bids_amount_idx').on(t.auctionId, t.amount),
    index('auction_bids_auction_idx').on(t.auctionId, t.createdAt),
    index('auction_bids_bidder_idx').on(t.bidderId),
  ],
)

export const liveAuctionProducts = pgTable(
  'live_auction_products',
  {
    id: uuid().primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => liveAuctionEvents.id, { onDelete: 'cascade' }),
    auctionId: uuid('auction_id')
      .notNull()
      .unique()
      .references(() => auctions.id),
    position: integer().notNull(),
    /** Seconds the lot stays open once the host opens it. */
    lotDurationSeconds: integer('lot_duration_seconds').notNull().default(120),
    /** queued | open | closed */
    state: text().notNull().default('queued'),
    openedAt: ts('opened_at'),
  },
  (t) => [uniqueIndex('live_products_position_idx').on(t.eventId, t.position)],
)

export const liveAuctionParticipants = pgTable(
  'live_auction_participants',
  {
    eventId: uuid('event_id')
      .notNull()
      .references(() => liveAuctionEvents.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    joinedAt: ts('joined_at').notNull().defaultNow(),
    lastSeenAt: ts('last_seen_at').notNull().defaultNow(),
    /** Blocked from chatting in this event by the host or a moderator. */
    chatBlocked: boolean('chat_blocked').notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.userId] }), index('live_participants_seen_idx').on(t.eventId, t.lastSeenAt)],
)

export const liveChatMessages = pgTable(
  'live_chat_messages',
  {
    id: uuid().primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => liveAuctionEvents.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    body: text().notNull(),
    hidden: boolean().notNull().default(false),
    hiddenBy: uuid('hidden_by').references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [index('live_chat_event_idx').on(t.eventId, t.createdAt)],
)

/* ---------------------------------------------------- watchlist & notices */

export const watchlists = pgTable(
  'watchlists',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    auctionId: uuid('auction_id')
      .notNull()
      .references(() => auctions.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.auctionId] }), index('watchlists_auction_idx').on(t.auctionId)],
)

export const notifications = pgTable(
  'notifications',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** new_bid | outbid | ending_soon | won | lost | payment | order | shipping | message | live_starting | listing | account */
    type: text().notNull(),
    title: text().notNull(),
    body: text().notNull().default(''),
    link: text(),
    readAt: ts('read_at'),
    /** pending | sent | skipped | failed — email delivery state */
    emailStatus: text('email_status').notNull().default('pending'),
    emailAttempts: integer('email_attempts').notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    index('notifications_user_idx').on(t.userId, t.createdAt),
    index('notifications_email_idx').on(t.emailStatus),
  ],
)

/* ------------------------------------------------------ orders & payments */

export const shippingAddresses = pgTable(
  'shipping_addresses',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fullName: text('full_name').notNull(),
    line1: text().notNull(),
    line2: text(),
    city: text().notNull(),
    region: text(),
    postalCode: text('postal_code').notNull(),
    country: text().notNull(),
    phone: text(),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index('shipping_addresses_user_idx').on(t.userId)],
)

export const orders = pgTable(
  'orders',
  {
    id: uuid().primaryKey().defaultRandom(),
    auctionId: uuid('auction_id')
      .notNull()
      .unique()
      .references(() => auctions.id),
    buyerId: uuid('buyer_id')
      .notNull()
      .references(() => users.id),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => users.id),
    currency: text().notNull(),
    itemAmount: money('item_amount').notNull(),
    shippingAmount: money('shipping_amount').notNull().default(0),
    commissionAmount: money('commission_amount').notNull(),
    totalAmount: money('total_amount').notNull(),
    /** awaiting_payment | payment_processing | paid | processing | shipped | delivered | cancelled | refunded | disputed */
    status: text().notNull().default('awaiting_payment'),
    shippingAddressId: uuid('shipping_address_id').references(() => shippingAddresses.id),
    paymentDueAt: ts('payment_due_at'),
    paidAt: ts('paid_at'),
    deliveredAt: ts('delivered_at'),
    createdAt: createdAt(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('orders_buyer_idx').on(t.buyerId, t.createdAt),
    index('orders_seller_idx').on(t.sellerId, t.createdAt),
    index('orders_status_idx').on(t.status),
  ],
)

export const payments = pgTable(
  'payments',
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id),
    provider: text().notNull().default('stripe'),
    /** Stripe Checkout Session id. */
    providerSessionId: text('provider_session_id').unique(),
    providerPaymentId: text('provider_payment_id'),
    amount: money('amount').notNull(),
    currency: text().notNull(),
    /** created | processing | succeeded | failed | expired | refunded */
    status: text().notNull().default('created'),
    failureReason: text('failure_reason'),
    createdAt: createdAt(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [index('payments_order_idx').on(t.orderId), index('payments_status_idx').on(t.status)],
)

/** Signed provider webhook events already processed (deduplication). */
export const webhookEvents = pgTable('webhook_events', {
  id: text().primaryKey(),
  provider: text().notNull(),
  type: text().notNull(),
  receivedAt: ts('received_at').notNull().defaultNow(),
})

export const refunds = pgTable(
  'refunds',
  {
    id: uuid().primaryKey().defaultRandom(),
    paymentId: uuid('payment_id')
      .notNull()
      .references(() => payments.id),
    amount: money('amount').notNull(),
    reason: text().notNull(),
    /** requested | pending | succeeded | failed */
    status: text().notNull().default('requested'),
    providerRef: text('provider_ref'),
    requestedBy: uuid('requested_by').references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [index('refunds_payment_idx').on(t.paymentId)],
)

export const payouts = pgTable(
  'payouts',
  {
    id: uuid().primaryKey().defaultRandom(),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => users.id),
    orderId: uuid('order_id')
      .notNull()
      .unique()
      .references(() => orders.id),
    amount: money('amount').notNull(),
    currency: text().notNull(),
    /** held | eligible | requested | paid | failed | cancelled */
    status: text().notNull().default('held'),
    providerRef: text('provider_ref'),
    eligibleAt: ts('eligible_at'),
    releasedAt: ts('released_at'),
    createdAt: createdAt(),
  },
  (t) => [index('payouts_seller_idx').on(t.sellerId, t.status)],
)

export const shipments = pgTable(
  'shipments',
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id),
    carrier: text().notNull(),
    trackingNumber: text('tracking_number').notNull(),
    /** shipped | delivered */
    status: text().notNull().default('shipped'),
    shippedAt: ts('shipped_at').notNull().defaultNow(),
    deliveredAt: ts('delivered_at'),
  },
  (t) => [index('shipments_order_idx').on(t.orderId)],
)

/* ------------------------------------------------------------------- trust */

export const reviews = pgTable(
  'reviews',
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => users.id),
    /** buyer_to_seller | seller_to_buyer */
    direction: text().notNull(),
    rating: smallint().notNull(),
    body: text().notNull().default(''),
    /** published | hidden */
    status: text().notNull().default('published'),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('reviews_order_author_idx').on(t.orderId, t.authorId),
    index('reviews_subject_idx').on(t.subjectId),
    check('reviews_rating_check', sql`${t.rating} BETWEEN 1 AND 5`),
  ],
)

export const reports = pgTable(
  'reports',
  {
    id: uuid().primaryKey().defaultRandom(),
    reporterId: uuid('reporter_id')
      .notNull()
      .references(() => users.id),
    /** auction | user | message */
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    reason: text().notNull(),
    details: text().notNull().default(''),
    /** open | actioned | dismissed */
    status: text().notNull().default('open'),
    resolvedBy: uuid('resolved_by').references(() => users.id),
    resolvedAt: ts('resolved_at'),
    createdAt: createdAt(),
  },
  (t) => [index('reports_status_idx').on(t.status, t.createdAt)],
)

export const disputes = pgTable(
  'disputes',
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id),
    openedBy: uuid('opened_by')
      .notNull()
      .references(() => users.id),
    reason: text().notNull(),
    details: text().notNull(),
    /** open | resolved_buyer | resolved_seller | closed */
    status: text().notNull().default('open'),
    resolution: text(),
    resolvedBy: uuid('resolved_by').references(() => users.id),
    resolvedAt: ts('resolved_at'),
    createdAt: createdAt(),
  },
  (t) => [index('disputes_status_idx').on(t.status), index('disputes_order_idx').on(t.orderId)],
)

/* ---------------------------------------------------------------- platform */

export const platformSettings = pgTable('platform_settings', {
  key: text().primaryKey(),
  value: jsonb().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: ts('updated_at').notNull().defaultNow(),
})

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid().primaryKey().defaultRandom(),
    actorId: uuid('actor_id').references(() => users.id),
    action: text().notNull(),
    targetType: text('target_type'),
    targetId: text('target_id'),
    ip: text(),
    metadata: jsonb().notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [index('audit_logs_created_idx').on(t.createdAt), index('audit_logs_actor_idx').on(t.actorId)],
)

/** Fixed-window counters for rate limiting (login attempts, bids, chat). */
export const rateLimits = pgTable('rate_limits', {
  key: text().primaryKey(),
  windowStart: ts('window_start').notNull(),
  count: integer().notNull().default(0),
})
