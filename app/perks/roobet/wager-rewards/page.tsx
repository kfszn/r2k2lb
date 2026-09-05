import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { type MilestoneTier } from '@/components/milestones/milestone-tier-row'
import { MilestoneTracker } from '@/components/milestones/milestone-tracker'
import { TrendingUp } from 'lucide-react'

export const metadata: Metadata = generatePageMetadata('perksRoobetWagerRewards')

const SIGNUP_URL = 'https://roobet.com/?ref=R2K2'
const DISCORD_URL = 'https://discord.gg/DwpA8vaGPj'
const SPONSOR = 'Roobet'

// $50 per $10,000 weighted wagered — cumulative payout = weightedWager / 10,000 * 50
// claimable = this tier's payout minus the previous tier's payout (delta paid out)
// Rewards do not stack — the difference from your last claim is what gets paid.
const TIERS: MilestoneTier[] = [
  { tier: 1, label: 'Beginner I',   wager:     10_000, payout:     50, claimable:     50 },
  { tier: 2, label: 'Beginner II',  wager:     25_000, payout:    125, claimable:     75 },
  { tier: 3, label: 'Beginner III', wager:     50_000, payout:    250, claimable:    125 },
  { tier: 4, label: 'Casual I',     wager:    100_000, payout:    500, claimable:    250 },
  { tier: 5, label: 'Casual II',    wager:    150_000, payout:    750, claimable:    250 },
  { tier: 6, label: 'Roller I',     wager:    200_000, payout:  1_000, claimable:    250 },
  { tier: 7, label: 'Whale I',      wager:    500_000, payout:  2_500, claimable:  1_500 },
  { tier: 8, label: 'Legend',       wager:  1_000_000, payout:  5_000, claimable:  2_500 },
]

export default function RoobetWagerRewardsPage() {
  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Page header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Wager Rewards</h1>
            </div>
            <p className="text-muted-foreground">
              Earn <span className="text-foreground font-medium">$50 per $10,000 weighted wagered</span> on {SPONSOR} with code{' '}
              <span className="text-primary font-mono font-bold">R2K2</span>. Hit a milestone, open a Discord ticket to
              claim your reward.
            </p>
          </div>

          {/* Personal progress + tier table — Wager Rewards runs on its own
              30-day cycle, independent of the weekly leaderboard resets. */}
          <MilestoneTracker
            platform="roobet"
            sponsor={SPONSOR}
            tiers={TIERS}
            discordUrl={DISCORD_URL}
            cycle="rewards"
          />

          {/* Weighted wager note */}
          <div className="rounded-xl border border-border/40 bg-card/30 px-4 py-3 space-y-1.5">
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-semibold">What is weighted wager?</span>{' '}
              Roobet weights your wager by game type — different games count towards your total at
              different rates (slots typically count more than table games or low house-edge games).
              Your weighted wager is what determines your tier progress here.
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-semibold">How claiming works:</span>{' '}
              Milestones are claimable at any point once you are{' '}
              <span className="text-foreground font-medium">$10,000+ weighted wagered beyond your last claim</span>.
              Rewards do not stack — you receive the <span className="text-foreground font-medium">difference</span> between
              your current milestone and the last one you claimed (shown as <span className="text-emerald-400 font-medium">+$X claim</span> on each row).
            </p>
            <p className="text-sm text-muted-foreground">
              Wager Rewards run on their own{' '}
              <span className="text-foreground font-medium">30-day cycle</span> — separate from the weekly {SPONSOR}
              leaderboard, so your progress accumulates across all of that month&apos;s weekly leaderboards instead of
              resetting every 7 days. Open a ticket in Discord before the cycle ends to claim.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <a href={SIGNUP_URL} target="_blank" rel="noopener noreferrer">
              <Button size="sm">Sign Up with Code R2K2</Button>
            </a>
            <Link href="/leaderboard/roobet">
              <Button variant="outline" size="sm">Back to {SPONSOR} Leaderboard</Button>
            </Link>
          </div>

        </div>
      </main>
    </div>
  )
}
