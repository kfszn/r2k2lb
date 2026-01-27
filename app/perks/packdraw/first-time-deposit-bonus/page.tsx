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
              Get a bonus on your first deposit with code R2K2
            </p>
          </div>

          {/* Main Bonus Card */}
          <Card className="bg-gradient-to-br from-primary/10 via-card to-secondary/20 border-primary/30">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome Bonus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">First Deposit Match</h3>
                  <p className="text-3xl font-bold text-primary">Up to 100%</p>
                  <p className="text-sm text-muted-foreground">
                    Get a percentage match on your first deposit
                  </p>
                  <div className="pt-4 space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      One-time bonus on first deposit
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Instant bonus credits
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
                      <span className="font-medium">Bonus Type:</span>
                      <span className="text-muted-foreground ml-2">Deposit match</span>
                    </li>
                    <li>
                      <span className="font-medium">Match Rate:</span>
                      <span className="text-primary font-bold ml-2">Up to 100%</span>
                    </li>
                    <li>
                      <span className="font-medium">Eligibility:</span>
                      <span className="text-muted-foreground ml-2">New players only</span>
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

          {/* Deposit Tiers */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Deposit Bonus Tiers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                    <p className="font-semibold mb-2">Starter Deposit</p>
                    <p className="text-2xl font-bold text-primary mb-2">$10 - $50</p>
                    <p className="text-sm text-muted-foreground">50% match bonus</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                    <p className="font-semibold mb-2">Standard Deposit</p>
                    <p className="text-2xl font-bold text-primary mb-2">$50 - $200</p>
                    <p className="text-sm text-muted-foreground">75% match bonus</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                    <p className="font-semibold mb-2">Premium Deposit</p>
                    <p className="text-2xl font-bold text-primary mb-2">$200 - $500</p>
                    <p className="text-sm text-muted-foreground">100% match bonus</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                    <p className="font-semibold mb-2">Elite Deposit</p>
                    <p className="text-2xl font-bold text-primary mb-2">$500+</p>
                    <p className="text-sm text-muted-foreground">100% match bonus + extras</p>
                  </div>
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
                    <p className="font-medium">Sign Up with Code</p>
                    <p className="text-sm text-muted-foreground">Create your account using code R2K2</p>
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
                    <p className="text-sm text-muted-foreground">Deposit funds into your new account</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      3
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Automatic Bonus Credit</p>
                    <p className="text-sm text-muted-foreground">Bonus is instantly added to your account</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      4
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Start Playing</p>
                    <p className="text-sm text-muted-foreground">Use your deposit + bonus to place wagers</p>
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
                  <span className="font-medium">You:</span> Deposit $300 with code R2K2
                </p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Bonus Rate:</span> 100% match (Premium tier)
                </p>
              </div>
              <div className="p-3 bg-primary/20 rounded-lg border border-primary/30">
                <p className="text-sm">
                  <span className="font-medium">Total Balance:</span> $300 deposit + $300 bonus = <span className="font-bold text-primary">$600</span>
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
                • This bonus is only available for new player accounts
              </p>
              <p className="text-muted-foreground">
                • Code R2K2 must be used at signup to qualify
              </p>
              <p className="text-muted-foreground">
                • Bonus is credited instantly after first deposit
              </p>
              <p className="text-muted-foreground">
                • Standard bonus terms and conditions apply
              </p>
              <p className="text-muted-foreground">
                • One bonus per player account
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">Get your first deposit bonus today!</p>
            <a href="https://packdraw.gg?code=R2K2" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                <TrendingUp className="h-5 w-5" />
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
