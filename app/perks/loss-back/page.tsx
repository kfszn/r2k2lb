import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Shield, TrendingDown } from 'lucide-react'

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
              Get a percentage of your losses back with code R2K2
            </p>
          </div>

          {/* Main Loss-back Card */}
          <Card className="bg-gradient-to-br from-primary/10 via-card to-secondary/20 border-primary/30">
            <CardHeader>
              <CardTitle className="text-2xl">Recover Your Losses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Loss-back Bonus</h3>
                  <p className="text-3xl font-bold text-primary">Up to 20%</p>
                  <p className="text-sm text-muted-foreground">
                    Get a percentage of your losses back in bonus funds every week
                  </p>
                  <div className="pt-4 space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Weekly loss-back credits
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      No rollover required
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Automatic qualification
                    </p>
                  </div>
                </div>
                <div className="space-y-3 bg-card/50 p-4 rounded-lg border border-border/50">
                  <h3 className="font-semibold">Program Details</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <span className="font-medium">Calculation:</span>
                      <span className="text-muted-foreground ml-2">Net losses weekly</span>
                    </li>
                    <li>
                      <span className="font-medium">Frequency:</span>
                      <span className="text-muted-foreground ml-2">Weekly payouts</span>
                    </li>
                    <li>
                      <span className="font-medium">Minimum Loss:</span>
                      <span className="text-muted-foreground ml-2">Varies by tier</span>
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
              <CardTitle>Loss-back by Player Tier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                    <p className="font-semibold mb-2">Standard Players</p>
                    <p className="text-2xl font-bold text-primary mb-2">10%</p>
                    <p className="text-sm text-muted-foreground">Loss-back on weekly net losses</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                    <p className="font-semibold mb-2">Active Players</p>
                    <p className="text-2xl font-bold text-primary mb-2">15%</p>
                    <p className="text-sm text-muted-foreground">Higher wager volume bonus</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                    <p className="font-semibold mb-2">VIP Players</p>
                    <p className="text-2xl font-bold text-primary mb-2">20%</p>
                    <p className="text-sm text-muted-foreground">Premium loss-back rate</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                    <p className="font-semibold mb-2">Elite Players</p>
                    <p className="text-2xl font-bold text-primary mb-2">25%</p>
                    <p className="text-sm text-muted-foreground">Maximum loss recovery</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>How Loss-back Works</CardTitle>
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
                    <p className="font-medium">Weekly Calculation</p>
                    <p className="text-sm text-muted-foreground">Your net losses are calculated every week from Monday to Sunday</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      2
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Automatic Qualification</p>
                    <p className="text-sm text-muted-foreground">If you have net losses that week, you automatically qualify</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      3
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Credit Processing</p>
                    <p className="text-sm text-muted-foreground">Loss-back bonus is credited to your account by Tuesday</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      4
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Use Your Bonus</p>
                    <p className="text-sm text-muted-foreground">Play with your loss-back funds immediately with minimal requirements</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Example</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">You:</span> Are a VIP player with 20% loss-back
                </p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Weekly Losses:</span> $500 net loss
                </p>
              </div>
              <div className="p-3 bg-primary/20 rounded-lg border border-primary/30">
                <p className="text-sm">
                  <span className="font-medium">Loss-back Credit:</span> $500 × 20% = <span className="font-bold text-primary">$100</span>
                </p>
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
                • Loss-back is calculated on net losses within the promotional week
              </p>
              <p className="text-muted-foreground">
                • Bonus funds must be used according to Acebet's standard bonus terms
              </p>
              <p className="text-muted-foreground">
                • Your tier is determined by your cumulative wager amount
              </p>
              <p className="text-muted-foreground">
                • This promotion requires the R2K2 referral code to be used at signup
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">Start earning loss-back today!</p>
            <a href="https://www.acebet.com?code=R2K2" target="_blank" rel="noopener noreferrer">
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
