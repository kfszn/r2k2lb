import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Gift, TrendingUp } from 'lucide-react'

export default function FirstTimeDepositBonusPage() {
  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Gift className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">First Time Deposit Bonus</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              100% match bonus + automatic 5% bonus on every deposit with code R2K2
            </p>
          </div>

          {/* Main Bonus Card */}
          <Card className="bg-gradient-to-br from-primary/10 via-card to-secondary/20 border-primary/30">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome Bonus Structure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">100% First Deposit Match</h3>
                  <p className="text-3xl font-bold text-primary">Up to $200</p>
                  <p className="text-sm text-muted-foreground">
                    Get an instant 100% match on your first deposit, capped at $200 bonus
                  </p>
                  <div className="pt-4 space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      100% deposit match
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      5x playthrough required
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      No deals/draw mode battles
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Code R2K2 required
                    </p>
                  </div>
                </div>
                <div className="space-y-3 bg-card/50 p-4 rounded-lg border border-border/50">
                  <h3 className="font-semibold">Bonus Details</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <span className="font-medium">Match Rate:</span>
                      <span className="text-primary font-bold ml-2">100%</span>
                    </li>
                    <li>
                      <span className="font-medium">Max Bonus:</span>
                      <span className="text-primary font-bold ml-2">$200</span>
                    </li>
                    <li>
                      <span className="font-medium">Playthrough:</span>
                      <span className="text-muted-foreground ml-2">5x bonus amount</span>
                    </li>
                    <li>
                      <span className="font-medium">Game Modes:</span>
                      <span className="text-muted-foreground ml-2">Regular play only</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Claim Button - Inside Main Card */}
              <div className="pt-4 border-t border-border/30">
                <Link href="https://discord.gg/packdraw" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="w-full gap-2">
                    <span>💬</span>
                    Claim Now on Discord
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Bonus will be paid once all requirements have been verified and confirmed
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Extra 5% Bonus Card */}
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-amber-600 dark:text-amber-400">Automatic 5% Deposit Bonus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                Every deposit made with code R2K2 automatically receives an additional <span className="font-bold text-amber-600 dark:text-amber-400">5% bonus</span> - for new players and existing players!
              </p>
              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                <p className="text-sm">
                  <span className="font-semibold">Example:</span> Deposit $100 → Receive $5 instant bonus (no playthrough required on the 5% bonus)
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                The automatic 5% bonus is credited immediately and can be used on any game mode
              </p>
            </CardContent>
          </Card>

          {/* Playthrough Breakdown */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Playthrough Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border border-border/50 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-sm">5x Playthrough Calculation</p>
                  <p className="text-sm text-muted-foreground">Playthrough = Bonus Amount × 5</p>
                  <p className="text-sm font-bold text-primary">
                    Example: $200 bonus × 5 = $1,000 required playthrough
                  </p>
                </div>

                <div className="border border-border/50 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-sm">Allowed Game Modes</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ Regular head-to-head matches</li>
                    <li>✓ Standard tournaments</li>
                    <li>✓ All normal game types</li>
                    <li>✗ Deals (not eligible)</li>
                    <li>✗ Draw Mode Battles (not eligible)</li>
                  </ul>
                </div>

                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-500 mb-2">Bonus Withdrawal</p>
                  <p className="text-sm text-muted-foreground">
                    Once you complete the 5x playthrough, your bonus converts to cash and can be withdrawn immediately
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>How First Time Deposit Bonus Works</CardTitle>
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
                    <p className="font-medium">Sign Up with Code R2K2</p>
                    <p className="text-sm text-muted-foreground">Create your account using code R2K2 at signup</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      2
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Make Your First Deposit</p>
                    <p className="text-sm text-muted-foreground">Deposit any amount (bonus capped at $200)</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      3
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Instant Bonus Credit</p>
                    <p className="text-sm text-muted-foreground">100% match bonus + automatic 5% bonus credited immediately</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      4
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Play & Complete Playthrough</p>
                    <p className="text-sm text-muted-foreground">Wager the bonus amount 5x (excluding deals and draw mode battles)</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      5
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Bonus Converts to Cash</p>
                    <p className="text-sm text-muted-foreground">After playthrough is complete, withdraw anytime</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Examples */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Bonus Examples</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border border-border/50 rounded-lg p-4 space-y-3">
                <p className="font-semibold text-sm">Scenario: First-Time Deposit</p>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Your Deposit:</span> $150 with code R2K2</p>
                  <p><span className="font-medium">100% Match Bonus:</span> $150</p>
                  <p><span className="font-medium">Automatic 5% Bonus:</span> $7.50</p>
                  <p className="font-bold text-primary">Total Balance: $307.50</p>
                  <p className="text-xs text-muted-foreground">Playthrough needed: $150 × 5 = $750 (on 100% bonus)</p>
                </div>
              </div>

              <div className="border border-border/50 rounded-lg p-4 space-y-3">
                <p className="font-semibold text-sm">Scenario: Maximum Deposit</p>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Your Deposit:</span> $300+ with code R2K2</p>
                  <p><span className="font-medium">100% Match Bonus (capped):</span> $200</p>
                  <p><span className="font-medium">Automatic 5% Bonus:</span> $15</p>
                  <p className="font-bold text-primary">Total Balance: $515+</p>
                  <p className="text-xs text-muted-foreground">Playthrough needed: $200 × 5 = $1,000 (on 100% bonus)</p>
                </div>
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
                • This 100% match bonus is only available for new player accounts (first deposit)
              </p>
              <p className="text-muted-foreground">
                • Code R2K2 must be used at signup to qualify for the 100% bonus
              </p>
              <p className="text-muted-foreground">
                • Automatic 5% deposit bonus applies to all deposits made with code R2K2
              </p>
              <p className="text-muted-foreground">
                • 5x playthrough is required on the 100% match bonus before withdrawal
              </p>
              <p className="text-muted-foreground">
                • Playthrough applies only to regular play modes - Deals and Draw Mode Battles do not count
              </p>
              <p className="text-muted-foreground">
                • Maximum 100% bonus is $200
              </p>
              <p className="text-muted-foreground">
                • The automatic 5% bonus has no playthrough requirement and can be used on any game mode
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">Get your first deposit bonus today!</p>
            <a href="https://packdraw.com?ref=R2K2" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                <TrendingUp className="h-5 w-5" />
                Sign Up with Code R2K2
              </Button>
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
