import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Shield, TrendingDown } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Acebet Loss-back | R2K2',
  description: 'Get up to 15% of your monthly losses back on Acebet with code R2K2. Manual claim via ticket with verified PnL.',
  openGraph: {
    title: 'Acebet Loss-back | R2K2',
    description: 'Earn loss-back rewards on Acebet with code R2K2',
  },
}

export default function LossBackPage() {
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
              Get up to 15% of your monthly losses back—manually claimed via ticket with verified PnL
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
                  <p className="text-3xl font-bold text-primary">Up to 15%</p>
                  <p className="text-sm text-muted-foreground">
                    Earn loss-back credits based on your monthly wager tier. Monthly cap of $250 per player.
                  </p>
                  <div className="pt-4 space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Tier-based percentages
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Minimum $300 net loss required
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Manual claim process via ticket
                    </p>
                  </div>
                </div>
                <div className="space-y-3 bg-card/50 p-4 rounded-lg border border-border/50">
                  <h3 className="font-semibold">Program Details</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <span className="font-medium">Calculation:</span>
                      <span className="text-muted-foreground ml-2">30 Day PnL + Rewards (Excluding Leaderboards) = True PnL (Will be verified by staff on discord)</span>
                    </li>
                    <li>
                      <span className="font-medium">Frequency:</span>
                      <span className="text-muted-foreground ml-2">Monthly via ticket submission</span>
                    </li>
                    <li>
                      <span className="font-medium">Monthly Cap:</span>
                      <span className="text-primary font-bold ml-2">$250 max</span>
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

          {/* Tier Benefits */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Loss-back by Monthly Wager Tier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                    <p className="font-semibold mb-2">Tier 1</p>
                    <p className="text-2xl font-bold text-primary mb-2">5%</p>
                    <p className="text-sm font-medium mb-2">$1 - $100,000</p>
                    <p className="text-xs text-muted-foreground">Monthly wager range</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                    <p className="font-semibold mb-2">Tier 2</p>
                    <p className="text-2xl font-bold text-primary mb-2">10%</p>
                    <p className="text-sm font-medium mb-2">$100,001 - $499,999</p>
                    <p className="text-xs text-muted-foreground">Monthly wager range</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                    <p className="font-semibold mb-2">Tier 3 (Max)</p>
                    <p className="text-2xl font-bold text-primary mb-2">15%</p>
                    <p className="text-sm font-medium mb-2">$500,000+</p>
                    <p className="text-xs text-muted-foreground">Monthly wager range</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>How to Claim Loss-back</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      1
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Request Your Monthly PnL</p>
                    <p className="text-sm text-muted-foreground">Contact Acebet support and request your Profit & Loss statement for the calendar month</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      2
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Check Your Net Loss</p>
                    <p className="text-sm text-muted-foreground">Your true PnL = 30 Day PnL + Rewards (Excluding Leaderboards). This will be verified by staff on discord. Verify your true PnL loss is at least $300 to qualify for Loss-back</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      3
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Create a Support Ticket</p>
                    <p className="text-sm text-muted-foreground">Submit a ticket to R2K2 via Discord with your PnL screenshot. Include your username and the month.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      4
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Verification & Processing</p>
                    <p className="text-sm text-muted-foreground">Staff verifies your monthly wager tier and calculates your Loss-back percentage</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      5
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Receive Your Loss-back Credit</p>
                    <p className="text-sm text-muted-foreground">Credits are paid out based on your tier percentage, capped at $250/month</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Loss-back Calculation Example</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Monthly Wagers:</span> $250,000
                </p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Tier:</span> Tier 2 (10% loss-back)
                </p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Monthly Net Loss:</span> $2,500
                </p>
              </div>
              <div className="p-3 bg-primary/20 rounded-lg border border-primary/30">
                <p className="text-sm">
                  <span className="font-medium">Loss-back Credit:</span> $2,500 × 10% = $250 <span className="text-muted-foreground ml-2">(capped at max $250/month)</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Progressive Claims */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Progressive Claim System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Once you claim Loss-back, your next claim cannot be processed until your cumulative net loss exceeds the previous claim + $300.
              </p>
              <div className="space-y-3">
                <div className="p-3 bg-secondary/20 rounded-lg border border-border/50">
                  <p className="text-sm font-medium">Example Timeline</p>
                </div>
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <p className="text-sm"><span className="font-medium">Claim 1:</span> Net loss -$500 → Receives $50 (10% tier)</p>
                </div>
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <p className="text-sm"><span className="font-medium">Claim 2 Minimum:</span> Must reach -$800 cumulative loss ($500 + $300)</p>
                </div>
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <p className="text-sm"><span className="font-medium">Claim 3 Minimum:</span> Must reach -$1,100 cumulative loss ($800 + $300)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Important Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-semibold mb-1">Minimum Loss Requirement</p>
                <p className="text-muted-foreground">You must have a minimum net loss of $300 to qualify for a Loss-back claim.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Monthly Cap</p>
                <p className="text-muted-foreground">Loss-back is capped at $250 per player, per month. This amount comes from R2K2's pocket, not the casino.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Tier Calculation</p>
                <p className="text-muted-foreground">Your tier is determined by your total monthly wagers with Acebet. Each month resets for tier calculation.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Progressive Claims</p>
                <p className="text-muted-foreground">After claiming Loss-back, your next claim requires an additional $300 cumulative loss from the previous claim amount.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Verification Required</p>
                <p className="text-muted-foreground">All Loss-back claims must be manually verified by staff. Submit your PnL screenshot and username via support ticket.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Code Requirement</p>
                <p className="text-muted-foreground">This promotion requires the R2K2 referral code to be used at signup. Accounts without this code are not eligible.</p>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">Start earning loss-back today!</p>
            <a href="https://acebet.com/welcome/r/r2k2" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                <TrendingDown className="h-5 w-5" />
                Sign Up with Code R2K2
              </Button>
            </a>
          </div>

          {/* Back Link */}
          <div className="text-center">
            <Link href="/">
              <Button variant="outline">Return to Home</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
