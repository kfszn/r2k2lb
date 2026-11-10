import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { normalizeSlotName } from '@/lib/hunt/normalize'
import { CURRENCIES, DEFAULT_CURRENCY, currencyOrDefault, type Currency } from '@/lib/hunt/currency'
import type {
  CurrencyTotals,
  EntryKind,
  EntryStatus,
  HuntEntry,
  HuntOverview,
  HuntSettings,
  HuntStatus,
  HuntSummary,
  OverviewHighlight,
  OverviewHunt,
  OverviewPeriod,
} from '@/lib/hunt/stats'

export function getHuntDb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export type HuntDb = ReturnType<typeof getHuntDb>

interface HuntRow {
  id: string
  number: number
  name: string | null
  currency: string | null
  status: HuntStatus
  start_balance: number | string
  started_at: string | null
  ended_at: string | null
  created_at: string
}

interface EntryRow {
  id: string
  position: number
  game_name: string
  game_image_url: string | null
  bet_size: number | string
  payout: number | string | null
  called_by: string | null
  status: EntryStatus
  kind: EntryKind | null
  created_at: string
}

export function toHuntSummary(row: HuntRow): HuntSummary {
  return {
    id: row.id,
    number: row.number,
    name: row.name,
    currency: currencyOrDefault(row.currency),
    status: row.status,
    startBalance: Number(row.start_balance),
    startedAt: row.started_at,
    endedAt: row.ended_at,
    createdAt: row.created_at,
  }
}

export async function findHuntById(db: HuntDb, id: string): Promise<HuntSummary | null> {
  const { data } = await db.from('bonus_hunts').select('*').eq('id', id).maybeSingle()
  return data ? toHuntSummary(data as HuntRow) : null
}

// An explicit hunt id wins; otherwise fall back to the live (or latest) hunt.
export async function resolveHunt(db: HuntDb, id: unknown): Promise<HuntSummary | null> {
  return typeof id === 'string' && id ? findHuntById(db, id) : findCurrentHunt(db)
}

interface OverviewEntryRow {
  hunt_id: string
  game_name: string
  game_image_url: string | null
  bet_size: number | string
  payout: number | string | null
  status: EntryStatus
}

async function loadOverviewEntries(db: HuntDb, huntIds: string[]) {
  const rows: OverviewEntryRow[] = []
  for (let i = 0; i < huntIds.length; i += 100) {
    const ids = huntIds.slice(i, i + 100)
    for (let from = 0; ; from += 1000) {
      const { data } = await db
        .from('bonus_hunt_entries')
        .select('hunt_id, game_name, game_image_url, bet_size, payout, status')
        .in('hunt_id', ids)
        .order('id')
        .range(from, from + 999)
      const page = (data ?? []) as OverviewEntryRow[]
      rows.push(...page)
      if (page.length < 1000) break
    }
  }
  return rows
}

const PERIOD_DAYS: Record<Exclude<OverviewPeriod, 'all'>, number> = { '30d': 30, '7d': 7 }

// Every hunt in one list; money totals are kept per currency because there is no conversion.
export async function loadOverview(db: HuntDb, period: OverviewPeriod): Promise<HuntOverview> {
  let query = db.from('bonus_hunts').select('*').order('number', { ascending: false })
  if (period !== 'all') {
    query = query.gte('created_at', new Date(Date.now() - PERIOD_DAYS[period] * 86_400_000).toISOString())
  }
  const huntRows = ((await query).data ?? []) as HuntRow[]
  const entryRows = await loadOverviewEntries(
    db,
    huntRows.map((row) => row.id)
  )

  const byHunt = new Map<string, OverviewEntryRow[]>()
  for (const row of entryRows) byHunt.set(row.hunt_id, [...(byHunt.get(row.hunt_id) ?? []), row])

  const hunts: OverviewHunt[] = huntRows.map((row) => {
    const entries = byHunt.get(row.id) ?? []
    const opened = entries.filter((e) => e.status === 'opened' && e.payout !== null)
    const winnings = opened.reduce((sum, e) => sum + Number(e.payout), 0)
    const startBalance = Number(row.start_balance)
    const finished = row.status === 'ended' || (entries.length > 0 && opened.length === entries.length)
    const pnl = finished ? winnings - startBalance : null
    return {
      id: row.id,
      number: row.number,
      name: row.name,
      status: row.status,
      currency: currencyOrDefault(row.currency),
      date: row.started_at ?? row.created_at,
      startBalance,
      bonuses: entries.length,
      opened: opened.length,
      winnings,
      pnl,
      pnlPercent: pnl !== null && startBalance > 0 ? (pnl / startBalance) * 100 : null,
    }
  })

  const finishedHunts = hunts.filter((h) => h.pnl !== null)
  const numberById = new Map(huntRows.map((row) => [row.id, row.number]))
  const currencyById = new Map(hunts.map((h) => [h.id, h.currency]))

  const highlight = (
    pick: (e: OverviewEntryRow) => number,
    better: (a: number, b: number) => boolean,
    only?: Currency
  ) => {
    let best: { row: OverviewEntryRow; value: number } | null = null
    for (const row of entryRows) {
      if (row.status !== 'opened' || row.payout === null) continue
      if (only && currencyById.get(row.hunt_id) !== only) continue
      const value = pick(row)
      if (!Number.isFinite(value)) continue
      if (!best || better(value, best.value)) best = { row, value }
    }
    return best
  }
  const multiplier = (e: OverviewEntryRow) => (Number(e.bet_size) > 0 ? Number(e.payout) / Number(e.bet_size) : NaN)

  const usedCurrencies = CURRENCIES.filter((code) => hunts.some((h) => h.currency === code))
  const picks = {
    highestWins: usedCurrencies.flatMap((code) => {
      const best = highlight((e) => Number(e.payout), (a, b) => a > b, code)
      return best ? [best] : []
    }),
    highestMulti: highlight(multiplier, (a, b) => a > b),
    lowestMulti: highlight(multiplier, (a, b) => a < b),
  }

  const images = await findSlotImages(
    db,
    [...picks.highestWins, picks.highestMulti, picks.lowestMulti].flatMap((p) => (p ? [p.row.game_name] : []))
  )
  const toHighlight = (pick: { row: OverviewEntryRow; value: number } | null): OverviewHighlight | null => {
    if (!pick) return null
    const known = images.get(normalizeSlotName(pick.row.game_name))
    return {
      game: known?.displayName ?? pick.row.game_name,
      imageUrl: known?.imageUrl ?? pick.row.game_image_url ?? null,
      value: pick.value,
      huntNumber: numberById.get(pick.row.hunt_id) ?? 0,
      currency: currencyById.get(pick.row.hunt_id) ?? DEFAULT_CURRENCY,
    }
  }

  const totals: CurrencyTotals[] = usedCurrencies.map((code) => {
    const finished = finishedHunts.filter((h) => h.currency === code)
    const totalCost = finished.reduce((sum, h) => sum + h.startBalance, 0)
    const winnings = finished.reduce((sum, h) => sum + h.winnings, 0)
    return { currency: code, totalCost, winnings, pnl: winnings - totalCost }
  })

  return {
    period,
    hunts,
    stats: {
      huntCount: hunts.length,
      totals,
      highestWins: picks.highestWins.flatMap((p) => toHighlight(p) ?? []),
      highestMulti: toHighlight(picks.highestMulti),
      lowestMulti: toHighlight(picks.lowestMulti),
    },
  }
}

export async function loadSettings(db: HuntDb): Promise<HuntSettings> {
  const { data } = await db
    .from('bonus_hunt_settings')
    .select('hunt_on, max_calls_per_user, reject_duplicates')
    .eq('id', 1)
    .maybeSingle()
  return {
    huntOn: Boolean(data?.hunt_on),
    maxCallsPerUser: Math.max(1, Number(data?.max_calls_per_user ?? 1)),
    rejectDuplicates: Boolean(data?.reject_duplicates),
  }
}

export async function findLiveHunt(db: HuntDb): Promise<HuntSummary | null> {
  const { data } = await db
    .from('bonus_hunts')
    .select('*')
    .eq('status', 'live')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ? toHuntSummary(data as HuntRow) : null
}

// Live hunt if there is one, otherwise the most recent hunt so results stay visible after it ends.
export async function findCurrentHunt(db: HuntDb): Promise<HuntSummary | null> {
  const live = await findLiveHunt(db)
  if (live) return live
  const { data } = await db
    .from('bonus_hunts')
    .select('*')
    .order('number', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ? toHuntSummary(data as HuntRow) : null
}

export async function findSlotImages(db: HuntDb, names: string[]) {
  const keys = [...new Set(names.map(normalizeSlotName).filter(Boolean))]
  const images = new Map<string, { displayName: string; imageUrl: string | null }>()
  if (keys.length === 0) return images
  const { data } = await db.from('slots').select('name_key, display_name, image_url').in('name_key', keys)
  for (const row of data ?? []) {
    images.set(row.name_key, { displayName: row.display_name, imageUrl: row.image_url })
  }
  return images
}

export async function loadEntries(db: HuntDb, huntId: string): Promise<HuntEntry[]> {
  const { data } = await db
    .from('bonus_hunt_entries')
    .select('*')
    .eq('hunt_id', huntId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  const rows = (data ?? []) as EntryRow[]
  const images = await findSlotImages(
    db,
    rows.map((r) => r.game_name)
  )

  return rows.map((row) => ({
    id: row.id,
    position: row.position,
    game: row.game_name,
    imageUrl: images.get(normalizeSlotName(row.game_name))?.imageUrl ?? row.game_image_url ?? null,
    betSize: Number(row.bet_size),
    payout: row.payout === null ? null : Number(row.payout),
    calledBy: row.called_by,
    status: row.status,
    kind: row.kind ?? 'regular',
    createdAt: row.created_at,
  }))
}

export async function nextPosition(db: HuntDb, huntId: string) {
  const { data } = await db
    .from('bonus_hunt_entries')
    .select('position')
    .eq('hunt_id', huntId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data?.position ?? 0) + 1
}
