import { db } from '../../db/index.js'
import { platformSettings } from '../../db/schema.js'

export interface Settings {
  commission_bps: number
  anti_snipe_window_seconds: number
  anti_snipe_extension_seconds: number
  payment_window_hours: number
  payout_hold_days: number
  enabled_currencies: string[]
  enabled_countries: string[]
  live_host_policy: string
  policies: { prohibited: string; returns: string }
}

const DEFAULTS: Settings = {
  commission_bps: 800,
  anti_snipe_window_seconds: 120,
  anti_snipe_extension_seconds: 120,
  payment_window_hours: 72,
  payout_hold_days: 3,
  enabled_currencies: [],
  enabled_countries: [],
  live_host_policy: 'verified_sellers',
  policies: { prohibited: '', returns: '' },
}

export async function getSettings(): Promise<Settings> {
  const rows = await db.select().from(platformSettings)
  const out = { ...DEFAULTS } as Record<string, unknown>
  for (const r of rows) out[r.key] = r.value
  return out as unknown as Settings
}
