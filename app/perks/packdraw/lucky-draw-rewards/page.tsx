import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Dice6, Trophy } from 'lucide-react'

export default function LuckyDrawRewardsPage() {
  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Dice6 className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">Lucky Draw Rewards</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Get bonus credits with every pack opening using code R2K2
            </p>
          </div>

          {/* Main Rewards Card */}
          <Card className="bg-gradient-to-br from-primary/10 via-card to-secondary/20 border-primary/30">
            <CardHeader>
              <CardTitle className="text-2xl">Earn Credits with Every Draw</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Reward Rate</h3>
                  <p className="text-3xl font-bold text-primary">5-10%</p>
                  <p className="text-sm text-muted-foreground">
                    Earn bonus credits back on every pack you open
                  </p>
                  <div className="pt-4 space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Automatic rewards on every draw
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Rewards tier based on activity
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Accumulate and use immediately
                    </p>
                  </div>
                </div>
                <div className="space-y-3 bg-card/50 p-4 rounded-lg border border-border/50">
                  <h3 className="font-semibold">Program Details</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <span className="font-medium">Reward Type:</span>
                      <span className="text-muted-foreground ml-2">Draw Credits</span>
                    </li>
                    <li>
                      <span className="font-medium">Frequency:</span>
                      <span className="text-muted-foreground ml-2">Per pack opened</span>
                    </li>
                    <li>
                      <span className="font-medium">Minimum Spend:</span>
                      <span className="text-muted-foreground ml-2">No minimum</span>
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
              <CardTitle>Rewards by Activity Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                    <p className="font-semibold mb-2">Casual Drawers</p>
                    <p className="text-2xl font-bold text-primary mb-2">5%</p>
                    <p className="text-sm text-muted-foreground">Reward rate on packs opened</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                    <p className="font-semibold mb-2">Active Drawers</p>
                    <p className="text-2xl font-bold text-primary mb-2">7.5%</p>
                    <p className="text-sm text-muted-foreground">Higher activity bonus</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                    <p className="font-semibold mb-2">Heavy Drawers</p>
                    <p className="text-2xl font-bold text-primary mb-2">10%</p>
                    <p className="text-sm text-muted-foreground">Premium drawer reward rate</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                    <p className="font-semibold mb-2">Elite Drawers</p>
                    <p className="text-2xl font-bold text-primary mb-2">12%</p>
                    <p className="text-sm text-muted-foreground">Maximum reward tier</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>How Lucky Draw Rewards Work</CardTitle>
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
                    <p className="font-medium">Open a Pack</p>
                    <p className="text-sm text-muted-foreground">Use your draw credits to open any available pack</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      2
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Automatic Reward Credit</p>
                    <p className="text-sm text-muted-foreground">Based on your tier, a percentage of your pack cost is credited back</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      3
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Rewards Accumulate</p>
                    <p className="text-sm text-muted-foreground">Credits collect in your reward balance and can be used immediately</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify="center rounded-full bg-primary/20 text-primary font-bold">
                      4
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Use for More Draws</p>
                    <p className="text-sm text-muted-foreground">Keep drawing and earning—the more you draw, the more you earn</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Examples */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Reward Examples</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">You:</span> An Active Drawer (7.5% reward rate)
                </p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Draw Cost:</span> $100 pack
                </p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Reward Credit:</span> $100 × 7.5% = <span className="font-bold text-primary">$7.50</span>
                </p>
              </div>
              <div className="p-3 bg-primary/20 border border-primary/30 rounded-lg">
                <p className="text-sm font-medium">
                  Open 10 packs: You earn <span className="text-primary font-bold">$75 in reward credits</span>
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
                • Reward credits are calculated based on your current tier and pack cost
              </p>
              <p className="text-muted-foreground">
                • Your tier is determined by your monthly drawing activity
              </p>
              <p className="text-muted-foreground">
                • Reward credits are credited instantly after each pack draw
              </p>
              <p className="text-muted-foreground">
                • This promotion requires the R2K2 referral code to be used at signup
              </p>
              <p className="text-muted-foreground">
                • Rewards continue indefinitely as long as you maintain activity on the platform
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">Start earning rewards today!</p>
            <a href="https://packdraw.gg?code=R2K2" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                <Trophy className="h-5 w-5" />
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
