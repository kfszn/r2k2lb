'use client'

import useSWR from 'swr'
import { Wallet, TrendingUp, CheckCircle2, Clock, Target, BadgeCheck } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface PlatformWagerRewards {
  wagerTotalError: boolean
  monthClaimed: number
  monthAvailable: number
  allTimeReward: number
}

interface RewardsSummaryData {
  aggregates?: { earned: number; paidOut: number; claimable: number; pending: number }
  allTimeWagerByPlatform?: { roobet: number | null; luxdrop: number | null }
  progress?: { roobet: PlatformWagerRewards | null; luxdrop: PlatformWagerRewards | null }
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
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className="opacity-60 shrink-0">{icon}</span>
      </div>
      <p className="text-lg font-bold tabular-nums truncate">{value}</p>
    </div>
  )
}

function WagerRewardsGroup({ platformLabel, rewards }: { platformLabel: string; rewards: PlatformWagerRewards }) {
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Target className="h-3.5 w-3.5 text-primary" />
        {platformLabel} Wager Rewards
      </p>
      {rewards.wagerTotalError ? (
        <p className="text-xs text-muted-foreground">Couldn&apos;t load live {platformLabel} wager progress right now.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <SummaryStat label="Current Month Claim" value={formatMoney(rewards.monthClaimed)} icon={<BadgeCheck className="h-4 w-4" />} tone="muted" />
          <SummaryStat label="Currently Available" value={formatMoney(rewards.monthAvailable)} icon={<Wallet className="h-4 w-4" />} tone="green" />
        </div>
      )}
    </div>
  )
}

/**
 * Aggregate reward stat cards for the "Rewards Summary" account panel —
 * pulls from the same /api/account/rewards endpoint RewardsPanel already
 * uses. The per-platform wager reward numbers come from the same shared
 * calculation the admin panel uses when posting a claim.
 */
export function RewardsSummary() {
  const { data, isLoading } = useSWR<RewardsSummaryData>('/api/account/rewards', fetcher)

  const allTimeWager = (data?.allTimeWagerByPlatform?.roobet ?? 0) + (data?.allTimeWagerByPlatform?.luxdrop ?? 0)
  const aggregates = data?.aggregates ?? { earned: 0, paidOut: 0, claimable: 0, pending: 0 }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading rewards summary...</p>
  }

  return (
    <div className="space-y-4">
      {data?.progress?.roobet && <WagerRewardsGroup platformLabel="Roobet" rewards={data.progress.roobet} />}
      {data?.progress?.luxdrop && <WagerRewardsGroup platformLabel="LuxDrop" rewards={data.progress.luxdrop} />}

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">All Rewards</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <SummaryStat label="All-Time Wager" value={formatMoney(allTimeWager)} icon={<TrendingUp className="h-4 w-4" />} tone="muted" />
          <SummaryStat label="Earned" value={formatMoney(aggregates.earned)} icon={<Wallet className="h-4 w-4" />} tone="primary" />
          <SummaryStat label="Paid Out" value={formatMoney(aggregates.paidOut)} icon={<CheckCircle2 className="h-4 w-4" />} tone="green" />
          <SummaryStat label="Approved" value={formatMoney(aggregates.claimable)} icon={<BadgeCheck className="h-4 w-4" />} tone="blue" />
          <SummaryStat label="Pending" value={formatMoney(aggregates.pending)} icon={<Clock className="h-4 w-4" />} tone="amber" />
        </div>
      </div>
    </div>
  )
}
