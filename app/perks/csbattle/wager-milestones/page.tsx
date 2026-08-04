import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { type MilestoneTier } from '@/components/milestones/milestone-tier-row'
import { MilestoneTracker } from '@/components/milestones/milestone-tracker'
import { Milestone } from 'lucide-react'

export const metadata: Metadata = generatePageMetadata('perksCsbattleWagerMilestones')

const SIGNUP_URL = 'https://csbattle.com/r/r2k2'
const DISCORD_URL = 'https://discord.gg/RsjSPzGKTR'
const SPONSOR = 'CSBattle'

// $10 per $1,000 wagered — payout = wager / 1,000 * 10
const TIERS: MilestoneTier[] = [
  { tier: 1,  label: 'Tier 1',  wager: 1_000,      payout: 10 },
  { tier: 2,  label: 'Tier 2',  wager: 5_000,      payout: 50 },
  { tier: 3,  label: 'Tier 3',  wager: 10_000,     payout: 100 },
  { tier: 4,  label: 'Tier 4',  wager: 25_000,     payout: 250 },
  { tier: 5,  label: 'Tier 5',  wager: 50_000,     payout: 500 },
  { tier: 6,  label: 'Tier 6',  wager: 100_000,    payout: 1_000 },
  { tier: 7,  label: 'Tier 7',  wager: 250_000,    payout: 2_500 },
  { tier: 8,  label: 'Tier 8',  wager: 500_000,    payout: 5_000 },
  { tier: 9,  label: 'Tier 9',  wager: 750_000,    payout: 7_500 },
  { tier: 10, label: 'Tier 10', wager: 1_000_000,  payout: 10_000 },
  { tier: 11, label: 'Tier 11', wager: 2_000_000,  payout: 20_000 },
]

export default function CsbattleWagerMilestonesPage() {
  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Page header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Milestone className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Wager Milestones</h1>
            </div>
            <p className="text-muted-foreground">
              Earn <span className="text-foreground font-medium">$10 per $1,000 wagered</span> on {SPONSOR} with code{' '}
              <span className="text-primary font-mono font-bold">R2K2</span>. Hit a milestone, open a Discord ticket to
              claim your reward.
            </p>
          </div>

          {/* Personal progress + tier table */}
          <MilestoneTracker
            platform="csbattle"
            sponsor={SPONSOR}
            tiers={TIERS}
            discordUrl={DISCORD_URL}
          />

          {/* Info note */}
          <p className="text-sm text-muted-foreground px-1">
            Wager totals are measured over the current {SPONSOR} leaderboard cycle and{' '}
            <span className="text-foreground font-medium">reset with the leaderboard</span>. Open a ticket in Discord to
            claim any milestone you&apos;ve unlocked before the cycle ends.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <a href={SIGNUP_URL} target="_blank" rel="noopener noreferrer">
              <Button size="sm">Sign Up with Code R2K2</Button>
            </a>
            <Link href="/leaderboard/csbattle">
              <Button variant="outline" size="sm">Back to {SPONSOR} Leaderboard</Button>
            </Link>
          </div>

        </div>
      </main>
    </div>
  )
}
