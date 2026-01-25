import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Trophy, TrendingUp } from 'lucide-react'

export default function WagerRewardsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4">
        <GiveawayCounter />
      </div>
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">Wager Rewards</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Earn rewards based on your wagering activity with code R2K2
            </p>
          </div>

          {/* Rewards Tier Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🥇</span>
                  Silver Tier
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <p className="font-medium">Wager: $500 - $2,499</p>
                  <p className="text-sm text-muted-foreground">Unlock exclusive benefits</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Bonus cashback on wagers
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Exclusive tournament access
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Special event invitations
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🥈</span>
                  Gold Tier
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <p className="font-medium">Wager: $2,500 - $10,000</p>
                  <p className="text-sm text-muted-foreground">Premium rewards await</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Higher cashback rate
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Priority support
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    VIP tournament entry
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">💎</span>
                  Platinum Tier
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <p className="font-medium">Wager: $10,000+</p>
                  <p className="text-sm text-muted-foreground">Elite status unlocked</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Maximum cashback rewards
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    24/7 dedicated support
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Exclusive perks and bonuses
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">👑</span>
                  Elite Tier
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <p className="font-medium">Wager: $25,000+</p>
                  <p className="text-sm text-muted-foreground">Top tier benefits</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Premium cashback percentage
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Direct account manager
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Custom exclusive rewards
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* How it Works */}
          <Card className="bg-gradient-to-br from-card via-card to-secondary/20 border-border/50">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                    1
                  </div>
                </div>
                <div>
                  <p className="font-medium">Sign Up with Code R2K2</p>
                  <p className="text-sm text-muted-foreground">Create your Acebet account using the affiliate code R2K2</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                    2
                  </div>
                </div>
                <div>
                  <p className="font-medium">Start Wagering</p>
                  <p className="text-sm text-muted-foreground">Place your bets and accumulate wager amounts</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                    3
                  </div>
                </div>
                <div>
                  <p className="font-medium">Unlock Tier Benefits</p>
                  <p className="text-sm text-muted-foreground">As you wager more, unlock higher tier rewards and perks</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                    4
                  </div>
                </div>
                <div>
                  <p className="font-medium">Enjoy Your Rewards</p>
                  <p className="text-sm text-muted-foreground">Collect cashback and exclusive perks based on your tier</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">Ready to start earning?</p>
            <a href="https://www.acebet.com?code=R2K2" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                <Trophy className="h-5 w-5" />
                Visit Acebet with Code R2K2
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
