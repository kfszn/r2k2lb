import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { MilestoneTierRow, type MilestoneTier } from '@/components/milestones/milestone-tier-row'
import { AlertCircle, TrendingUp } from 'lucide-react'

export const metadata: Metadata = generatePageMetadata('perksAcebetWagerRewards')

const SIGNUP_URL = 'https://www.acebet.co/welcome/r/r2k2'
const DISCORD_URL = 'https://discord.gg/RsjSPzGKTR'
const SPONSOR = 'AceBet'

// $10 per $10,000 wagered — payout = wager / 10,000 * 10
const TIERS: MilestoneTier[] = [
  { tier: 1,  label: 'Bronze I',    wager: 25_000,     payout: 25 },
  { tier: 2,  label: 'Bronze II',   wager: 50_000,     payout: 50 },
  { tier: 3,  label: 'Silver I',    wager: 100_000,    payout: 100 },
  { tier: 4,  label: 'Silver II',   wager: 250_000,    payout: 250 },
  { tier: 5,  label: 'Gold I',      wager: 500_000,    payout: 500 },
  { tier: 6,  label: 'Gold II',     wager: 750_000,    payout: 750 },
  { tier: 7,  label: 'Platinum I',  wager: 1_000_000,  payout: 1_000 },
  { tier: 8,  label: 'Platinum II', wager: 1_500_000,  payout: 1_500 },
  { tier: 9,  label: 'Diamond I',   wager: 2_000_000,  payout: 2_000 },
  { tier: 10, label: 'Diamond II',  wager: 3_000_000,  payout: 3_000 },
  { tier: 11, label: 'Elite',       wager: 5_000_000,  payout: 5_000 },
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
              claim. Resets monthly — don&apos;t let rewards expire.
            </p>
          </div>

          {/* Tier table */}
          <div className="rounded-xl border border-border/40 bg-card/40 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[44px_1fr_1fr_100px_140px] gap-4 px-5 py-2.5 border-b border-border/40 bg-muted/20">
              <div />
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Tier</p>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Wager Required</p>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground text-right">Reward</p>
              <div />
            </div>

            {/* Rows */}
            {TIERS.map((tier, i) => (
              <MilestoneTierRow
                key={tier.tier}
                tier={tier}
                discordUrl={DISCORD_URL}
                isLast={i === TIERS.length - 1}
              />
            ))}
          </div>

          {/* Important notice */}
          <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-destructive">Monthly Reset:</span> Wager totals reset at the start of
              each month. Unclaimed rewards do not carry over. Open a ticket before month-end with your wager screenshot.
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
