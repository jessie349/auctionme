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

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React 19, TypeScript, file-based routing, SSR)
- Tailwind CSS 4 + shadcn/ui (Radix) components, lucide icons
- React Hook Form + Zod validation
- Netlify hosting, with the Netlify Image CDN for optimised images
- Planned: Netlify Database (Postgres + Drizzle), Netlify Blobs, LiveKit, Stripe Connect, Resend

## Running locally

```bash
pnpm install
netlify dev        # or: pnpm dev (Vite on port 3000)
```

## Roadmap

The full roadmap is in [PLAN.md](./PLAN.md). Next up:

1. Database foundation (Postgres schema, migrations, reference data)
2. Accounts and roles (registration, verification, sessions, RBAC)
3. Listings, image uploads and moderation
4. Timed auction engine (atomic bids, anti-sniping, automatic closing)
5. Real-time updates, notifications and watchlist
6. Live auctions (LiveKit video, live bidding, chat)
7. Payments, orders, shipping and payouts (Stripe Connect)
8. Trust & safety, admin dashboard and analytics
9. Testing and hardening
