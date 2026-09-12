'use client'

import useSWR from 'swr'
import { TrendingUp, Trophy, Gift, Link2 } from 'lucide-react'
import { getCurrentRoobetPeriod } from '@/lib/roobet/period'
import { CURRENT_LUXDROP_PERIOD } from '@/lib/luxdrop/period'
import { roobetPrizeForRank } from '@/lib/roobet/leaderboard-rewards'
import { luxdropPrizeForRank } from '@/lib/luxdrop/leaderboard-rewards'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount)
}

interface MiniStatProps {
  label: string
  value: string
  icon: React.ReactNode
  tone: 'primary' | 'accent' | 'amber'
}

function MiniStat({ label, value, icon, tone }: MiniStatProps) {
  const toneMap = {
    primary: 'border-primary/25 text-primary',
    accent: 'border-sky-500/25 text-sky-400',
    amber: 'border-amber-500/25 text-amber-400',
  }[tone]

  return (
    <div className={`rounded-lg border ${toneMap} bg-background/40 px-4 py-3 flex items-center justify-between gap-2`}>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
        <p className="text-lg font-bold tabular-nums truncate">{value}</p>
      </div>
      <span className="opacity-60 shrink-0">{icon}</span>
    </div>
  )
}

function RoobetLeaderboardStats({ username }: { username: string }) {
  const period = getCurrentRoobetPeriod()
  const { data } = useSWR<{ data?: { name?: string; username?: string; wagered?: number }[] }>(
    `/api/leaderboard?start_at=${period.startDate}&end_at=${period.endDate}&fresh=0`,
    fetcher
  )

  const entries = data?.data ?? []
  const sorted = [...entries].sort((a, b) => (b.wagered ?? 0) - (a.wagered ?? 0))
  const rankIndex = sorted.findIndex((e) => (e.name ?? e.username ?? '').toLowerCase() === username.toLowerCase())
  const entry = rankIndex >= 0 ? sorted[rankIndex] : null
  // Roobet's "wagered" units here are penny-equivalent (see /api/leaderboard) — convert back to dollars.
  const wagerDollars = entry ? (entry.wagered ?? 0) / 100 : 0
  const rank = rankIndex >= 0 ? rankIndex + 1 : null
  const prize = rank ? roobetPrizeForRank(rank) : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Roobet Weekly Leaderboard</p>
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live · {period.startDate} – {period.endDate}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="Wager" value={formatMoney(wagerDollars)} icon={<TrendingUp className="h-4 w-4" />} tone="primary" />
        <MiniStat label="Rank" value={rank ? `#${rank}` : 'Unranked'} icon={<Trophy className="h-4 w-4" />} tone="amber" />
        <MiniStat label="Leaderboard Prize" value={formatMoney(prize)} icon={<Gift className="h-4 w-4" />} tone="accent" />
      </div>
    </div>
  )
}

function LuxdropLeaderboardStats({ username }: { username: string }) {
  const { data } = useSWR<
    { data?: { username?: string; name?: string; wagered?: number; wagerAmount?: number; totalWagered?: number }[] }
    | { username?: string; name?: string; wagered?: number; wagerAmount?: number; totalWagered?: number }[]
  >(
    `/api/luxdrop/affiliates?startDate=${CURRENT_LUXDROP_PERIOD.startDate}&endDate=${CURRENT_LUXDROP_PERIOD.endDate}`,
    fetcher
  )

  const raw = Array.isArray(data) ? data : (data?.data ?? [])
  const entries = raw.map((e) => ({ name: e.username ?? e.name ?? '', wagered: e.wagered ?? e.wagerAmount ?? e.totalWagered ?? 0 }))
  const sorted = [...entries].sort((a, b) => b.wagered - a.wagered)
  const rankIndex = sorted.findIndex((e) => e.name.toLowerCase() === username.toLowerCase())
  const entry = rankIndex >= 0 ? sorted[rankIndex] : null
  const wagerDollars = entry?.wagered ?? 0
  const rank = rankIndex >= 0 ? rankIndex + 1 : null
  const prize = rank ? luxdropPrizeForRank(rank) : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">LuxDrop Monthly Leaderboard</p>
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live · {CURRENT_LUXDROP_PERIOD.startDate} – {CURRENT_LUXDROP_PERIOD.endDate}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="Wager" value={formatMoney(wagerDollars)} icon={<TrendingUp className="h-4 w-4" />} tone="primary" />
        <MiniStat label="Rank" value={rank ? `#${rank}` : 'Unranked'} icon={<Trophy className="h-4 w-4" />} tone="amber" />
        <MiniStat label="Leaderboard Prize" value={formatMoney(prize)} icon={<Gift className="h-4 w-4" />} tone="accent" />
      </div>
    </div>
  )
}

function UnlinkedHint({ platform }: { platform: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/40 px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground">
      <Link2 className="h-3.5 w-3.5 shrink-0" />
      Link your {platform} account below to see your leaderboard stats.
    </div>
  )
}

export function LeaderboardStats({
  roobetUsername,
  luxdropUsername,
}: {
  roobetUsername: string | null
  luxdropUsername: string | null
}) {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-card/50 backdrop-blur-sm p-5 space-y-5">
      <div className="flex items-center gap-2.5">
        <Trophy className="h-4 w-4 text-amber-400" />
        <span className="text-sm font-semibold text-foreground">Live Leaderboards</span>
      </div>
      {roobetUsername ? <RoobetLeaderboardStats username={roobetUsername} /> : <UnlinkedHint platform="Roobet" />}
      {luxdropUsername ? <LuxdropLeaderboardStats username={luxdropUsername} /> : <UnlinkedHint platform="LuxDrop" />}
    </div>
  )
}
