import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getCurrentRoobetPeriod, getCurrentRoobetPeriodLabel } from '@/lib/roobet/period'
import { roobetPrizeForRank } from '@/lib/roobet/leaderboard-rewards'
import { findRoobetRank, getEntryWagered, normalizeRoobetEntries } from '@/lib/roobet/rank'
import { luxdropPrizeForRank } from '@/lib/luxdrop/leaderboard-rewards'
import {
  CURRENT_LUXDROP_LABEL,
  CURRENT_LUXDROP_PERIOD,
  LUXDROP_PREVIOUS_PERIODS,
} from '@/lib/luxdrop/period'

// Never cache — a player's live rank and payout status must always be fresh.
export const dynamic = 'force-dynamic'
export const revalidate = 0

type Platform = 'roobet' | 'luxdrop'

interface PeriodOption {
  key: string
  label: string
  display: string
  isCurrent: boolean
}

interface ClaimInfo {
  status: string
  amount: number
}

interface Selected extends PeriodOption {
  rank: number | null
  wager: number
  prize: number
  participants: number
  claim: ClaimInfo | null
}

interface LuxdropRaw {
  username?: string
  name?: string
  wagered?: number
  wagerAmount?: number
  totalWagered?: number
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function shortDate(dateStr: string): string {
  const d = new Date(`${dateStr.slice(0, 10)}T00:00:00Z`)
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`
}

function formatRange(start: string, end: string): string {
  return `${shortDate(start)} – ${shortDate(end)}`
}

// Claims are matched with ILIKE elsewhere, so escape the wildcard characters a
// username could contain and match case-insensitively but otherwise exactly.
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&')
}

async function fetchClaim(
  admin: SupabaseClient,
  platform: Platform,
  username: string,
  periodLabels: string[]
): Promise<ClaimInfo | null> {
  const { data } = await admin
    .from('reward_claims')
    .select('status, amount')
    .eq('platform', platform)
    .ilike('username', escapeLike(username))
    .eq('category', 'leaderboard')
    .in('period_label', periodLabels)
    .limit(1)
  const row = data?.[0]
  return row ? { status: String(row.status), amount: Number(row.amount) || 0 } : null
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Upstream request failed: ${res.status}`)
  return res.json()
}

async function roobetHistory(
  admin: SupabaseClient,
  origin: string,
  username: string | null,
  requestedKey: string
) {
  const current = getCurrentRoobetPeriod()
  const currentOption: PeriodOption = {
    key: 'current',
    label: getCurrentRoobetPeriodLabel(),
    display: formatRange(current.startDate, current.endDate),
    isCurrent: true,
  }

  const { data: archived, error } = await admin
    .from('roobet_leaderboard_archive')
    .select('label, start_date, end_date')
    .order('start_date', { ascending: false })
  if (error) throw new Error(error.message)

  const archivedOptions: PeriodOption[] = (archived ?? []).map((p) => ({
    key: String(p.label),
    label: String(p.label),
    display: formatRange(String(p.start_date), String(p.end_date)),
    isCurrent: false,
  }))
  const periods = [currentOption, ...archivedOptions]
  const option = periods.find((p) => p.key === requestedKey) ?? currentOption

  if (!username) return { periods, selected: null }

  if (option.isCurrent) {
    const json = await fetchJson(
      `${origin}/api/roobet/affiliates?startDate=${encodeURIComponent(current.startISO)}&endDate=${encodeURIComponent(current.endISO)}`
    )
    const entries = normalizeRoobetEntries(json)
    const result = findRoobetRank(entries, username)
    const rank = result?.rank ?? null
    return {
      periods,
      selected: {
        ...option,
        rank,
        wager: result ? getEntryWagered(result.entry) : 0,
        prize: rank ? roobetPrizeForRank(rank) : 0,
        participants: entries.length,
        claim: null,
      } satisfies Selected,
    }
  }

  const { data: row, error: rowError } = await admin
    .from('roobet_leaderboard_archive')
    .select('rewards, entries')
    .eq('label', option.key)
    .maybeSingle()
  if (rowError) throw new Error(rowError.message)

  const entries = normalizeRoobetEntries(row?.entries)
  const result = findRoobetRank(entries, username)
  const rank = result?.rank ?? null
  // Use the prize schedule saved with the period, not today's, so a later
  // change to the prize table never rewrites what a finished week paid.
  const savedRewards: unknown = row?.rewards
  const savedPrize =
    rank && Array.isArray(savedRewards) && typeof savedRewards[rank - 1] === 'number'
      ? (savedRewards[rank - 1] as number)
      : null
  const prize = rank ? (savedPrize ?? roobetPrizeForRank(rank)) : 0
  const claim = rank && prize > 0 ? await fetchClaim(admin, 'roobet', username, [option.label]) : null

  return {
    periods,
    selected: {
      ...option,
      rank,
      wager: result ? getEntryWagered(result.entry) : 0,
      prize,
      participants: entries.length,
      claim,
    } satisfies Selected,
  }
}

async function luxdropHistory(
  admin: SupabaseClient,
  origin: string,
  username: string | null,
  requestedKey: string
) {
  const currentOption: PeriodOption = {
    key: 'current',
    label: CURRENT_LUXDROP_LABEL,
    display: formatRange(CURRENT_LUXDROP_PERIOD.startDate, CURRENT_LUXDROP_PERIOD.endDate),
    isCurrent: true,
  }
  const pastOptions: PeriodOption[] = LUXDROP_PREVIOUS_PERIODS.map((p) => ({
    key: p.label,
    label: p.label,
    display: formatRange(p.start_at, p.end_at),
    isCurrent: false,
  }))
  const periods = [currentOption, ...pastOptions]
  const option = periods.find((p) => p.key === requestedKey) ?? currentOption
  if (!username) return { periods, selected: null }

  const past = option.isCurrent ? null : LUXDROP_PREVIOUS_PERIODS.find((p) => p.label === option.key) ?? null
  const startDate = past ? past.start_at : CURRENT_LUXDROP_PERIOD.startDate
  const endDate = past ? past.end_at : CURRENT_LUXDROP_PERIOD.endDate

  const json = (await fetchJson(
    `${origin}/api/luxdrop/affiliates?startDate=${startDate}&endDate=${endDate}`
  )) as LuxdropRaw[] | { data?: LuxdropRaw[] }
  const raw = Array.isArray(json) ? json : (json?.data ?? [])

  // Rank exactly as the public LuxDrop page and the finalize-period payout do:
  // by wagered amount, highest first.
  const sorted = raw
    .map((e) => ({
      name: e.username ?? e.name ?? '',
      wagered: e.wagered ?? e.wagerAmount ?? e.totalWagered ?? 0,
    }))
    .filter((e) => e.name)
    .sort((a, b) => b.wagered - a.wagered)
  const index = sorted.findIndex((e) => e.name.toLowerCase() === username.toLowerCase())
  const rank = index >= 0 ? index + 1 : null
  const prize = rank ? (past ? (past.rewards[rank - 1] ?? 0) : luxdropPrizeForRank(rank)) : 0

  // LuxDrop payouts are labeled by whoever finalized the period, so accept
  // either the month name or the default "start – end" label the action falls
  // back to.
  const claimLabels = past ? [past.label, `${past.start_at} – ${past.end_at}`] : []
  const claim = past && rank && prize > 0 ? await fetchClaim(admin, 'luxdrop', username, claimLabels) : null

  return {
    periods,
    selected: {
      ...option,
      rank,
      wager: index >= 0 ? sorted[index].wagered : 0,
      prize,
      participants: sorted.length,
      claim,
    } satisfies Selected,
  }
}

export async function GET(request: NextRequest) {
  const platformParam = request.nextUrl.searchParams.get('platform')
  if (platformParam !== 'roobet' && platformParam !== 'luxdrop') {
    return NextResponse.json({ error: 'platform must be roobet or luxdrop' }, { status: 400 })
  }
  const platform: Platform = platformParam
  const requestedKey = request.nextUrl.searchParams.get('period') ?? 'current'

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // The username always comes from the signed-in player's own profile, never
  // from the request, so one player can't look up another's standings.
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('roobet_username, luxdrop_username')
    .eq('id', session.user.id)
    .maybeSingle()
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  const username: string | null =
    (platform === 'roobet' ? profile?.roobet_username : profile?.luxdrop_username)?.trim() || null
  const origin = request.nextUrl.origin

  try {
    const result =
      platform === 'roobet'
        ? await roobetHistory(admin, origin, username, requestedKey)
        : await luxdropHistory(admin, origin, username, requestedKey)
    return NextResponse.json({ platform, username, ...result }, { headers: { 'Cache-Control': 'no-store, max-age=0' } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load leaderboard history'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
