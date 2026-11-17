# AGENTS.md

Guide for AI agents and developers working on **AuctionMe**, an international auction marketplace (timed and live auctions). Slogan: *Discover. Bid. Win.*

**Continue from [PLAN.md](./PLAN.md).** Milestone 1, the branded product surface, is done. Start the next unchecked milestone and don't rebuild completed screens.

## Non-negotiable product rules

- **No mock data.** Never add fake listings, users, bids, reviews, sales or transactions, including in seed scripts. Seed only reference data (categories, countries, currencies, settings).
- Every screen needs an honest empty state.
- Never claim an auction is live without a real session, or that a payment succeeded without provider confirmation (signed webhook or server-side check).
- No buttons that pretend to work. If a feature isn't connected, disable it and say so clearly. Flip its entry in `PLATFORM_SERVICES` when it goes live.
- Bids, payments and permissions are validated on the server only. The server clock decides auction timing.
- Secrets live in environment variables only. Never expose residential addresses.

## Architecture

| Layer | Choice |
| --- | --- |
| Framework | TanStack Start (React 19, TypeScript strict, SSR) on Netlify |
| UI | Tailwind CSS 4 theme vars in `src/styles.css`, shadcn/ui in `src/components/ui` |
| Forms | React Hook Form + Zod |
| Server code (next) | TanStack Start server routes/functions. Netlify scheduled/background functions for auction closing and notifications |
| Data (next) | Netlify Database (Postgres) + Drizzle, schema in `db/schema.ts` |
| Files (next) | Netlify Blobs, served through `/.netlify/images` |

## Key files

```
src/lib/marketplace.ts         # THE data module: reference config, types, listAuctions/listLiveEvents,
                               # applyAuctionQuery (filter/sort), formatMoney, PLATFORM_SERVICES status
src/components/site/           # Brand components: header, footer, logo, auction-card (+ cdnImage),
                               # countdown, empty-state, native-select, category-icon, auth-shell
src/routes/index.tsx           # Landing page
src/routes/auctions.tsx        # Discovery (search params validated with Zod; views/filters/sort)
src/routes/live.tsx            # Live events list + broadcasting status
src/routes/sell.tsx            # Listing composer (validation, photo checks, preview, review)
src/routes/login.tsx, register.tsx, status.tsx
public/img/hero-gavel.png      # Brand hero image (always served through the Image CDN)
```

## Conventions and decisions

- Screens read data only through `src/lib/marketplace.ts`. To connect the database, replace `fetchPublicAuctions` / `fetchLiveEvents` with server-function queries. Screens and loaders stay the same.
- `applyAuctionQuery` mirrors the intended SQL filter/sort. Move that logic into the DB query when real data exists, so large result sets aren't filtered in memory, and add pagination.
- Drafts and `pending_approval` listings must never be returned by public queries.
- Store money as integer minor units in the DB. Format with `formatMoney` (Intl).
- Headings use the Fraunces display font (`h1–h3` / `font-display`); body text uses Manrope. Card titles override with `font-sans`.
- Brand tokens: `primary` = midnight navy, `accent` = brass gold, plus `live` (red) and `success` (green) colours.
- `Countdown` accepts `serverOffsetMs`. Pass the server-time offset once the API exists.
- Use the `NativeSelect` component for selects inside forms and filters (mobile-friendly, works with RHF).
- Components are PascalCase, route files kebab-case, imports via `@/`.
