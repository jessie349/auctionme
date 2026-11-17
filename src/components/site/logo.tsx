import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

/** AuctionMe wordmark: a bidder paddle mark + serif wordmark. */
export function Logo({
  className,
  inverted = false,
}: {
  className?: string
  inverted?: boolean
}) {
  return (
    <Link
      to="/"
      aria-label="AuctionMe home"
      className={cn('group inline-flex items-center gap-2', className)}
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" className="size-8 shrink-0">
        <rect
          width="32"
          height="32"
          rx="9"
          className={inverted ? 'fill-accent' : 'fill-primary'}
        />
        <circle
          cx="16"
          cy="13"
          r="7"
          fill="none"
          strokeWidth="2.5"
          className={inverted ? 'stroke-primary' : 'stroke-accent'}
        />
        <path
          d="M16 20v6"
          strokeWidth="2.5"
          strokeLinecap="round"
          className={inverted ? 'stroke-primary' : 'stroke-accent'}
        />
      </svg>
      <span
        className={cn(
          'font-display text-xl font-semibold tracking-tight',
          inverted ? 'text-primary-foreground' : 'text-foreground',
        )}
      >
        Auction<span className="text-accent">Me</span>
      </span>
    </Link>
  )
}
