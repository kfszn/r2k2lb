import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { MilestoneTierRow, type MilestoneTier } from '@/components/milestones/milestone-tier-row'
import { Milestone } from 'lucide-react'

export const metadata: Metadata = generatePageMetadata('perksCsbattleWagerMilestones')

const SIGNUP_URL = 'https://csbattle.com/r/r2k2'
const DISCORD_URL = 'https://discord.gg/RsjSPzGKTR'
const SPONSOR = 'CSBattle'

const TIERS: MilestoneTier[] = [
  { tier: 1,  label: 'Tier 1',  wager: 10_000,     payout: 25 },
  { tier: 2,  label: 'Tier 2',  wager: 25_000,     payout: 50 },
  { tier: 3,  label: 'Tier 3',  wager: 50_000,     payout: 75 },
  { tier: 4,  label: 'Tier 4',  wager: 100_000,    payout: 300 },
  { tier: 5,  label: 'Tier 5',  wager: 250_000,    payout: 600 },
  { tier: 6,  label: 'Tier 6',  wager: 500_000,    payout: 1_000 },
  { tier: 7,  label: 'Tier 7',  wager: 750_000,    payout: 1_400 },
  { tier: 8,  label: 'Tier 8',  wager: 1_000_000,  payout: 1_800 },
  { tier: 9,  label: 'Tier 9',  wager: 1_500_000,  payout: 2_200 },
  { tier: 10, label: 'Tier 10', wager: 2_000_000,  payout: 2_400 },
  { tier: 11, label: 'Tier 11', wager: 5_000_000,  payout: 5_000 },
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
              Tiered lifetime rewards for wagering on {SPONSOR} with code{' '}
              <span className="text-primary font-mono font-bold">R2K2</span>. Hit a milestone, open a Discord ticket to
              claim your reward.
            </p>
          </div>

          {/* Tier table */}
          <div className="rounded-xl border border-border/40 bg-card/40 overflow-hidden">
            {/* Table column headers */}
            <div className="flex items-center gap-4 px-5 py-2.5 border-b border-border/40 bg-muted/20">
              <div className="w-11 shrink-0" />
              <p className="w-28 shrink-0 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Tier</p>
              <p className="flex-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Wager Required</p>
              <p className="w-28 shrink-0 text-right text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Reward</p>
              <div className="shrink-0 ml-2 w-[120px]" />
            </div>

            {TIERS.map((tier, i) => (
              <MilestoneTierRow
                key={tier.tier}
                tier={tier}
                discordUrl={DISCORD_URL}
                isLast={i === TIERS.length - 1}
              />
            ))}
          </div>

          {/* Info note */}
          <p className="text-sm text-muted-foreground px-1">
            Milestones are <span className="text-foreground font-medium">lifetime cumulative</span> — once you hit a tier
            you keep it. Open a ticket in Discord with your wager proof to claim.
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
