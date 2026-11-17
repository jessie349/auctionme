import { Link } from '@tanstack/react-router'
import { Menu, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Logo } from './logo'

const NAV: {
  to: '/auctions' | '/live' | '/sell'
  label: string
  view?: 'ending-soon'
}[] = [
  { to: '/auctions', label: 'Auctions' },
  { to: '/auctions', label: 'Ending soon', view: 'ending-soon' },
  { to: '/live', label: 'Live events' },
  { to: '/sell', label: 'Sell' },
]

function NavLink({
  item,
  className,
  children,
}: {
  item: (typeof NAV)[number]
  className: string
  children: React.ReactNode
}) {
  const active = { className: 'text-foreground' }
  if (item.view)
    return (
      <Link
        to="/auctions"
        search={{ view: item.view }}
        className={className}
        activeProps={active}
        activeOptions={{ includeSearch: true }}
      >
        {children}
      </Link>
    )
  return (
    <Link
      to={item.to}
      className={className}
      activeProps={active}
      activeOptions={{ exact: true, includeSearch: true }}
    >
      {children}
    </Link>
  )
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-content items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.label}
              item={item}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none"
            >
              {item.label === 'Live events' ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-live" />
                  {item.label}
                </span>
              ) : (
                item.label
              )}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/auctions" aria-label="Search auctions">
              <Search />
            </Link>
          </Button>
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/register">Create account</Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="font-display">AuctionMe</SheetTitle>
                <SheetDescription>Discover. Bid. Win.</SheetDescription>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
                {NAV.map((item) => (
                  <NavLink
                    key={item.label}
                    item={item}
                    className="rounded-md px-3 py-2.5 font-medium hover:bg-muted"
                  >
                    {item.label}
                  </NavLink>
                ))}
                <div className="mt-4 flex flex-col gap-2 border-t pt-4">
                  <Button variant="outline" asChild>
                    <Link to="/login">Sign in</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/register">Create account</Link>
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
