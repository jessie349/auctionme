# AuctionMe — Product Roadmap

AuctionMe is an international auction marketplace offering timed auctions and live-streamed auctions. *Discover. Bid. Win.*

The product ships in self-contained milestones. Each milestone connects real services and stays switched off until its provider is configured, so the marketplace never shows mock listings, fake users, simulated bids or unconfirmed payments.

Platform choices for later milestones: **Netlify Database** (managed Postgres, Drizzle ORM) for all relational data, **Netlify Blobs + Image CDN** for seller photos, TanStack Start **server routes/functions** for the API, **Netlify scheduled/background functions** for auction closing and notifications, **LiveKit** for video, **Stripe Connect** for payments and payouts, and **Resend** for email.

---

## ✅ Milestone 1 — Branded product surface (done)

- AuctionMe brand: palette, Fraunces + Manrope typography, logo, responsive header/footer, mobile menu.
- Landing page (`/`): hero search, the two auction formats, categories, ending-soon, live events, trust & safety. Each data section shows an honest empty state.
- Discovery (`/auctions`): All / Traditional / Live / Upcoming / Ending soon / Featured views. Search, filters (category, country, city, condition, status, price) and sort (newest, ending soon, highest bid, lowest start) are kept in the URL.
- Live events (`/live`): live now and upcoming sections, plus a "broadcasting not configured" status.
- Seller listing composer (`/sell`): every required field, photo checks (type, size, max 10), a live preview card and a review summary. Submitting is turned off until seller accounts exist.
- Sign in (`/login`) and registration (`/register`): forms check input as you type, and submitting is turned off until auth launches.
- Platform status (`/status`): shows which services are connected.
- `src/lib/marketplace.ts` is the single data-access module, and its fetchers return no records yet.

## Milestone 2 — Database foundation

- Drizzle schema in `db/schema.ts` covering users, user_profiles, seller_profiles, verification_records, categories, products, product_images, auctions, auction_bids, live_auction_events, live_auction_products, live_auction_participants, live_chat_messages, watchlists, notifications, orders, payments, refunds, payouts, shipping_addresses, shipments, reviews, reports, disputes, platform_settings and audit_logs.
- Foreign keys, unique constraints (e.g. one watchlist row per user and auction), indexes on status/ends_at/category/country, and money stored as integer minor units.
- Seed only reference data: categories, countries, currencies, default commission, anti-sniping window.
- Swap the fetchers in `src/lib/marketplace.ts` for server functions that query approved auctions.

## Milestone 3 — Accounts and roles

- Secure auth with registration (name, email, phone, country, terms), login, email verification, password reset, session expiry and logout.
- Buyer, seller and admin roles on one account, enforced on the server. Protected `/dashboard` and `/admin` routes.
- Rate limiting and lockout on login. Audit log entries for sensitive actions.
- Profile and settings: avatar upload, username, contact preferences, saved addresses.

## Milestone 4 — Listings, images and moderation

- Submit listings from `/sell` to a server route with Zod validation. Images go to Netlify Blobs, with server-side type and size checks, and are served through the Image CDN.
- Listing lifecycle: draft → pending approval → scheduled → active. Admin approve/reject queue.
- Seller dashboard: listings by status, edit drafts, bidding activity, highest bids.
- Auction detail page `/auctions/$id` with gallery, bid history, watchlist button and seller card.

## Milestone 5 — Timed auction engine

- Bid endpoint: authenticated, not the seller, auction active by server clock, amount ≥ current + increment, idempotency key against duplicate submissions.
- Atomic bidding with a single transaction and row lock (`SELECT … FOR UPDATE`) on the auction row, so simultaneous bids resolve safely. Bids are append-only.
- Configurable anti-sniping extension.
- Scheduled function that closes expired auctions: picks the winner, checks the reserve, sets sold/unsold, creates an order and queues notifications.
- Serve a server-time offset to clients for accurate countdowns.

## Milestone 6 — Real-time, notifications and watchlist

- WebSocket channel for bid and auction-state updates, with reconnection and resync from the database on reconnect.
- Watchlist plus in-app notifications for outbid, ending soon, won/lost, new bid, payment, order, shipping and live-starting events.
- Email delivery through Resend, sent from background work.
- Buyer dashboard: active bids, won/lost, watchlist and notifications.

## Milestone 7 — Live auctions

- Verified sellers schedule events (title, description, cover, time, lots, prices, increments, reserves, duration).
- LiveKit integration: server-minted room tokens, seller broadcast controls, buyer viewer, connection monitoring, reconnection and cleanup.
- Live room: current lot, synchronised highest bid, bid history, participant count and per-lot closing.
- Live chat: rate limits, report/block, admin moderation.

## Milestone 8 — Payments, orders and shipping

- Stripe Connect onboarding for sellers, with checkout for winning orders and platform commission via application fees.
- Signed webhook handler that processes each event once (deduplicated by event id). Orders are marked paid only from webhook or server confirmation.
- Order statuses from awaiting payment through refunded/disputed. Refunds and payment-failure handling.
- Shipping addresses (kept private), tracking numbers, delivery confirmation. Shipping APIs where supported.
- Payouts released only after payment, delivery and dispute conditions are met. Earnings and transaction history.

## Milestone 9 — Trust, admin and analytics

- Phone and identity verification (e.g. Stripe Identity), business verification, seller badges, live-host gating.
- Reports (products, sellers, buyers), disputes, reviews tied to completed orders with moderation and verified-purchase badges.
- Admin dashboard: users (verify/suspend/ban), listings, auctions and live events, suspicious bidding, payments/refunds/payouts, categories, commissions, currencies, countries, policies. Every admin action is logged.
- Analytics for admins, sellers and buyers, calculated from database records.

## Milestone 10 — Hardening and testing

- End-to-end tests for buyer, seller and admin journeys. Concurrency tests for simultaneous bids, duplicate webhooks, expired auctions, network interruption, unauthorized access and failed payments.
- Pagination and lazy loading everywhere, query optimisation, error monitoring, structured logging, retries.
