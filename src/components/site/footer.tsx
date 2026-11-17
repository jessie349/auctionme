import { Link } from '@tanstack/react-router'
import { Logo } from './logo'

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-content gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo inverted />
          <p className="max-w-xs text-sm text-primary-foreground/70">
            An international marketplace for timed and live-streamed auctions.
            Discover. Bid. Win.
          </p>
        </div>
        <FooterCol
          title="Buy"
          links={[
            { to: '/auctions', label: 'All auctions' },
            { to: '/live', label: 'Live events' },
            { to: '/register', label: 'Create account' },
          ]}
        />
        <FooterCol
          title="Sell"
          links={[
            { to: '/sell', label: 'Create a listing' },
            { to: '/status', label: 'Seller verification' },
          ]}
        />
        <FooterCol
          title="AuctionMe"
          links={[
            { to: '/status', label: 'Platform status' },
            { to: '/login', label: 'Sign in' },
          ]}
        />
      </div>
      <div className="border-t border-primary-foreground/10">
        <p className="mx-auto max-w-content px-4 py-6 text-xs text-primary-foreground/60 sm:px-6">
          © {new Date().getFullYear()} AuctionMe. Payments are processed by a
          licensed payment provider; AuctionMe never stores card details.
        </p>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  links,
}: {
  title: string
  links: { to: '/auctions' | '/live' | '/register' | '/sell' | '/status' | '/login'; label: string }[]
}) {
  return (
    <div>
      <h2 className="mb-3 font-sans text-xs font-semibold tracking-widest text-accent uppercase">
        {title}
      </h2>
      <ul className="space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              to={l.to}
              className="text-primary-foreground/80 hover:text-primary-foreground"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
