import { BadgeCheck, Gavel, ImageOff, MapPin, Radio } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  CATEGORIES,
  COUNTRIES,
  STATUS_LABELS,
  formatMoney,
  type Auction,
} from '@/lib/marketplace'
import { Countdown } from './countdown'

/** Optimised image URL through the Netlify Image CDN. */
export function cdnImage(url: string, width: number) {
  if (url.startsWith('blob:') || url.startsWith('data:')) return url
  return `/.netlify/images?url=${encodeURIComponent(url)}&w=${width}&fm=webp`
}

export function AuctionCard({
  auction,
  preview = false,
  className,
}: {
  auction: Auction
  /** Seller-side preview of an unsaved listing. */
  preview?: boolean
  className?: string
}) {
  const category = CATEGORIES.find((c) => c.slug === auction.category)
  const country = COUNTRIES.find((c) => c.code === auction.location.country)
  const price = auction.currentBid ?? auction.startingPrice
  const isLive = auction.format === 'live'

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-lg motion-reduce:transition-none',
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {auction.imageUrl ? (
          <img
            src={cdnImage(auction.imageUrl, 640)}
            alt={auction.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2 text-xs">
              <ImageOff className="size-6" aria-hidden="true" />
              {preview ? 'Add your first photo' : 'No photo'}
            </div>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {isLive ? (
            <Badge className="gap-1 bg-live text-white">
              <Radio className="size-3" aria-hidden="true" /> Live
            </Badge>
          ) : (
            <Badge className="gap-1 bg-background/90 text-foreground">
              <Gavel className="size-3" aria-hidden="true" /> Timed
            </Badge>
          )}
          {preview && (
            <Badge variant="secondary">{STATUS_LABELS[auction.status]}</Badge>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{category?.name}</span>
          {(auction.location.city || country) && (
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin className="size-3" aria-hidden="true" />
              {[auction.location.city, country?.name].filter(Boolean).join(', ')}
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 font-sans text-base leading-snug font-semibold tracking-normal">
          {auction.title || 'Untitled listing'}
        </h3>
        <div className="mt-auto flex items-end justify-between gap-3 border-t pt-3">
          <div>
            <p className="text-xs text-muted-foreground">
              {auction.currentBid != null
                ? `Current bid · ${auction.bidCount} bids`
                : 'Starting price'}
            </p>
            <p className="tabular font-display text-xl font-semibold">
              {formatMoney(price, auction.currency)}
            </p>
            {auction.hasReserve && (
              <p className="text-xs text-muted-foreground">
                {auction.reserveMet ? 'Reserve met' : 'Reserve not yet met'}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Ends in</p>
            <Countdown endsAt={auction.endsAt} className="text-sm" />
          </div>
        </div>
        <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          {auction.seller.username}
          {auction.seller.verified && (
            <BadgeCheck className="size-3.5 text-success" aria-label="Verified seller" />
          )}
        </p>
      </div>
    </article>
  )
}
