import { Link, createFileRoute } from '@tanstack/react-router'
import {
  CalendarClock,
  MessageSquare,
  Radio,
  ShieldCheck,
  Users,
  VideoOff,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Countdown } from '@/components/site/countdown'
import { EmptyState } from '@/components/site/empty-state'
import { cdnImage } from '@/components/site/auction-card'
import { PLATFORM_SERVICES, listLiveEvents, type LiveEvent } from '@/lib/marketplace'

export const Route = createFileRoute('/live')({
  loader: () => listLiveEvents(),
  head: () => ({ meta: [{ title: 'Live auctions — AuctionMe' }] }),
  component: LivePage,
})

function LivePage() {
  const events = Route.useLoaderData()
  const liveNow = events.filter((e) => e.status === 'live')
  const upcoming = events
    .filter((e) => e.status === 'scheduled')
    .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt))
  const video = PLATFORM_SERVICES.find((s) => s.key === 'video')!
  const videoReady = (video.status as string) === 'connected'

  return (
    <>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
          <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-accent uppercase">
            <span className="live-dot size-2 rounded-full bg-live" /> Live
            auctions
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold md:text-5xl">
            Watch, chat and bid live with verified sellers
          </h1>
          <p className="mt-4 max-w-xl text-primary-foreground/75">
            Each live event has its own room with the seller's video, the
            current lot, a bid history that stays in sync for every viewer, and
            moderated chat.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Radio, t: 'Real-time bidding', d: 'Accepted bids reach every participant instantly.' },
              { icon: MessageSquare, t: 'Moderated chat', d: 'Rate limits, reporting and blocking built in.' },
              { icon: ShieldCheck, t: 'Verified hosts', d: 'Only verified sellers can broadcast.' },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 p-5">
                <f.icon className="size-5 text-accent" aria-hidden="true" />
                <p className="mt-3 font-semibold">{f.t}</p>
                <p className="mt-1 text-sm text-primary-foreground/70">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-content space-y-14 px-4 py-12 sm:px-6">
        {!videoReady && (
          <Alert>
            <VideoOff aria-hidden="true" />
            <AlertTitle>Live broadcasting is not configured yet</AlertTitle>
            <AlertDescription>
              Live video uses {video.provider}. Rooms open once streaming
              credentials are connected. Until then, no event will be shown as
              live.
            </AlertDescription>
          </Alert>
        )}

        <section>
          <h2 className="text-2xl font-semibold">Live now</h2>
          <div className="mt-6">
            {liveNow.length ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {liveNow.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Radio}
                title="No one is broadcasting right now"
                description="When a verified seller starts their live auction, it appears here and you can join the room straight away."
              />
            )}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">Upcoming live events</h2>
          <div className="mt-6">
            {upcoming.length ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CalendarClock}
                title="No live events scheduled"
                description="Verified sellers can schedule a live event with its own lots, starting prices and bid increments."
                action={
                  <Button asChild>
                    <Link to="/sell">Plan a live auction</Link>
                  </Button>
                }
              />
            )}
          </div>
        </section>
      </div>
    </>
  )
}

function EventCard({ event }: { event: LiveEvent }) {
  const live = event.status === 'live'
  return (
    <article className="overflow-hidden rounded-2xl border bg-card">
      <div className="relative aspect-video bg-secondary">
        {event.coverImageUrl && (
          <img
            src={cdnImage(event.coverImageUrl, 640)}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        )}
        {live && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-live px-2.5 py-1 text-xs font-semibold text-white">
            <span className="live-dot size-1.5 rounded-full bg-white" /> LIVE
          </span>
        )}
      </div>
      <div className="space-y-2 p-4">
        <h3 className="font-sans text-base font-semibold tracking-normal">{event.title}</h3>
        <p className="text-sm text-muted-foreground">
          {event.seller.username} · {event.lotCount} lots
        </p>
        <div className="flex items-center justify-between text-sm">
          {live ? (
            <span className="inline-flex items-center gap-1">
              <Users className="size-4" aria-hidden="true" />
              {event.participantCount} watching
            </span>
          ) : (
            <span>
              {new Date(event.scheduledAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          )}
          {!live && <Countdown endsAt={event.scheduledAt} compact />}
        </div>
      </div>
    </article>
  )
}
