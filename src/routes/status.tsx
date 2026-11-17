import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle2, CircleDashed } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PLATFORM_SERVICES } from '@/lib/marketplace'

export const Route = createFileRoute('/status')({
  head: () => ({ meta: [{ title: 'Platform status — AuctionMe' }] }),
  component: StatusPage,
})

function StatusPage() {
  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold tracking-widest text-accent uppercase">
          Transparency
        </p>
        <h1 className="mt-2 text-4xl font-semibold">Platform status</h1>
        <p className="mt-3 text-muted-foreground">
          AuctionMe relies on trusted providers for accounts, payments, video
          and email. This page shows which services are connected. Features
          stay switched off until their provider is fully set up, so nothing is
          ever simulated.
        </p>
      </header>
      <ul className="mt-10 grid gap-4 md:grid-cols-2">
        {PLATFORM_SERVICES.map((s) => {
          const connected = (s.status as string) === 'connected'
          return (
            <li key={s.key} className="flex gap-4 rounded-2xl border bg-card p-5">
              {connected ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <CircleDashed className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-sans text-base font-semibold tracking-normal">{s.name}</h2>
                  <Badge variant={connected ? 'default' : 'secondary'}>
                    {connected ? 'Connected' : 'Not yet connected'}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{s.purpose}</p>
                <p className="mt-2 text-xs text-muted-foreground">Provider: {s.provider}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
