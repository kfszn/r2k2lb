import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { type MilestoneTier } from '@/components/milestones/milestone-tier-row'
import { MilestoneTracker } from '@/components/milestones/milestone-tracker'
import { TrendingUp } from 'lucide-react'

export const metadata: Metadata = generatePageMetadata('perksAcebetWagerRewards')

const SIGNUP_URL = 'https://www.acebet.co/welcome/r/r2k2'
const DISCORD_URL = 'https://discord.gg/RsjSPzGKTR'
const SPONSOR = 'AceBet'

// $10 per $10,000 wagered — cumulative payout = wager / 10,000 * 10
// claimable = this tier's payout minus the previous tier's payout (delta paid out)
// Rewards do not stack — the difference from your last claim is what gets paid.
const TIERS: MilestoneTier[] = [
  { tier: 1,  label: 'Beginner I',   wager:    10_000, payout:    20, claimable:    20 },
  { tier: 2,  label: 'Beginner II',  wager:    25_000, payout:    25, claimable:    15 },
  { tier: 3,  label: 'Beginner III', wager:    50_000, payout:    50, claimable:    25 },
  { tier: 4,  label: 'Casual I',     wager:   100_000, payout:   100, claimable:    50 },
  { tier: 5,  label: 'Casual II',    wager:   250_000, payout:   250, claimable:   150 },
  { tier: 6,  label: 'Casual III',   wager:   350_000, payout:   350, claimable:   100 },
  { tier: 7,  label: 'Roller I',     wager:   500_000, payout:   500, claimable:   150 },
  { tier: 8,  label: 'Roller II',    wager:   750_000, payout:   750, claimable:   250 },
  { tier: 9,  label: 'Degen I',      wager: 1_000_000, payout: 1_000, claimable:   250 },
  { tier: 10, label: 'Degen II',     wager: 1_250_000, payout: 1_250, claimable:   250 },
  { tier: 11, label: 'Whale I',      wager: 1_500_000, payout: 1_500, claimable:   250 },
  { tier: 12, label: 'Whale II',     wager: 2_000_000, payout: 2_000, claimable:   500 },
  { tier: 13, label: 'Elite',        wager: 3_000_000, payout: 3_000, claimable: 1_000 },
  { tier: 14, label: 'Legend',       wager: 5_000_000, payout: 5_000, claimable: 2_000 },
]

export default function AceBetWagerRewardsPage() {
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
              Earn <span className="text-foreground font-medium">$10 per $10,000 wagered</span> on {SPONSOR} with code{' '}
              <span className="text-primary font-mono font-bold">R2K2</span>. Hit a milestone, open a Discord ticket to
              claim your reward.
            </p>
          </div>

          {/* Personal progress + tier table */}
          <MilestoneTracker
            platform="acebet"
            sponsor={SPONSOR}
            tiers={TIERS}
            discordUrl={DISCORD_URL}
          />

          {/* Claim rules note */}
          <div className="rounded-xl border border-border/40 bg-card/30 px-4 py-3 space-y-1.5">
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-semibold">How claiming works:</span>{' '}
              Milestones are claimable at any point once you are{' '}
              <span className="text-foreground font-medium">$10,000+ wagered beyond your last claim</span>.
              Rewards do not stack — you receive the <span className="text-foreground font-medium">difference</span> between
              your current milestone and the last one you claimed (shown as <span className="text-emerald-400 font-medium">+$X claim</span> on each row).
            </p>
            <p className="text-sm text-muted-foreground">
              Wager totals reset with the{' '}
              <span className="text-foreground font-medium">{SPONSOR} leaderboard cycle</span>. Open a ticket in Discord
              before the cycle ends to claim.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <a href={SIGNUP_URL} target="_blank" rel="noopener noreferrer">
              <Button size="sm">Sign Up with Code R2K2</Button>
            </a>
            <Link href="/leaderboard/acebet">
              <Button variant="outline" size="sm">Back to {SPONSOR} Leaderboard</Button>
            </Link>
          </div>

        </div>
      </main>
    </div>
  )
}
