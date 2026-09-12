'use client'

import useSWR from 'swr'
import { Wallet, TrendingUp, CheckCircle2, Clock } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface RewardsSummaryData {
  aggregates?: { earned: number; paidOut: number; claimable: number; pending: number }
  allTimeWagerByPlatform?: { roobet: number | null; luxdrop: number | null }
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)
}

interface SummaryStatProps {
  label: string
  value: string
  icon: React.ReactNode
  tone: 'muted' | 'primary' | 'green' | 'blue' | 'amber'
}

function SummaryStat({ label, value, icon, tone }: SummaryStatProps) {
  const toneMap = {
    muted: 'border-border/40 text-foreground',
    primary: 'border-primary/25 text-primary',
    green: 'border-emerald-500/25 text-emerald-400',
    blue: 'border-sky-500/25 text-sky-400',
    amber: 'border-amber-500/25 text-amber-400',
  }[tone]

  return (
    <div className={`rounded-lg border ${toneMap} bg-background/40 px-4 py-3 space-y-1`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className="opacity-60">{icon}</span>
      </div>
      <p className="text-lg font-bold tabular-nums truncate">{value}</p>
    </div>
  )
}

/**
 * Aggregate reward stat cards for the "Rewards Summary" account panel —
 * pulls from the same /api/account/rewards endpoint RewardsPanel already
 * uses, just reading the `aggregates` and `allTimeWagerByPlatform` fields
 * added alongside it.
 */
export function RewardsSummary() {
  const { data, isLoading } = useSWR<RewardsSummaryData>('/api/account/rewards', fetcher)

  const allTimeWager = (data?.allTimeWagerByPlatform?.roobet ?? 0) + (data?.allTimeWagerByPlatform?.luxdrop ?? 0)
  const aggregates = data?.aggregates ?? { earned: 0, paidOut: 0, claimable: 0, pending: 0 }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading rewards summary...</p>
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <SummaryStat label="All-Time Wager" value={formatMoney(allTimeWager)} icon={<TrendingUp className="h-4 w-4" />} tone="muted" />
      <SummaryStat label="Earned" value={formatMoney(aggregates.earned)} icon={<Wallet className="h-4 w-4" />} tone="primary" />
      <SummaryStat label="Paid Out" value={formatMoney(aggregates.paidOut)} icon={<CheckCircle2 className="h-4 w-4" />} tone="green" />
      <SummaryStat label="Claimable" value={formatMoney(aggregates.claimable)} icon={<CheckCircle2 className="h-4 w-4" />} tone="blue" />
      <SummaryStat label="Pending" value={formatMoney(aggregates.pending)} icon={<Clock className="h-4 w-4" />} tone="amber" />
    </div>
  )
}
