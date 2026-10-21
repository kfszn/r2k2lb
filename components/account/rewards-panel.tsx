'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Gift, Trophy, AlertCircle, Target, Users2, History } from 'lucide-react'
import { ReferralProgress } from './referral-progress'
import { WelcomeBonusCard } from './welcome-bonus-card'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Claim {
  id: string
  platform: 'roobet' | 'luxdrop'
  category: 'wager_milestone' | 'lossback' | 'tournament' | 'deposit_bonus' | 'giveaway' | 'raffle' | 'leaderboard' | 'referral' | 'welcome_bonus'
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
  allTimeWager: number | null
  tiers: Tier[]
  currentTier: Tier | null
  nextTier: Tier | null
  amountToNextTier: number | null
  periodLabel: string
  monthEligible: number
  monthClaimed: number
  monthAvailable: number
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
  leaderboard: 'Leaderboard Prize',
  referral: 'Referral Bonus',
  welcome_bonus: 'Welcome Bonus',
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

  const { wagerTotal, allTimeWager, currentTier, nextTier, amountToNextTier, periodLabel, monthClaimed, monthAvailable, allTimeReward } = progress
  const rangeStart = currentTier?.wager_threshold ?? 0
  const rangeEnd = nextTier?.wager_threshold ?? Math.max(rangeStart, wagerTotal)
  const pct = rangeEnd > rangeStart ? Math.min(100, ((wagerTotal - rangeStart) / (rangeEnd - rangeStart)) * 100) : 100

  return (
    <div className="rounded-lg border border-border/40 bg-background/40 p-3 sm:p-4 space-y-2.5 sm:space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-[11px] sm:text-xs text-muted-foreground truncate">{periodLabel}</span>
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Weighted wager</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="min-w-0 rounded-md border border-primary/25 bg-primary/5 px-2.5 py-1.5">
            <p className="text-[10px] font-medium uppercase leading-tight text-muted-foreground">This Month</p>
            <p className="text-base sm:text-lg font-bold text-primary tabular-nums truncate">{formatMoney(wagerTotal)}</p>
          </div>
          <div className="min-w-0 rounded-md border border-border/40 bg-muted/30 px-2.5 py-1.5">
            <p className="text-[10px] font-medium uppercase leading-tight text-muted-foreground">All-Time</p>
            <p className="text-base sm:text-lg font-bold text-foreground tabular-nums truncate">{allTimeWager !== null ? formatMoney(allTimeWager) : '—'}</p>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          {currentTier ? (
            <Badge variant="outline" className="text-[11px] sm:text-xs">
              {currentTier.tier_name} unlocked
            </Badge>
          ) : (
            <span className="text-[11px] text-muted-foreground">No tier unlocked yet</span>
          )}
          <span className="text-[11px] text-muted-foreground tabular-nums">{Math.round(pct)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        {nextTier ? (
          <p className="text-[11px] sm:text-xs leading-snug text-muted-foreground">
            {formatMoney(amountToNextTier ?? 0)} more to unlock <span className="text-foreground">{nextTier.tier_name}</span> ({formatMoney(nextTier.reward_amount)})
          </p>
        ) : (
          <p className="text-[11px] sm:text-xs text-muted-foreground">All available tiers unlocked for this month.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-border/30 pt-2.5 sm:pt-3">
        <div className="min-w-0 rounded-md border border-border/40 bg-muted/30 px-2.5 py-1.5">
          <p className="text-[10px] font-medium uppercase leading-tight text-muted-foreground">Current Month Claim</p>
          <p className="text-base sm:text-lg font-bold text-foreground tabular-nums truncate">{formatMoney(monthClaimed)}</p>
        </div>
        <div className="min-w-0 rounded-md border border-emerald-500/25 bg-emerald-500/5 px-2.5 py-1.5">
          <p className="text-[10px] font-medium uppercase leading-tight text-muted-foreground">Currently Available</p>
          <p className="text-base sm:text-lg font-bold text-emerald-400 tabular-nums truncate">{formatMoney(monthAvailable)}</p>
        </div>
        <div className="col-span-2 flex items-center justify-between gap-2 rounded-md border border-border/40 bg-muted/30 px-2.5 py-1.5">
          <p className="text-[10px] font-medium uppercase text-muted-foreground">All Time Claimed</p>
          <p className="text-sm font-bold text-foreground tabular-nums">{formatMoney(allTimeReward)}</p>
        </div>
      </div>

      <p className="text-[10px] leading-snug text-muted-foreground italic">
        Unclaimed wager progress expires and resets to zero at the start of each new month.
      </p>
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
    <Card className="gap-0 rounded-none border-0 bg-transparent py-0 shadow-none sm:gap-6 sm:rounded-xl sm:border sm:border-border/40 sm:bg-card/50 sm:py-6 sm:backdrop-blur-sm">
      <CardHeader className="hidden sm:grid">
        <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground font-semibold">
          <Gift className="h-4 w-4 text-primary" />
          Rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <Tabs defaultValue="milestones" className="space-y-3 sm:space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="milestones" className="gap-1.5 text-xs">
              <Target className="h-3.5 w-3.5" />
              Milestones
            </TabsTrigger>
            <TabsTrigger value="referrals" className="gap-1.5 text-xs">
              <Users2 className="h-3.5 w-3.5" />
              Referrals
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 text-xs">
              <History className="h-3.5 w-3.5" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="milestones" className="space-y-3 mt-0">
            {progress.roobet && <WelcomeBonusCard />}
            {hasAnyPlatform ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {progress.roobet && <PlatformMilestoneProgress platform="roobet" progress={progress.roobet} />}
                {progress.luxdrop && <PlatformMilestoneProgress platform="luxdrop" progress={progress.luxdrop} />}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Link your Roobet or LuxDrop account above to track live wager milestone progress.
              </p>
            )}
          </TabsContent>

          <TabsContent value="referrals" className="mt-0">
            <ReferralProgress />
          </TabsContent>

          <TabsContent value="history" className="space-y-3 mt-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Claim History</p>
              <Select value={activeCategory} onValueChange={(v) => setActiveCategory(v as Claim['category'] | 'all')}>
                <SelectTrigger size="sm" className="w-[150px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
