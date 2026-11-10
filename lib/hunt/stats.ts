import type { Currency } from '@/lib/hunt/currency'

export type HuntStatus = 'draft' | 'live' | 'ended'
export type EntryStatus = 'called' | 'bought' | 'opened'
export type EntryKind = 'regular' | 'super' | 'hidden'

export const ENTRY_KINDS: { value: EntryKind; label: string }[] = [
  { value: 'regular', label: 'Regular' },
  { value: 'super', label: 'Super' },
  { value: 'hidden', label: 'Hidden' },
]

export interface HuntEntry {
  id: string
  position: number
  game: string
  imageUrl: string | null
  betSize: number
  payout: number | null
  calledBy: string | null
  status: EntryStatus
  kind: EntryKind
  createdAt: string
}

export interface HuntSummary {
  id: string
  number: number
  name: string | null
  currency: Currency
  status: HuntStatus
  startBalance: number
  startedAt: string | null
  endedAt: string | null
  createdAt: string
}

export type OverviewPeriod = 'all' | '30d' | '7d'

export interface OverviewHunt {
  id: string
  number: number
  name: string | null
  status: HuntStatus
  currency: Currency
  date: string
  startBalance: number
  bonuses: number
  opened: number
  winnings: number
  // Null while the hunt is still being played, so a half-opened hunt never shows a fake loss.
  pnl: number | null
  pnlPercent: number | null
}

export interface OverviewHighlight {
  game: string
  imageUrl: string | null
  value: number
  huntNumber: number
}

export interface HuntOverview {
  currency: Currency
  period: OverviewPeriod
  hunts: OverviewHunt[]
  stats: {
    huntCount: number
    totalCost: number
    winnings: number
    pnl: number
    highestWin: OverviewHighlight | null
    highestMulti: OverviewHighlight | null
    lowestMulti: OverviewHighlight | null
  }
}

export interface HuntSettings {
  huntOn: boolean
  maxCallsPerUser: number
  rejectDuplicates: boolean
}

export interface HuntStats {
  start: number
  winnings: number
  totalBonuses: number
  openedCount: number
  remaining: number
  totalBetAll: number
  totalBetOpened: number
  runAverage: number | null
  requiredAverage: number | null
  best: { game: string; payout: number; bet: number } | null
  lucky: { game: string; multiplier: number; payout: number; bet: number } | null
  nextPosition: number | null
}

type StatEntry = Pick<HuntEntry, 'position' | 'game' | 'betSize' | 'payout' | 'status'>

const isOpened = (entry: StatEntry) => entry.status === 'opened' && entry.payout !== null

// Formulas (kept in one place; the admin panel shows the same definitions):
//   Winnings          = sum of opened payouts
//   Run Average       = Winnings / total bet size of opened bonuses
//   Required Average  = start balance / total bet size of all bonuses
//   Remaining         = entries not yet opened
export function computeHuntStats(startBalance: number, entries: StatEntry[]): HuntStats {
  const ordered = [...entries].sort((a, b) => a.position - b.position)
  const opened = ordered.filter(isOpened)

  const winnings = opened.reduce((sum, e) => sum + (e.payout ?? 0), 0)
  const totalBetOpened = opened.reduce((sum, e) => sum + e.betSize, 0)
  const totalBetAll = ordered.reduce((sum, e) => sum + e.betSize, 0)

  let best: HuntStats['best'] = null
  let lucky: HuntStats['lucky'] = null
  for (const e of opened) {
    const payout = e.payout ?? 0
    if (!best || payout > best.payout) best = { game: e.game, payout, bet: e.betSize }
    if (e.betSize > 0) {
      const multiplier = payout / e.betSize
      if (!lucky || multiplier > lucky.multiplier) lucky = { game: e.game, multiplier, payout, bet: e.betSize }
    }
  }

  const next = ordered.find((e) => !isOpened(e))

  return {
    start: startBalance,
    winnings,
    totalBonuses: ordered.length,
    openedCount: opened.length,
    remaining: ordered.length - opened.length,
    totalBetAll,
    totalBetOpened,
    runAverage: totalBetOpened > 0 ? winnings / totalBetOpened : null,
    requiredAverage: totalBetAll > 0 ? startBalance / totalBetAll : null,
    best,
    lucky,
    nextPosition: next ? next.position : null,
  }
}
