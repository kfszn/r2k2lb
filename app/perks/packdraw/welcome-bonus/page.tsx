import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Gift, Zap } from 'lucide-react'

export default function PackDrawWelcomeBonusPage() {
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
              <h1 className="text-4xl font-bold">PackDraw Welcome Bonus</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Start your PackDraw journey with exclusive bonus packs using code R2K2
            </p>
          </div>

          {/* Main Bonus Card */}
          <Card className="bg-gradient-to-br from-primary/10 via-card to-secondary/20 border-primary/30">
            <CardHeader>
              <CardTitle className="text-2xl">100% First Draw Bonus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Bonus Draw Credits</h3>
                  <p className="text-3xl font-bold text-primary">100%</p>
                  <p className="text-sm text-muted-foreground">
                    Match on your first purchase with a maximum bonus of $200 in draw credits
                  </p>
                  <div className="pt-4 space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Use code R2K2 at signup
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Valid on first purchase only
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Instant bonus credit
                    </p>
                  </div>
                </div>
                <div className="space-y-3 bg-card/50 p-4 rounded-lg border border-border/50">
                  <h3 className="font-semibold">Bonus Details</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <span className="font-medium">Purchase Range:</span>
                      <span className="text-muted-foreground ml-2">$10 - $200+</span>
                    </li>
                    <li>
                      <span className="font-medium">Maximum Bonus:</span>
                      <span className="text-primary font-bold ml-2">$200</span>
                    </li>
                    <li>
                      <span className="font-medium">Bonus Type:</span>
                      <span className="text-muted-foreground ml-2">Draw Credits</span>
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

          {/* How It Works */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>How the Welcome Bonus Works</CardTitle>
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
                    <p className="text-sm text-muted-foreground">Create your account on PackDraw's platform using referral code R2K2</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      2
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Make Your First Purchase</p>
                    <p className="text-sm text-muted-foreground">Purchase draw credits for your first pack opening session</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      3
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Bonus Credits Applied Instantly</p>
                    <p className="text-sm text-muted-foreground">Receive your 100% bonus credited immediately to your account</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      4
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Start Drawing</p>
                    <p className="text-sm text-muted-foreground">Use your bonus credits to open packs immediately with no restrictions</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bonus Examples */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Bonus Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                    <p className="font-semibold mb-3">Small Purchase</p>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">You Deposit:</span> $50</p>
                      <p><span className="font-medium">Bonus Credits:</span> $50</p>
                      <p className="text-primary font-bold">Total: $100</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                    <p className="font-semibold mb-3">Medium Purchase</p>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">You Deposit:</span> $100</p>
                      <p><span className="font-medium">Bonus Credits:</span> $100</p>
                      <p className="text-primary font-bold">Total: $200</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                    <p className="font-semibold mb-3">Large Purchase</p>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">You Deposit:</span> $250+</p>
                      <p><span className="text-muted-foreground">Cap at $200 bonus</span></p>
                      <p className="text-primary font-bold">Total: $450+</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Important Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-1">One-Time Offer</h4>
                  <p className="text-muted-foreground">
                    This welcome bonus is valid for first-time depositors only. Only one welcome bonus per account is permitted.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Bonus Credits Usage</h4>
                  <p className="text-muted-foreground">
                    Bonus credits can be used immediately on any packs available on the platform with no additional wagering requirements.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Bonus Withdrawal</h4>
                  <p className="text-muted-foreground">
                    Bonus credits used to open packs become part of your account. Winnings from bonus-opened packs are fully withdrawable after compliance checks.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Code Required</h4>
                  <p className="text-muted-foreground">
                    Use code R2K2 at signup. Accounts created without this code will not be eligible for the welcome bonus.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Management Reserve</h4>
                  <p className="text-muted-foreground">
                    Management reserves the right to void bonuses in cases of abuse, account manipulation, or suspicious activity.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">Claim your welcome bonus today!</p>
            <a href="https://packdraw.gg?code=R2K2" target="_blank" rel="noopener noreferrer">
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
