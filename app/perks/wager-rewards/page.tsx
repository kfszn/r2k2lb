import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Trophy, TrendingUp, Zap, Crown, AlertCircle } from 'lucide-react'

export default function WagerRewardsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4">
        <GiveawayCounter />
      </div>
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
              Earn cash rewards based on your monthly wager activity. Rewards reset monthly in alignment with our leaderboard.
            </p>
          </div>

          {/* Rewards Structure - Tiered Display */}
          <div className="space-y-6">
            {/* Tier 1 - $10 per 10,000 */}
            <div className="relative">
              <Card className="bg-gradient-to-r from-blue-500/10 via-card to-blue-500/5 border border-blue-500/30 overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full -mr-24 -mt-24 blur-3xl" />
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20 text-blue-500">
                        <Zap className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Tier 1 Rewards</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Get started earning</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-500">$10</div>
                      <p className="text-xs text-muted-foreground">per milestone</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2 p-3 rounded-lg bg-card/50 border border-border/50">
                      <p className="text-sm font-medium text-muted-foreground">Wager Required</p>
                      <p className="text-2xl font-bold">$10,000</p>
                    </div>
                    <div className="space-y-2 p-3 rounded-lg bg-card/50 border border-border/50">
                      <p className="text-sm font-medium text-muted-foreground">Reward</p>
                      <p className="text-2xl font-bold text-blue-500">$10</p>
                    </div>
                    <div className="space-y-2 p-3 rounded-lg bg-card/50 border border-border/50">
                      <p className="text-sm font-medium text-muted-foreground">Examples</p>
                      <div className="space-y-1 text-sm font-medium">
                        <p>$20k wagered → $20</p>
                        <p>$50k wagered → $50</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <p className="text-sm text-muted-foreground">Automatically credited when you reach each $10,000 wager milestone</p>
                  </div>
                  <div className="pt-4 space-y-3 border-t border-border/30">
                    <a href="https://discord.gg/r2k2" target="_blank" rel="noopener noreferrer">
                      <Button className="w-full gap-2" size="sm">
                        <Trophy className="h-4 w-4" />
                        Redeem Rewards
                      </Button>
                    </a>
                    <div className="space-y-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <div className="flex gap-2 items-start">
                        <AlertCircle className="h-3 w-3 text-destructive mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-destructive/80"><span className="font-medium text-destructive">Monthly Reset:</span> You are responsible for redeeming within the month. Unredeemed rewards do not carry over. No exceptions.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tier 2 - $100 per 100,000 */}
            <div className="relative">
              <Card className="bg-gradient-to-r from-amber-500/10 via-card to-amber-500/5 border border-amber-500/30 overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full -mr-24 -mt-24 blur-3xl" />
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500">
                        <Crown className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Tier 2 Rewards</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Premium milestone rewards</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-amber-500">$100</div>
                      <p className="text-xs text-muted-foreground">per milestone</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2 p-3 rounded-lg bg-card/50 border border-border/50">
                      <p className="text-sm font-medium text-muted-foreground">Wager Required</p>
                      <p className="text-2xl font-bold">$100,000</p>
                    </div>
                    <div className="space-y-2 p-3 rounded-lg bg-card/50 border border-border/50">
                      <p className="text-sm font-medium text-muted-foreground">Reward</p>
                      <p className="text-2xl font-bold text-amber-500">$100</p>
                    </div>
                    <div className="space-y-2 p-3 rounded-lg bg-card/50 border border-border/50">
                      <p className="text-sm font-medium text-muted-foreground">Examples</p>
                      <div className="space-y-1 text-sm font-medium">
                        <p>$200k wagered → $200</p>
                        <p>$500k wagered → $500</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <span className="text-amber-500 mt-0.5">✓</span>
                    <p className="text-sm text-muted-foreground">Automatically credited when you reach each $100,000 wager milestone</p>
                  </div>
                  <div className="pt-4 space-y-3 border-t border-border/30">
                    <a href="https://discord.gg/r2k2" target="_blank" rel="noopener noreferrer">
                      <Button className="w-full gap-2" size="sm">
                        <Trophy className="h-4 w-4" />
                        Redeem Rewards
                      </Button>
                    </a>
                    <div className="space-y-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <div className="flex gap-2 items-start">
                        <AlertCircle className="h-3 w-3 text-destructive mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-destructive/80"><span className="font-medium text-destructive">Monthly Reset:</span> You are responsible for redeeming within the month. Unredeemed rewards do not carry over. No exceptions.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* How It Works */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Sign Up with Code R2K2</p>
                      <p className="text-sm text-muted-foreground">Create your Acebet account using the affiliate code R2K2</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Start Wagering</p>
                      <p className="text-sm text-muted-foreground">Place bets and accumulate wagers throughout the month</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Reach Milestones</p>
                      <p className="text-sm text-muted-foreground">Hit $10k or $100k wager milestones for automatic rewards</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold flex-shrink-0">
                      4
                    </div>
                    <div>
                      <p className="font-medium">Monthly Reset</p>
                      <p className="text-sm text-muted-foreground">Rewards reset each month, aligned with the leaderboard</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Notes */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Important Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 p-3 rounded-lg bg-secondary/20 border border-border/50">
                <p className="font-medium text-sm">Monthly Reset</p>
                <p className="text-sm text-muted-foreground">All wager totals reset at the beginning of each month, allowing you to earn rewards multiple times throughout the year</p>
              </div>
              <div className="space-y-2 p-3 rounded-lg bg-secondary/20 border border-border/50">
                <p className="font-medium text-sm">Stacking Rewards</p>
                <p className="text-sm text-muted-foreground">If you wager $150,000 in a month, you earn both Tier 1 ($150) and Tier 2 ($100) rewards for a total of $250</p>
              </div>
              <div className="space-y-2 p-3 rounded-lg bg-secondary/20 border border-border/50">
                <p className="font-medium text-sm">Automatic Credits</p>
                <p className="text-sm text-muted-foreground">Rewards are automatically credited to your account when you hit each milestone. No manual claiming required</p>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4 py-6">
            <p className="text-lg text-muted-foreground">Ready to start earning wager rewards?</p>
            <a href="https://www.acebet.com?code=R2K2" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                <Trophy className="h-5 w-5" />
                Visit Acebet with Code R2K2
              </Button>
            </a>
          </div>

          {/* Back Link */}
          <div className="text-center pt-4">
            <Link href="/">
              <Button variant="outline">Return to Home</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
