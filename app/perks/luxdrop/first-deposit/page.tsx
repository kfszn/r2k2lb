import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Gift, Zap } from 'lucide-react'

export const metadata: Metadata = generatePageMetadata('perksLuxdropFirstDeposit')

const SIGNUP_URL = 'https://luxdrop.com/r/R2K2'
const SPONSOR = 'LuxDrop'

export default function LuxdropFirstDepositBonusPage() {
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
              Get a flat 20% bonus on your first {SPONSOR} deposit with code R2K2
            </p>
          </div>

          {/* Main Bonus Card */}
          <Card className="bg-gradient-to-br from-primary/10 via-card to-secondary/20 border-primary/30">
            <CardHeader>
              <CardTitle className="text-2xl">20% First-Time Deposit Bonus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Deposit Match</h3>
                  <p className="text-3xl font-bold text-primary">20%</p>
                  <p className="text-sm text-muted-foreground">
                    Flat 20% match on your first deposit with no maximum cap
                  </p>
                  <div className="pt-4 space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Use code R2K2 to claim
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      No maximum bonus cap
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      2x playthrough on total balance
                    </p>
                  </div>
                </div>
                <div className="space-y-3 bg-card/50 p-4 rounded-lg border border-border/50">
                  <h3 className="font-semibold">Bonus Details</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <span className="font-medium">Match Rate:</span>
                      <span className="text-primary font-bold ml-2">20% (flat)</span>
                    </li>
                    <li>
                      <span className="font-medium">Maximum Bonus:</span>
                      <span className="text-primary font-bold ml-2">No cap</span>
                    </li>
                    <li>
                      <span className="font-medium">Playthrough:</span>
                      <span className="text-muted-foreground ml-2">2x total balance</span>
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

          {/* Playthrough Requirement Card */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Playthrough Requirement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                A 2x playthrough applies to your total balance (deposit + bonus) before the bonus can be withdrawn.
              </p>
              <div className="p-4 bg-secondary/20 rounded-lg border border-border/50">
                <p className="text-sm font-semibold mb-2">Example</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Deposit: $500</li>
                  <li>• Bonus (20%): $100</li>
                  <li>• Total balance: $600</li>
                  <li>
                    • Playthrough required: <span className="text-primary font-semibold">$1,200 wagered (2x)</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Important Terms & Fair Play</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-1">Flat 20% — No Cap</h4>
                  <p className="text-muted-foreground">
                    Your first deposit is matched at a flat 20% with no maximum bonus amount.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">2x Playthrough</h4>
                  <p className="text-muted-foreground">
                    Your total balance (deposit + bonus) is subject to a 2x playthrough requirement before withdrawal.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Wager Abuse Disqualifies</h4>
                  <p className="text-muted-foreground">
                    Wager abuse — including exploiting game weighting, bet patterns, low house-edge mechanics, or any
                    behaviour intended to game the playthrough — will result in disqualification and forfeiture of the bonus.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">One Bonus Per Player</h4>
                  <p className="text-muted-foreground">
                    This offer is valid for first-time deposits only. Multiple accounts or bonus abuse may result in
                    forfeiture of the bonus and account restrictions.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Code Requirement</h4>
                  <p className="text-muted-foreground">
                    This promotion requires the R2K2 referral code at signup. Accounts without this code are not eligible.
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
                    <p className="font-medium">Sign Up with Code R2K2</p>
                    <p className="text-sm text-muted-foreground">
                      Register on {SPONSOR} using code R2K2 to qualify for the bonus
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
                    <p className="font-medium">Make Your First Deposit</p>
                    <p className="text-sm text-muted-foreground">Deposit to receive a flat 20% bonus with no cap</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      3
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Claim via Discord Ticket</p>
                    <p className="text-sm text-muted-foreground">
                      Open a ticket in the R2K2 Discord with your {SPONSOR} username to claim your bonus
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
                    <p className="font-medium">Complete 2x Playthrough</p>
                    <p className="text-sm text-muted-foreground">
                      Wager your total balance 2x before withdrawing. Play fair — wager abuse disqualifies the bonus.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">Claim your {SPONSOR} welcome bonus today!</p>
            <a href={SIGNUP_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                <Zap className="h-5 w-5" />
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
