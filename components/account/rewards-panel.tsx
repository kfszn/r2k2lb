'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Gift, Trophy, AlertCircle } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Claim {
  id: string
  platform: 'roobet' | 'luxdrop'
  category: 'wager_milestone' | 'lossback' | 'tournament' | 'deposit_bonus' | 'giveaway' | 'raffle'
  title: string
  amount: number
  status: 'pending' | 'approved' | 'paid'
  period_label: string | null
  notes: string | null
  created_at: string
}

interface Tier {
  id: string
  platform: 'roobet' | 'luxdrop'
  tier_name: string
  wager_threshold: number
  reward_amount: number
}

interface PlatformProgress {
  username: string
  wagerTotal: number | null
  wagerTotalError: boolean
  tiers: Tier[]
  currentTier: Tier | null
  nextTier: Tier | null
  amountToNextTier: number | null
  periodLabel: string
  currentPeriodReward: number
  allTimeReward: number
}

interface RewardsData {
  claims: Claim[]
  progress: { roobet: PlatformProgress | null; luxdrop: PlatformProgress | null }
}

const CATEGORY_LABELS: Record<Claim['category'], string> = {
  wager_milestone: 'Wager Milestone',
  lossback: 'Lossback',
  tournament: 'Tournament',
  deposit_bonus: 'Deposit Bonus',
  giveaway: 'Giveaway',
  raffle: 'Raffle',
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Claim['category'][]

const STATUS_STYLES: Record<Claim['status'], string> = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  approved: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  paid: 'bg-green-500/10 text-green-500 border-green-500/20',
}

const STATUS_LABELS: Record<Claim['status'], string> = {
  pending: 'Pending',
  approved: 'Approved',
  paid: 'Paid',
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount)
}

function PlatformMilestoneProgress({ platform, progress }: { platform: 'roobet' | 'luxdrop'; progress: PlatformProgress }) {
  const label = platform === 'roobet' ? 'Roobet' : 'LuxDrop'

  if (progress.wagerTotalError || progress.wagerTotal === null) {
    return (
      <div className="rounded-lg border border-border/40 bg-background/40 p-3 flex items-center gap-2 text-xs text-muted-foreground">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        Couldn&apos;t load live {label} wager progress right now.
      </div>
    )
  }

  const { wagerTotal, currentTier, nextTier, amountToNextTier, periodLabel, currentPeriodReward, allTimeReward } = progress
  const rangeStart = currentTier?.wager_threshold ?? 0
  const rangeEnd = nextTier?.wager_threshold ?? Math.max(rangeStart, wagerTotal)
  const pct = rangeEnd > rangeStart ? Math.min(100, ((wagerTotal - rangeStart) / (rangeEnd - rangeStart)) * 100) : 100

  return (
    <div className="rounded-lg border border-border/40 bg-background/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{periodLabel}</span>
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold text-foreground">{formatMoney(wagerTotal)}</span>
        {currentTier && (
          <Badge variant="outline" className="text-xs">
            {currentTier.tier_name} unlocked
          </Badge>
        )}
      </div>

      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>

      {nextTier ? (
        <p className="text-xs text-muted-foreground">
          {formatMoney(amountToNextTier ?? 0)} more to unlock <span className="text-foreground">{nextTier.tier_name}</span> ({formatMoney(nextTier.reward_amount)})
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">All available tiers unlocked for this period.</p>
      )}

      <div className="grid grid-cols-2 gap-2 border-t border-border/30 pt-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">This Period</p>
          <p className="text-sm font-semibold text-foreground">{formatMoney(currentPeriodReward)}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">All Time</p>
          <p className="text-sm font-semibold text-foreground">{formatMoney(allTimeReward)}</p>
        </div>
      </div>
    </div>
  )
}

export function RewardsPanel() {
  const { data } = useSWR<RewardsData>('/api/account/rewards', fetcher)
  const [activeCategory, setActiveCategory] = useState<Claim['category'] | 'all'>('all')

  if (!data) return null

  const { claims, progress } = data
  const hasAnyPlatform = progress.roobet || progress.luxdrop
  const filteredClaims = activeCategory === 'all' ? claims : claims.filter((c) => c.category === activeCategory)

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground font-semibold">
          <Gift className="h-4 w-4 text-primary" />
          Rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {hasAnyPlatform ? (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Wager Milestones</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {progress.roobet && <PlatformMilestoneProgress platform="roobet" progress={progress.roobet} />}
              {progress.luxdrop && <PlatformMilestoneProgress platform="luxdrop" progress={progress.luxdrop} />}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Link your Roobet or LuxDrop account above to track live wager milestone progress.
          </p>
        )}

        <div className="space-y-3 border-t border-border/30 pt-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Claim History</p>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                activeCategory === 'all'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-transparent text-muted-foreground border-border/40 hover:text-foreground'
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-transparent text-muted-foreground border-border/40 hover:text-foreground'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {filteredClaims.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No claims recorded yet.</p>
          ) : (
            <ul className="divide-y divide-border/30">
              {filteredClaims.map((claim) => (
                <li key={claim.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Trophy className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium">{claim.title}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">{claim.platform}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[claim.category]}
                      {claim.period_label ? ` · ${claim.period_label}` : ''}
                      {' · '}
                      {new Date(claim.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {claim.notes && <p className="text-xs text-muted-foreground italic">{claim.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-sm font-semibold text-foreground">{formatMoney(claim.amount)}</span>
                    <span className={`text-[10px] rounded-full px-2 py-0.5 font-medium border ${STATUS_STYLES[claim.status]}`}>
                      {STATUS_LABELS[claim.status]}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
