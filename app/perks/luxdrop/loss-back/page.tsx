import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Shield, TrendingDown } from 'lucide-react'

export const metadata: Metadata = generatePageMetadata('perksLuxdropLossBack')

const SIGNUP_URL = 'https://luxdrop.com/r/R2K2'
const SPONSOR = 'LuxDrop'

export default function LuxdropLossBackPage() {
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
              Get a flat 10% of your monthly {SPONSOR} losses back — no maximum cap
            </p>
          </div>

          {/* Main Loss-back Card */}
          <Card className="bg-gradient-to-br from-primary/10 via-card to-secondary/20 border-primary/30">
            <CardHeader>
              <CardTitle className="text-2xl">Monthly Loss-back Program</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Loss-back Percentage</h3>
                  <p className="text-3xl font-bold text-primary">10%</p>
                  <p className="text-sm text-muted-foreground">
                    Earn a flat 10% loss-back on every claim with no maximum cap. Manually claimed via ticket with
                    verified PnL.
                  </p>
                  <div className="pt-4 space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Flat 10% loss-back rate
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      No maximum cap
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Manual claim process via ticket
                    </p>
                  </div>
                </div>
                <div className="space-y-3 bg-card/50 p-4 rounded-lg border border-border/50">
                  <h3 className="font-semibold">Program Details</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <span className="font-medium">Rate:</span>
                      <span className="text-primary font-bold ml-2">Flat 10%</span>
                    </li>
                    <li>
                      <span className="font-medium">Monthly Cap:</span>
                      <span className="text-primary font-bold ml-2">No cap</span>
                    </li>
                    <li>
                      <span className="font-medium">Frequency:</span>
                      <span className="text-muted-foreground ml-2">Monthly via ticket submission</span>
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
              <CardTitle>How to Claim Loss-back</CardTitle>
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
                    <p className="font-medium">Request Your Monthly PnL</p>
                    <p className="text-sm text-muted-foreground">
                      Contact {SPONSOR} support and request your Profit & Loss statement for the calendar month
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      2
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Verify Your Net Loss</p>
                    <p className="text-sm text-muted-foreground">
                      Your true PnL will be verified by staff on Discord to confirm your net monthly loss
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      3
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Create a Support Ticket</p>
                    <p className="text-sm text-muted-foreground">
                      Submit a ticket to R2K2 via Discord with your PnL screenshot, {SPONSOR} username, and the month
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      4
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Receive Your Loss-back Credit</p>
                    <p className="text-sm text-muted-foreground">
                      Staff applies a flat 10% loss-back on your verified net loss — no maximum cap
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Loss-back Calculation Example</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Monthly Net Loss:</span> $2,500
                </p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Rate:</span> Flat 10% (no cap)
                </p>
              </div>
              <div className="p-3 bg-primary/20 rounded-lg border border-primary/30">
                <p className="text-sm">
                  <span className="font-medium">Loss-back Credit:</span> $2,500 × 10% = $250
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Important Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-semibold mb-1">Flat Loss-back Rate</p>
                <p className="text-muted-foreground">
                  All claims earn a flat 10% loss-back with no maximum cap. This amount comes from R2K2&apos;s pocket, not
                  the casino.
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">Verification Required</p>
                <p className="text-muted-foreground">
                  All Loss-back claims must be manually verified by staff. Submit your PnL screenshot and {SPONSOR}{' '}
                  username via support ticket.
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">Code Requirement</p>
                <p className="text-muted-foreground">
                  This promotion requires the R2K2 referral code to be used at signup. Accounts without this code are not
                  eligible.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">Start earning loss-back today!</p>
            <a href={SIGNUP_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                <TrendingDown className="h-5 w-5" />
                Sign Up with Code R2K2
              </Button>
            </a>
          </div>

          {/* Back Link */}
          <div className="text-center">
            <Link href="/leaderboard/luxdrop">
              <Button variant="outline">Back to {SPONSOR} Leaderboard</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
