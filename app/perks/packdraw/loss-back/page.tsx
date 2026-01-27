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
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Loss-back Recovery</h3>
                  <p className="text-3xl font-bold text-primary">Up to 15%</p>
                  <p className="text-sm text-muted-foreground">
                    Get a percentage of your losses back based on your wager tier
                  </p>
                  <div className="pt-4 space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Tiered rewards: 5% - 15%
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Claim via Discord ticket
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      24-48 hour processing
                    </p>
                  </div>
                </div>
                <div className="space-y-3 bg-card/50 p-4 rounded-lg border border-border/50">
                  <h3 className="font-semibold">Program Details</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <span className="font-medium">Tier 1:</span>
                      <span className="text-muted-foreground ml-2">$0-$15K = 5%</span>
                    </li>
                    <li>
                      <span className="font-medium">Tier 2:</span>
                      <span className="text-muted-foreground ml-2">$15K-$50K = 10%</span>
                    </li>
                    <li>
                      <span className="font-medium">Tier 3:</span>
                      <span className="text-muted-foreground ml-2">$50K+ = 15%</span>
                    </li>
                    <li>
                      <span className="font-medium">Claim Method:</span>
                      <span className="text-primary font-bold ml-2">Discord Ticket</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tier Benefits */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Loss-back by Wager Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                    <p className="font-semibold mb-2">Tier 1</p>
                    <p className="text-2xl font-bold text-primary mb-2">5%</p>
                    <p className="text-sm text-muted-foreground mb-3">Loss-back rate</p>
                    <p className="text-xs text-muted-foreground">$0 - $15,000 wager</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                    <p className="font-semibold mb-2">Tier 2</p>
                    <p className="text-2xl font-bold text-primary mb-2">10%</p>
                    <p className="text-sm text-muted-foreground mb-3">Loss-back rate</p>
                    <p className="text-xs text-muted-foreground">$15,001 - $50,000 wager</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                    <p className="font-semibold mb-2">Tier 3</p>
                    <p className="text-2xl font-bold text-primary mb-2">15%</p>
                    <p className="text-sm text-muted-foreground mb-3">Loss-back rate</p>
                    <p className="text-xs text-muted-foreground">$50,001+ wager</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>How to Claim Your Loss-back</CardTitle>
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
                    <p className="font-medium">Calculate Your Loss</p>
                    <p className="text-sm text-muted-foreground">Reach your wager tier threshold and track your net losses</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      2
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Submit Support Ticket</p>
                    <p className="text-sm text-muted-foreground">Join our Discord and create a ticket with your account details and loss-back request</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      3
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Verification</p>
                    <p className="text-sm text-muted-foreground">Our team verifies your wager tier and loss amount (24-48 hours)</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      4
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Receive Your Loss-back</p>
                    <p className="text-sm text-muted-foreground">Once approved, your loss-back percentage is credited to your account</p>
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
            <p className="text-lg text-muted-foreground">Ready to claim your loss-back?</p>
            <Link href="https://discord.gg/packdraw" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                <span>💬</span>
                Claim Now on Discord
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">Submit a support ticket with your account details and loss amount</p>
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
