import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Gavel,
  Globe2,
  Lock,
  Radio,
  ScrollText,
  ShieldCheck,
  Timer,
  Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuctionCard } from '@/components/site/auction-card'
import { CategoryIcon } from '@/components/site/category-icon'
import { EmptyState } from '@/components/site/empty-state'
import { CATEGORIES, listAuctions, listLiveEvents } from '@/lib/marketplace'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [endingSoon, featured, liveEvents] = await Promise.all([
      listAuctions({ view: 'ending-soon', sort: 'ending-soon', pageSize: 8 }),
      listAuctions({ view: 'featured', pageSize: 4 }),
      listLiveEvents({ pageSize: 6 }),
    ])
    return { endingSoon, featured, liveEvents }
  },
  component: Home,
})

function Home() {
  const { endingSoon, featured, liveEvents } = Route.useLoaderData()

  return (
    <>
      <Hero />

      <section className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <SectionHeading
          eyebrow="Two ways to win"
          title="Timed auctions and live-streamed sales, in one marketplace"
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <FormatCard
            icon={Timer}
            title="Timed auctions"
            body="Listings run on a fixed schedule set by the seller. Every bid is checked by the server, and a late bid near the close adds extra time so nobody wins by sniping."
            points={[
              'Minimum bid increments enforced server-side',
              'Reserve prices, honoured automatically',
              'Closing time set by the server clock',
            ]}
            cta={{ label: 'Browse timed auctions', view: 'timed' as const }}
          />
          <FormatCard
            dark
            icon={Video}
            title="Live auctions"
            body="Verified sellers present each lot on camera while buyers bid in real time. Everyone in the room sees each accepted bid as soon as the server confirms it."
            points={[
              'Real-time video from the seller',
              'Synchronised highest bid for every viewer',
              'Moderated live chat',
            ]}
            cta={{ label: 'See live events', view: 'live' as const }}
          />
        </div>
      </section>

      <section className="border-y bg-secondary/60">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
          <SectionHeading eyebrow="Categories" title="Shop by category" />
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                to="/auctions"
                search={{ category: c.slug }}
                className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-accent motion-reduce:transition-none"
              >
                <span className="grid size-10 place-items-center rounded-lg bg-primary text-accent">
                  <CategoryIcon name={c.icon} className="size-5" />
                </span>
                <span className="text-sm font-semibold">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="Closing soon" title="Ending soon" />
          <Button variant="link" asChild className="px-0">
            <Link to="/auctions" search={{ view: 'ending-soon' }}>
              View all <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="mt-8">
          {endingSoon.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {endingSoon.slice(0, 8).map((a) => (
                <AuctionCard key={a.id} auction={a} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Gavel}
              title="No auctions are closing yet"
              description="AuctionMe is opening to its first sellers. Approved listings appear here as they near their closing time."
              action={
                <Button asChild>
                  <Link to="/sell">List the first item</Link>
                </Button>
              }
            />
          )}
        </div>
      </section>

      <section className="mx-auto max-w-content px-4 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-primary text-primary-foreground">
          <div className="grid gap-8 p-8 md:grid-cols-[1fr_1.2fr] md:p-12">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-accent uppercase">
                <span className="live-dot size-2 rounded-full bg-live" /> Live
                events
              </p>
              <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
                Bid live, as it happens
              </h2>
              <p className="mt-4 text-primary-foreground/75">
                Live sessions are hosted by verified sellers. We only show an
                event as live when a broadcast is actually running.
              </p>
              <Button variant="secondary" className="mt-6" asChild>
                <Link to="/live">Explore live events</Link>
              </Button>
            </div>
            <div className="grid content-center">
              {liveEvents.length ? (
                <p className="text-sm">
                  {liveEvents.length} events scheduled.
                </p>
              ) : (
                <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 p-6">
                  <CalendarClock
                    className="size-6 text-accent"
                    aria-hidden="true"
                  />
                  <p className="mt-3 font-semibold">No live events scheduled</p>
                  <p className="mt-1 text-sm text-primary-foreground/70">
                    Once verified sellers schedule a live auction, its date,
                    lots and countdown appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-content px-4 pt-16 sm:px-6">
          <SectionHeading eyebrow="Curated" title="Featured listings" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.slice(0, 4).map((a) => (
              <AuctionCard key={a.id} auction={a} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-content px-4 py-20 sm:px-6">
        <SectionHeading
          eyebrow="Trust & safety"
          title="Built so the highest valid bid always wins"
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.title} className="rounded-2xl border bg-card p-6">
              <t.icon className="size-6 text-accent" aria-hidden="true" />
              <h3 className="mt-4 font-sans text-base font-semibold tracking-normal">
                {t.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-content px-4 sm:px-6">
        <div className="grid gap-6 rounded-3xl border bg-card p-8 md:grid-cols-[1.5fr_1fr] md:items-center md:p-12">
          <div>
            <h2 className="text-3xl font-semibold">
              One account to buy and sell
            </h2>
            <p className="mt-3 max-w-lg text-muted-foreground">
              Bid as a buyer, list as a seller, and track everything from one
              dashboard: bids, watchlist, orders, payouts and verification.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Button size="lg" asChild>
              <Link to="/register">Create account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/sell">Start selling</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}

const TRUST = [
  {
    icon: ShieldCheck,
    title: 'Server-validated bids',
    body: 'Every bid is checked and timestamped on the server and kept permanently. Two bids that arrive at once are settled in a fixed order.',
  },
  {
    icon: BadgeCheck,
    title: 'Verified sellers',
    body: 'Email, phone and identity checks. Only verified sellers can host live auctions.',
  },
  {
    icon: Lock,
    title: 'Provider-confirmed payments',
    body: 'Orders are marked paid only after the payment provider confirms it through a signed webhook. Card details never touch AuctionMe.',
  },
  {
    icon: ScrollText,
    title: 'Full audit trail',
    body: 'Moderation, payouts and admin actions are logged. Sellers can never edit or remove valid bids.',
  },
]

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
      <img
        src="/.netlify/images?url=/img/hero-gavel.png&w=1600&fm=webp"
        srcSet="/.netlify/images?url=/img/hero-gavel.png&w=800&fm=webp 800w, /.netlify/images?url=/img/hero-gavel.png&w=1600&fm=webp 1600w"
        sizes="100vw"
        alt=""
        className="absolute inset-0 -z-10 size-full object-cover object-[70%_center] opacity-80"
        fetchPriority="high"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary via-primary/85 to-primary/10" />
      <div className="mx-auto max-w-content px-4 py-24 sm:px-6 md:py-32">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 px-3 py-1 text-xs font-medium tracking-wide">
          <Globe2 className="size-3.5 text-accent" aria-hidden="true" />
          International auction marketplace
        </p>
        <h1 className="mt-6 max-w-2xl text-5xl leading-[1.05] font-semibold md:text-7xl">
          Discover. Bid.{' '}
          <span className="text-accent italic">Win.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-primary-foreground/80">
          AuctionMe connects buyers and sellers worldwide through timed auctions
          and live-streamed sales, with checked bids and payments confirmed by
          the payment provider.
        </p>
        <form
          action="/auctions"
          method="get"
          role="search"
          className="mt-8 flex max-w-xl flex-col gap-2 rounded-2xl bg-background p-2 shadow-xl sm:flex-row"
        >
          <label htmlFor="hero-q" className="sr-only">
            Search auctions
          </label>
          <input
            id="hero-q"
            name="q"
            placeholder="Search watches, art, vehicles, sellers…"
            className="h-11 flex-1 rounded-xl bg-transparent px-4 text-foreground outline-none placeholder:text-muted-foreground"
          />
          <Button type="submit" size="lg" className="h-11 rounded-xl">
            Search auctions
          </Button>
        </form>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-primary-foreground/70">
          <span className="inline-flex items-center gap-2">
            <Gavel className="size-4 text-accent" aria-hidden="true" /> Timed
            auctions
          </span>
          <span className="inline-flex items-center gap-2">
            <Radio className="size-4 text-accent" aria-hidden="true" /> Live
            video auctions
          </span>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="size-4 text-accent" aria-hidden="true" />{' '}
            Verified sellers
          </span>
        </div>
      </div>
    </section>
  )
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-accent uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-2 max-w-2xl text-3xl font-semibold md:text-4xl">
        {title}
      </h2>
    </div>
  )
}

function FormatCard({
  icon: Icon,
  title,
  body,
  points,
  cta,
  dark = false,
}: {
  icon: typeof Timer
  title: string
  body: string
  points: string[]
  cta: { label: string; view: 'timed' | 'live' }
  dark?: boolean
}) {
  return (
    <div
      className={
        dark
          ? 'flex flex-col rounded-3xl bg-primary p-8 text-primary-foreground'
          : 'flex flex-col rounded-3xl border bg-card p-8'
      }
    >
      <span className="grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h3 className="mt-6 text-2xl font-semibold">{title}</h3>
      <p className={dark ? 'mt-3 text-primary-foreground/75' : 'mt-3 text-muted-foreground'}>
        {body}
      </p>
      <ul className="mt-6 space-y-2 text-sm">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
            {p}
          </li>
        ))}
      </ul>
      <Button
        variant={dark ? 'secondary' : 'default'}
        className="mt-8 self-start"
        asChild
      >
        {cta.view === 'live' ? (
          <Link to="/live">{cta.label}</Link>
        ) : (
          <Link to="/auctions" search={{ view: cta.view }}>
            {cta.label}
          </Link>
        )}
      </Button>
    </div>
  )
}
