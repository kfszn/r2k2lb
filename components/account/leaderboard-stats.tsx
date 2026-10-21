'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { TrendingUp, Trophy, Gift, Link2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PeriodOption {
  key: string
  label: string
  display: string
  isCurrent: boolean
}

interface HistoryResponse {
  platform: 'roobet' | 'luxdrop'
  username: string | null
  periods: PeriodOption[]
  selected: {
    key: string
    label: string
    display: string
    isCurrent: boolean
    rank: number | null
    wager: number
    prize: number
    participants: number
    claim: { status: string; amount: number } | null
  } | null
}

// Throw on a non-2xx response so SWR surfaces it as `error` instead of
// resolving with the route's `{ error }` payload, which would otherwise
// render indistinguishably from a real "$0 wagered, unranked" player.
const fetcher = (url: string): Promise<HistoryResponse> =>
  fetch(url).then(async (r) => {
    if (!r.ok) throw new Error(`Request failed: ${r.status}`)
    return r.json()
  })

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount)
}

const CLAIM_STYLES: Record<string, string> = {
  pending: 'border-amber-500/30 text-amber-400',
  approved: 'border-sky-500/30 text-sky-400',
  paid: 'border-emerald-500/30 text-emerald-400',
  rejected: 'border-destructive/30 text-destructive',
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
    <div className={`rounded-lg border ${toneMap} bg-background/40 px-2.5 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-2 min-w-0`}>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1 truncate">{label}</p>
        <p className="text-base sm:text-lg font-bold tabular-nums truncate">{value}</p>
      </div>
      <span className="opacity-60 shrink-0 hidden sm:block">{icon}</span>
    </div>
  )
}

function StatsUnavailableHint() {
  return (
    <div className="rounded-lg border border-amber-500/25 bg-background/40 px-3 py-3 flex items-start gap-2 text-xs text-amber-400">
      <Link2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      Leaderboard stats are temporarily unavailable. This is not your real wager or rank, so try refreshing shortly.
    </div>
  )
}

function UnlinkedHint({ platform }: { platform: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-3 flex items-center gap-2 text-xs text-muted-foreground">
      <Link2 className="h-3.5 w-3.5 shrink-0" />
      Link your {platform} account below to see your leaderboard stats.
    </div>
  )
}

function PlatformLeaderboard({
  platform,
  title,
  username,
  wagerLabel,
}: {
  platform: 'roobet' | 'luxdrop'
  title: string
  username: string
  wagerLabel: string
}) {
  const [periodKey, setPeriodKey] = useState('current')
  const { data, error, isLoading } = useSWR(
    `/api/account/leaderboard-history?platform=${platform}&period=${encodeURIComponent(periodKey)}`,
    fetcher,
    { keepPreviousData: true }
  )

  const selected = data?.selected ?? null
  const periods = data?.periods ?? [{ key: 'current', label: 'Current', display: '', isCurrent: true }]
  const showing = selected && selected.key === periodKey
  const loading = isLoading || !showing

  const rankText = loading ? '—' : selected?.rank ? `#${selected.rank}` : 'Unranked'
  const claimStyle = selected?.claim ? (CLAIM_STYLES[selected.claim.status] ?? CLAIM_STYLES.pending) : ''

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {showing && selected ? (
          selected.isCurrent ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          ) : (
            <span className="text-xs text-muted-foreground shrink-0">Final</span>
          )
        ) : null}
      </div>

      <Select value={periodKey} onValueChange={setPeriodKey}>
        <SelectTrigger className="h-11 w-full text-base sm:text-sm" aria-label={`${title} period`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {periods.map((p) => (
            <SelectItem key={p.key} value={p.key} className="py-2.5">
              {p.isCurrent ? `Current · ${p.label}` : p.label}
              {p.display ? <span className="text-muted-foreground"> · {p.display}</span> : null}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error ? (
        <StatsUnavailableHint />
      ) : (
        <>
          <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2">
            <MiniStat label={wagerLabel} value={loading ? '—' : formatMoney(selected?.wager ?? 0)} icon={<TrendingUp className="h-4 w-4" />} tone="primary" />
            <MiniStat label="Rank" value={rankText} icon={<Trophy className="h-4 w-4" />} tone="amber" />
            <MiniStat label="Prize" value={loading ? '—' : formatMoney(selected?.prize ?? 0)} icon={<Gift className="h-4 w-4" />} tone="accent" />
          </div>

          {!loading && selected && (
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
              <span className="min-w-0">
                {selected.display}
                {selected.participants > 0 ? ` · ${selected.participants.toLocaleString()} players` : ''}
                {` · as ${username}`}
              </span>
              {selected.claim ? (
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-semibold capitalize ${claimStyle}`}>
                  Prize {selected.claim.status}
                </span>
              ) : null}
            </div>
          )}
        </>
      )}
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
    <div className="rounded-xl border border-amber-500/30 bg-card/50 backdrop-blur-sm p-4 sm:p-5 space-y-5">
      <div className="flex items-center gap-2.5">
        <Trophy className="h-4 w-4 text-amber-400" />
        <span className="text-sm font-semibold text-foreground">Leaderboards</span>
      </div>
      {roobetUsername ? (
        <PlatformLeaderboard
          platform="roobet"
          title="Roobet Weekly Leaderboard"
          username={roobetUsername}
          wagerLabel="Weighted"
        />
      ) : (
        <UnlinkedHint platform="Roobet" />
      )}
      {luxdropUsername ? (
        <PlatformLeaderboard
          platform="luxdrop"
          title="LuxDrop Monthly Leaderboard"
          username={luxdropUsername}
          wagerLabel="Wager"
        />
      ) : (
        <UnlinkedHint platform="LuxDrop" />
      )}
    </div>
  )
}
