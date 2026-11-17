import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Visible auction countdown. `serverOffsetMs` lets callers correct the
 * device clock against the server clock (server time - device time), so the
 * server remains the authority on when an auction closes.
 */
export function Countdown({
  endsAt,
  serverOffsetMs = 0,
  className,
  compact = false,
}: {
  endsAt: string | Date
  serverOffsetMs?: number
  className?: string
  compact?: boolean
}) {
  const end = typeof endsAt === 'string' ? Date.parse(endsAt) : endsAt.getTime()
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setNow(Date.now() + serverOffsetMs)
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [serverOffsetMs])

  if (Number.isNaN(end)) return <span className={className}>—</span>
  if (now === null)
    return <span className={cn('tabular', className)}>--:--:--</span>

  const ms = Math.max(0, end - now)
  if (ms === 0)
    return <span className={cn('font-semibold', className)}>Ended</span>

  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  const urgent = ms < 60 * 60 * 1000

  return (
    <span
      className={cn('tabular font-semibold', urgent && 'text-live', className)}
      aria-label={`${d} days ${h} hours ${m} minutes ${sec} seconds remaining`}
    >
      {d > 0 && `${d}d `}
      {pad(h)}:{pad(m)}
      {!compact && `:${pad(sec)}`}
    </span>
  )
}
