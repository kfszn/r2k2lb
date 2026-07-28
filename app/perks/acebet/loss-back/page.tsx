import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Shield, TrendingDown } from 'lucide-react'

export const metadata: Metadata = generatePageMetadata('perksAcebetLossBack')

const SIGNUP_URL = 'https://www.acebet.co/welcome/r/r2k2'
const SPONSOR = 'AceBet'

export default function AceBetLossBackPage() {
  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">Loss-back</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Get a flat 10% of your monthly {SPONSOR} losses back — manually claimed via ticket with verified PnL
            </p>
          </div>

          {/* Main Loss-back Card */}
          <Card className="bg-gradient-to-br from-primary/10 via-card to-secondary/20 border-primary/30">
            <CardHeader>
              <CardTitle className="text-2xl">Monthly Loss-back Program</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Loss-back Percentage</h3>
                  <p className="text-3xl font-bold text-primary">10%</p>
                  <p className="text-sm text-muted-foreground">
                    Flat 10% loss-back on every claim. Monthly caps scale with your tier.
                  </p>
                  <div className="pt-4 space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      Flat 10% rate
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      Minimum $300 net loss required
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      Manual claim via Discord ticket
                    </p>
                  </div>
                </div>
                <div className="space-y-3 bg-card/50 p-4 rounded-lg border border-border/50">
                  <h3 className="font-semibold">Program Details</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <span className="font-medium">Rate:</span>
                      <span className="text-primary font-bold ml-2">Flat 10%</span>
                    </li>
                    <li>
                      <span className="font-medium">Calculation:</span>
                      <span className="text-muted-foreground ml-2">30-day PnL + Rewards (excluding leaderboards)</span>
                    </li>
                    <li>
                      <span className="font-medium">Frequency:</span>
                      <span className="text-muted-foreground ml-2">Monthly via ticket</span>
                    </li>
                    <li>
                      <span className="font-medium">Monthly Cap:</span>
                      <span className="text-primary font-bold ml-2">Tier-based (see below)</span>
                    </li>
                    <li>
                      <span className="font-medium">Code Required:</span>
                      <span className="text-primary font-bold ml-2">R2K2</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tier Caps */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Monthly Caps by Tier</CardTitle>
              <p className="text-sm text-muted-foreground pt-1">
                Everyone earns a flat 10%. Your tier — determined by monthly wager volume or deposits — sets the maximum monthly payout.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    tier: 'Tier 1',
                    wager: '$1 – $100,000',
                    deposit: '$7,500 or less',
                    cap: '$200 / month',
                  },
                  {
                    tier: 'Tier 2',
                    wager: '$100,001 – $299,999',
                    deposit: '$10,000',
                    cap: '$400 / month',
                  },
                  {
                    tier: 'Tier 3',
                    wager: '$300,000+',
                    deposit: '$30,000',
                    cap: '$700 / month',
                  },
                ].map(({ tier, wager, deposit, cap }) => (
                  <div key={tier} className="p-4 rounded-lg border border-border/50 bg-secondary/20 space-y-2">
                    <p className="font-semibold">{tier}</p>
                    <p className="text-2xl font-bold text-primary">10%</p>
                    <p className="text-sm text-muted-foreground">{wager} wagered</p>
                    <p className="text-sm text-muted-foreground">or {deposit} deposited</p>
                    <p className="text-xs font-semibold text-primary pt-1">Max: {cap}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* How to Claim */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>How to Claim Loss-back</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  step: 1,
                  title: 'Request Your Monthly PnL',
                  body: `Contact ${SPONSOR} support and request your Profit & Loss statement for the calendar month`,
                },
                {
                  step: 2,
                  title: 'Verify Your Net Loss',
                  body: 'True PnL = 30-day PnL + Rewards (excluding leaderboards). Must show a minimum net loss of $300. Staff will verify via Discord.',
                },
                {
                  step: 3,
                  title: 'Submit a Discord Ticket',
                  body: `Open a ticket in the R2K2 Discord with your PnL screenshot, ${SPONSOR} username, and the month`,
                },
                {
                  step: 4,
                  title: 'Receive Your Credit',
                  body: 'Staff applies a flat 10%, capped by your tier. This amount comes from R2K2 directly, not the casino.',
                },
              ].map(({ step, title, body }) => (
                <div key={step} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      {step}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">{body}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Example Calculation */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Loss-back Calculation Example</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="text-sm"><span className="font-medium">Monthly Wagers:</span> $50,000 (Tier 1)</p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="text-sm"><span className="font-medium">Monthly Net Loss:</span> $2,500</p>
              </div>
              <div className="p-3 bg-primary/20 rounded-lg border border-primary/30">
                <p className="text-sm">
                  <span className="font-medium">Loss-back Credit:</span> $2,500 × 10% = $250{' '}
                  <span className="text-muted-foreground">(capped at $200 for Tier 1)</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Important Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-semibold mb-1">Minimum Loss Requirement</p>
                <p className="text-muted-foreground">A minimum net loss of $300 is required to qualify for a claim.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Monthly Caps</p>
                <p className="text-muted-foreground">
                  Tier 1: $200/month, Tier 2: $400/month, Tier 3: $700/month. This comes from R2K2&apos;s pocket, not the casino.
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">Tier Calculation</p>
                <p className="text-muted-foreground">
                  Tier is determined by the higher of your monthly wager volume or monthly deposits. Resets each month.
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">Verification Required</p>
                <p className="text-muted-foreground">
                  All claims must be manually verified by staff. Submit your PnL screenshot and {SPONSOR} username via Discord ticket.
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">Code Requirement</p>
                <p className="text-muted-foreground">
                  The R2K2 referral code must be used at signup. Accounts without this code are not eligible.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">Start earning loss-back today!</p>
            <a href={SIGNUP_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                <TrendingDown className="h-5 w-5" />
                Sign Up with Code R2K2
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
