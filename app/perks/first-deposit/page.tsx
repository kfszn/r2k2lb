import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header'
import { Gift, Zap } from 'lucide-react'

export default function FirstDepositBonusPage() {
  return (
    <div className="min-h-screen bg-background">
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
              Get rewarded for your first deposit with code R2K2
            </p>
          </div>

          {/* Main Bonus Card */}
          <Card className="bg-gradient-to-br from-primary/10 via-card to-secondary/20 border-primary/30">
            <CardHeader>
              <CardTitle className="text-2xl">50% First-Time Deposit Bonus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Deposit Match</h3>
                  <p className="text-3xl font-bold text-primary">50%</p>
                  <p className="text-sm text-muted-foreground">
                    Match on your first deposit with a maximum bonus of $250
                  </p>
                  <div className="pt-4 space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Use code R2K2 to claim
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Claim within 24 hours of deposit
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Tiered wagering requirements
                    </p>
                  </div>
                </div>
                <div className="space-y-3 bg-card/50 p-4 rounded-lg border border-border/50">
                  <h3 className="font-semibold">Bonus Details</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <span className="font-medium">Deposit Range:</span>
                      <span className="text-muted-foreground ml-2">$10 - $500+</span>
                    </li>
                    <li>
                      <span className="font-medium">Maximum Bonus:</span>
                      <span className="text-primary font-bold ml-2">$250</span>
                    </li>
                    <li>
                      <span className="font-medium">Claim Window:</span>
                      <span className="text-muted-foreground ml-2">24 hours</span>
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

          {/* Wagering Requirements Card */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Wagering Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Wagering requirements vary based on your deposit amount and must be completed within 7–10 days:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-secondary/20 p-4 rounded-lg border border-border/50">
                  <p className="font-semibold mb-2">Deposits $10–$100</p>
                  <p className="text-2xl font-bold text-primary mb-2">40x</p>
                  <p className="text-xs text-muted-foreground">
                    Example: $100 deposit → $50 bonus → $2,000 wagering required
                  </p>
                </div>
                <div className="bg-secondary/20 p-4 rounded-lg border border-border/50">
                  <p className="font-semibold mb-2">Deposits $101–$250</p>
                  <p className="text-2xl font-bold text-primary mb-2">50x</p>
                  <p className="text-xs text-muted-foreground">
                    Example: $200 deposit → $100 bonus → $5,000 wagering required
                  </p>
                </div>
                <div className="bg-secondary/20 p-4 rounded-lg border border-border/50">
                  <p className="font-semibold mb-2">Deposits $250+</p>
                  <p className="text-2xl font-bold text-primary mb-2">80x</p>
                  <p className="text-xs text-muted-foreground">
                    Bonus capped at $250 maximum
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Eligible Games */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Game Contribution Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-green-500 flex items-center gap-2">
                    <span>✓</span> Eligible Games
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                    <li>• Slots: 100% contribution to wagering</li>
                    <li>• All other eligible games: Tiered reduced rates</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-red-500 flex items-center gap-2">
                    <span>✗</span> Excluded Games (Not Allowed)
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                    <li>• Dice</li>
                    <li>• Blackjack</li>
                    <li>• Baccarat</li>
                    <li>• Roulette</li>
                    <li>• Any low house-edge or exploit-prone games</li>
                  </ul>
                  <p className="text-xs text-red-500 mt-2 font-medium">
                    Playing excluded games may result in bonus forfeiture
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Important Terms & Fair Play</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-1">Claim Window (Important)</h4>
                  <p className="text-muted-foreground">
                    This bonus must be claimed within 24 hours of meeting the deposit milestone. Failure to claim within this timeframe will result in the bonus being voided.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Bonus Wagering</h4>
                  <p className="text-muted-foreground">
                    Bonus funds must be wagered in full before withdrawal. Wager abuse, including exploiting game weighting, bet patterns, or low-edge mechanics, may result in disqualification or loss of rewards.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Maximum Bet Limits</h4>
                  <p className="text-muted-foreground">
                    Maximum bet limits may apply while wagering your bonus funds.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">One Bonus Per Player</h4>
                  <p className="text-muted-foreground">
                    This offer is valid for first-time deposits only. Multiple accounts or bonus abuse may result in forfeiture of bonus and account restrictions.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Management Reserve</h4>
                  <p className="text-muted-foreground">
                    Management reserves the right to void bonuses in cases of abuse, rule violations, or suspicious activity.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How to Claim */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>How to Claim Your Bonus</CardTitle>
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
                    <p className="text-sm text-muted-foreground">Visit acebet.com and use code R2K2 during registration</p>
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
                    <p className="text-sm text-muted-foreground">Deposit at least $10 to qualify for the 50% bonus</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      3
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Claim Within 24 Hours</p>
                    <p className="text-sm text-muted-foreground">Open a ticket in Discord to claim your bonus within 24 hours of deposit</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      4
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Complete Wagering</p>
                    <p className="text-sm text-muted-foreground">Play through your bonus funds according to the tiered wagering requirements (40x-80x)</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm font-semibold text-blue-600">💡 Pro Tip:</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Slots contribute 100% to your wagering requirement, so spinning slots is the most efficient way to meet your requirements quickly.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">Claim your welcome bonus today!</p>
            <a href="https://www.acebet.com?code=R2K2" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                <Zap className="h-5 w-5" />
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
