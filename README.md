# AuctionMe

**Discover. Bid. Win.**

AuctionMe is an international online auction marketplace. Individuals and businesses buy and sell through two formats: traditional **timed auctions** and **live auctions** with real-time video and instant bidding.

The marketplace only displays real database records. There is no mock data, and features stay off until their provider (database, auth, payments, video, email) is connected. You can see what is connected on the `/status` page.

## What's live now

- **Landing page** (`/`): brand hero with search, auction formats, categories, ending soon, live events, trust & safety
- **Discover auctions** (`/auctions`): six discovery views, search, filters and sorting, all kept in the URL
- **Live events** (`/live`): live now and upcoming events, plus broadcasting status
- **Create a listing** (`/sell`): full listing composer with photo checks, a live preview and a review summary
- **Sign in / Create account** (`/login`, `/register`): forms that check input as you type
- **Platform status** (`/status`): which services are connected

The database foundation is connected. Discovery and live-event pages query public records on the server with bounded pagination; drafts and pending listings remain private. No auction or event records have been seeded. Accounts, listing submission, bidding and payments remain unavailable until their milestones are complete. Image serving is part of the upcoming listing milestone.

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React 19, TypeScript, file-based routing, SSR)
- Tailwind CSS 4 + shadcn/ui (Radix) components, lucide icons
- React Hook Form + Zod validation
- Netlify hosting, with the Netlify Image CDN for optimised images
- Netlify Database (Postgres + Drizzle) for public auction/event queries and the marketplace schema
- Planned: Netlify Blobs, LiveKit, Stripe Connect, Resend

## Running locally

```bash
pnpm install
netlify dev        # or: pnpm dev (Vite on port 3000)
```

## Roadmap

The full roadmap is in [PLAN.md](./PLAN.md). Next up:

1. Accounts and roles (registration, verification, sessions, RBAC)
2. Listings, image uploads and moderation
3. Timed auction engine (atomic bids, anti-sniping, automatic closing)
4. Real-time updates, notifications and watchlist
5. Live auctions (LiveKit video, live bidding, chat)
6. Payments, orders, shipping and payouts (Stripe Connect)
7. Trust & safety, admin dashboard and analytics
8. Testing and hardening
