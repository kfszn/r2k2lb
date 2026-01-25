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
              <CardTitle className="text-2xl">Welcome Bonus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Match Deposit Bonus</h3>
                  <p className="text-3xl font-bold text-primary">Up to 100%</p>
                  <p className="text-sm text-muted-foreground">
                    We'll match your first deposit up to a maximum bonus amount
                  </p>
                  <div className="pt-4 space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Instant bonus credit
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Available immediately
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      No hidden requirements
                    </p>
                  </div>
                </div>
                <div className="space-y-3 bg-card/50 p-4 rounded-lg border border-border/50">
                  <h3 className="font-semibold">Bonus Details</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <span className="font-medium">Minimum Deposit:</span>
                      <span className="text-muted-foreground ml-2">$10</span>
                    </li>
                    <li>
                      <span className="font-medium">Maximum Bonus:</span>
                      <span className="text-muted-foreground ml-2">Varies by region</span>
                    </li>
                    <li>
                      <span className="font-medium">Wagering Requirement:</span>
                      <span className="text-muted-foreground ml-2">Standard terms apply</span>
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

          {/* Terms & Conditions */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold mb-1">Eligibility</h4>
                  <p className="text-muted-foreground">
                    This bonus is available to new players only. You must be 18+ years old and register with the code R2K2 to qualify.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Bonus Credits</h4>
                  <p className="text-muted-foreground">
                    Your bonus is credited as bonus funds and must be wagered according to Acebet's bonus terms before withdrawal.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">One Bonus Per Account</h4>
                  <p className="text-muted-foreground">
                    Only one first deposit bonus per player account. Multiple accounts will result in forfeiture of bonus.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Game Restrictions</h4>
                  <p className="text-muted-foreground">
                    Some games may contribute less to the wagering requirement. Check Acebet's bonus terms for full details.
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
                    <p className="font-medium">Sign Up</p>
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
                    <p className="text-sm text-muted-foreground">Deposit at least $10 to qualify for the bonus</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      3
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Receive Your Bonus</p>
                    <p className="text-sm text-muted-foreground">Your bonus will be credited automatically to your account</p>
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
                    <p className="text-sm text-muted-foreground">Use your bonus funds to play and meet wagering requirements</p>
                  </div>
                </div>
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
