import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Trophy, TrendingUp, AlertCircle } from 'lucide-react'

export const metadata: Metadata = generatePageMetadata('perksAcebetWagerRewards')

const SIGNUP_URL = 'https://www.acebet.co/welcome/r/r2k2'
const DISCORD_URL = 'https://discord.gg/RsjSPzGKTR'
const SPONSOR = 'AceBet'

export default function AceBetWagerRewardsPage() {
  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-12">

          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">Wager Rewards</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Earn cash rewards based on your monthly wager volume on {SPONSOR} using code R2K2. Rewards reset monthly.
            </p>
          </div>

          {/* Rate card */}
          <Card className="bg-gradient-to-r from-blue-500/10 via-card to-blue-500/5 border border-blue-500/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20 text-blue-500">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Wager Rewards</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Claimable at $25,000 minimum wagered</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-500">$1</div>
                  <p className="text-xs text-muted-foreground">per $1,000 wagered</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2 p-3 rounded-lg bg-card/50 border border-border/50">
                  <p className="text-sm font-medium text-muted-foreground">Minimum Claim</p>
                  <p className="text-2xl font-bold">$25</p>
                  <p className="text-xs text-muted-foreground">at $25,000 wagered</p>
                </div>
                <div className="space-y-2 p-3 rounded-lg bg-card/50 border border-border/50">
                  <p className="text-sm font-medium text-muted-foreground">Rate</p>
                  <p className="text-2xl font-bold text-blue-500">$1 / $1k</p>
                  <p className="text-xs text-muted-foreground">wagered</p>
                </div>
                <div className="space-y-2 p-3 rounded-lg bg-card/50 border border-border/50">
                  <p className="text-sm font-medium text-muted-foreground">Examples</p>
                  <div className="space-y-1 text-sm font-medium">
                    <p>$50k wagered → $50</p>
                    <p>$100k wagered → $100</p>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Claim any time you have wagered at least $25,000. You are paid the difference since your last claim — not a full reset.
                </p>
              </div>
              <div className="pt-2 space-y-3 border-t border-border/30">
                <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full gap-2" size="sm">
                    <Trophy className="h-4 w-4" />
                    Redeem via Discord
                  </Button>
                </a>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="h-3.5 w-3.5 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-destructive/80">
                    <span className="font-semibold text-destructive">Monthly Reset:</span> You are responsible for redeeming within the month. Unredeemed rewards do not carry over. No exceptions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    step: 1,
                    title: 'Sign Up with Code R2K2',
                    body: `Create your ${SPONSOR} account using code R2K2`,
                  },
                  {
                    step: 2,
                    title: 'Wager Throughout the Month',
                    body: 'Place bets and accumulate wager volume. Rewards scale linearly — $1 per $1,000 wagered.',
                  },
                  {
                    step: 3,
                    title: 'Reach $25,000 Wagered',
                    body: 'Once you hit $25,000 minimum, you can submit a claim via Discord ticket with wager proof.',
                  },
                  {
                    step: 4,
                    title: 'Claim Before Month End',
                    body: 'Rewards are paid as the difference since your last claim. They reset monthly — do not let them expire.',
                  },
                ].map(({ step, title, body }) => (
                  <div key={step} className="flex gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold flex-shrink-0">
                      {step}
                    </div>
                    <div>
                      <p className="font-medium">{title}</p>
                      <p className="text-sm text-muted-foreground">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Important Notes */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Important Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-secondary/20 border border-border/50 space-y-1">
                <p className="text-sm font-medium">Monthly Reset</p>
                <p className="text-sm text-muted-foreground">
                  All wager totals reset at the beginning of each month.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/20 border border-border/50 space-y-1">
                <p className="text-sm font-medium">Incremental Payouts</p>
                <p className="text-sm text-muted-foreground">
                  You are paid the difference between your last claimed wager total and your current total. Example: claim at 100k, then reach 120k — you receive $20 for the additional 20k wagered.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/20 border border-border/50 space-y-1">
                <p className="text-sm font-medium">Redemption Process</p>
                <p className="text-sm text-muted-foreground">
                  Open a ticket in the R2K2 Discord with your wager screenshot. Our team verifies and processes within 24–48 hours.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4 py-4">
            <p className="text-lg text-muted-foreground">Ready to start earning wager rewards?</p>
            <a href={SIGNUP_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                <Trophy className="h-5 w-5" />
                Sign Up on {SPONSOR} with Code R2K2
              </Button>
            </a>
          </div>

          {/* Back Link */}
          <div className="text-center">
            <Link href="/leaderboard/acebet">
              <Button variant="outline">Back to {SPONSOR} Leaderboard</Button>
            </Link>
          </div>

        </div>
      </main>
    </div>
  )
}
