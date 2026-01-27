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
              <CardTitle className="text-2xl">Recover Your Monthly Losses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Loss-back Recovery</h3>
                  <p className="text-3xl font-bold text-primary">Up to 15%</p>
                  <p className="text-sm text-muted-foreground">
                    Get a percentage of your monthly P&L losses back based on your wager tier (max $250)
                  </p>
                  <div className="pt-4 space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Monthly calculation window
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Based on P&L (Profit & Loss)
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Maximum $250 per month
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Claim via Discord ticket
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
                      <span className="font-medium">Cycle:</span>
                      <span className="text-primary font-bold ml-2">Monthly</span>
                    </li>
                    <li>
                      <span className="font-medium">Maximum:</span>
                      <span className="text-primary font-bold ml-2">$250/month</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Claim Button - Moved Up */}
          <div className="text-center space-y-4 bg-primary/5 border border-primary/20 rounded-lg p-6">
            <h3 className="font-semibold text-lg">Ready to claim your loss-back?</h3>
            <Link href="https://discord.gg/packdraw" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                <span>💬</span>
                Claim Now on Discord
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">Submit a support ticket with your Acebet stats and we'll verify your P&L within 24-48 hours</p>
          </div>

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
              <CardTitle>Monthly P&L Loss-back Examples</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border border-border/50 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-sm">Scenario 1: Tier 1 Player ($0-$15K wager)</p>
                  <p className="text-sm text-muted-foreground">Monthly P&L: -$2,000 loss</p>
                  <p className="text-sm text-muted-foreground">Loss-back Rate: 5%</p>
                  <p className="text-sm font-bold text-primary">
                    Calculation: $2,000 × 5% = <span className="text-lg">$100</span>
                  </p>
                </div>

                <div className="border border-border/50 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-sm">Scenario 2: Tier 2 Player ($15K-$50K wager)</p>
                  <p className="text-sm text-muted-foreground">Monthly P&L: -$3,500 loss</p>
                  <p className="text-sm text-muted-foreground">Loss-back Rate: 10%</p>
                  <p className="text-sm font-bold text-primary">
                    Calculation: $3,500 × 10% = <span className="text-lg">$350</span> → Capped at <span className="text-lg">$250</span>
                  </p>
                </div>

                <div className="border border-border/50 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-sm">Scenario 3: Tier 3 Player ($50K+ wager)</p>
                  <p className="text-sm text-muted-foreground">Monthly P&L: -$5,000 loss</p>
                  <p className="text-sm text-muted-foreground">Loss-back Rate: 15%</p>
                  <p className="text-sm font-bold text-primary">
                    Calculation: $5,000 × 15% = <span className="text-lg">$750</span> → Capped at <span className="text-lg">$250</span>
                  </p>
                </div>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-500 mb-2">Monthly Maximum</p>
                <p className="text-sm text-muted-foreground">
                  All loss-back rewards are capped at <span className="font-bold text-primary">$250 per calendar month</span>. Monthly cycles reset on the 1st of each month.
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
                • Loss-back is calculated monthly based on your Acebet account's P&L (Profit & Loss)
              </p>
              <p className="text-muted-foreground">
                • Monthly cycles run from the 1st to the last day of each calendar month
              </p>
              <p className="text-muted-foreground">
                • Your tier is determined by your monthly wager amount on Acebet
              </p>
              <p className="text-muted-foreground">
                • Maximum loss-back reward per month: <span className="font-bold text-primary">$250</span>
              </p>
              <p className="text-muted-foreground">
                • Claim your loss-back via Discord ticket with your Acebet stats screenshot
              </p>
              <p className="text-muted-foreground">
                • This promotion requires the R2K2 referral code to be used at Acebet signup
              </p>
            </CardContent>
          </Card>
