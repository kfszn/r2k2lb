import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Zap, Award } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Packdraw Seasonal Bonus | R2K2',
  description: 'Claim seasonal bonuses on Packdraw with code R2K2. Limited-time reward opportunities.',
  openGraph: {
    title: 'Packdraw Seasonal Bonus | R2K2',
    description: 'Get seasonal bonuses on Packdraw',
  },
}

export default function WagerRewardsPage() {
  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Zap className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">Wager Rewards</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Get bonus credits for every dollar you wager with code R2K2
            </p>
          </div>

          {/* Main Seasonal Card */}
          <Card className="bg-gradient-to-br from-primary/10 via-card to-secondary/20 border-primary/30">
            <CardHeader>
              <CardTitle className="text-2xl">Earn Rewards on Wagers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Bonus Structure</h3>
                  <p className="text-3xl font-bold text-primary">$1 per $100</p>
                  <p className="text-sm text-muted-foreground">
                    Earn bonus credits for every $100 you wager
                  </p>
                  <div className="pt-4 space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Automatic daily credits
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Tier-based multipliers available
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      No caps or limits
                    </p>
                  </div>
                </div>
                <div className="space-y-3 bg-card/50 p-4 rounded-lg border border-border/50">
                  <h3 className="font-semibold">Season Details</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <span className="font-medium">Reward Base:</span>
                      <span className="text-muted-foreground ml-2">$1 per $100 wagered</span>
                    </li>
                    <li>
                      <span className="font-medium">Frequency:</span>
                      <span className="text-muted-foreground ml-2">Daily accumulation</span>
                    </li>
                    <li>
                      <span className="font-medium">Withdrawable:</span>
                      <span className="text-primary font-bold ml-2">Yes</span>
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

          {/* Seasonal Calendar */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Tier Multipliers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">Tier-based multipliers increase your earning potential:</p>
                <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">Standard Tier</p>
                      <p className="text-xs text-muted-foreground">$0 - $5,000 cumulative wagers</p>
                    </div>
                    <span className="text-lg font-bold text-primary">1x</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Base reward rate on all wagers</p>
                </div>

                <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">Silver Tier</p>
                      <p className="text-xs text-muted-foreground">$5,000 - $15,000 cumulative wagers</p>
                    </div>
                    <span className="text-lg font-bold text-primary">1.25x</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Higher wager volume bonus</p>
                </div>

                <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">Gold Tier</p>
                      <p className="text-xs text-muted-foreground">$15,000 - $50,000 cumulative wagers</p>
                    </div>
                    <span className="text-lg font-bold text-primary">1.5x</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Mid-level reward multiplier</p>
                </div>

                <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">Platinum Tier</p>
                      <p className="text-xs text-muted-foreground">$50,000+ cumulative wagers</p>
                    </div>
                    <span className="text-lg font-bold text-primary">2x</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Premium reward multiplier</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Special Events */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>How Wager Rewards Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Every dollar you wager earns you rewards. The more you play, the more you earn!
              </p>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      1
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Place Your Wagers</p>
                    <p className="text-sm text-muted-foreground">Play eligible games and accumulate total wagers</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      2
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Automatic Calculation</p>
                    <p className="text-sm text-muted-foreground">For every $100 wagered, earn $1 in rewards</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      3
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Tier Bonuses Applied</p>
                    <p className="text-sm text-muted-foreground">Your tier multiplier increases earnings (up to 2x)</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      4
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Daily Credit & Withdraw</p>
                    <p className="text-sm text-muted-foreground">Rewards credited daily and ready to withdraw or use</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Example Wager Reward</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">You:</span> Gold Tier player (1.5x multiplier)
                </p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Total Wagers (this week):</span> $1,000
                </p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Base Reward:</span> $1,000 ÷ $100 = $10
                </p>
              </div>
              <div className="p-3 bg-primary/20 border border-primary/30 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Final Reward (with 1.5x multiplier):</span> $10 × 1.5 = <span className="font-bold text-primary">$15</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Bonus Examples */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Why Wager Rewards?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-3">
                <span className="text-primary font-bold">✓</span>
                <p><span className="font-medium">No Minimum:</span> Start earning from your first wager</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold">✓</span>
                <p><span className="font-medium">No Caps:</span> There is no limit to how much you can earn</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold">✓</span>
                <p><span className="font-medium">Withdrawable:</span> Wager rewards are cash-ready, not locked in bonus terms</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold">✓</span>
                <p><span className="font-medium">Daily Tracking:</span> See your earnings accumulate in real-time</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold">✓</span>
                <p><span className="font-medium">Tier Up:</span> Climb tiers to unlock higher multipliers</p>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Important Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                • Wager rewards are calculated at $1 per $100 wagered on eligible games
              </p>
              <p className="text-muted-foreground">
                • Tier multipliers are based on cumulative wagers since account creation
              </p>
              <p className="text-muted-foreground">
                • Wager rewards can be withdrawn immediately with no rollover requirements
              </p>
              <p className="text-muted-foreground">
                • This promotion requires the R2K2 referral code to be used at signup
              </p>
              <p className="text-muted-foreground">
                • All eligible games at Acebet contribute to wager rewards
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">Start earning wager rewards today!</p>
            <a href="https://packdraw.gg?code=R2K2" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                <Award className="h-5 w-5" />
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
