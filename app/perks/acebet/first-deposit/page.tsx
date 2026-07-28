import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Gift, Zap } from 'lucide-react'

export const metadata: Metadata = generatePageMetadata('perksAcebetFirstDeposit')

const SIGNUP_URL = 'https://www.acebet.co/welcome/r/r2k2'
const SPONSOR = 'AceBet'

export default function AceBetFirstDepositBonusPage() {
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
              Get a 50% bonus on your first {SPONSOR} deposit with code R2K2
            </p>
          </div>

          {/* Main Bonus Card */}
          <Card className="bg-gradient-to-br from-primary/10 via-card to-secondary/20 border-primary/30">
            <CardHeader>
              <CardTitle className="text-2xl">50% First-Time Deposit Bonus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Deposit Match</h3>
                  <p className="text-3xl font-bold text-primary">50%</p>
                  <p className="text-sm text-muted-foreground">
                    50% match on your first deposit, up to a maximum bonus of $250
                  </p>
                  <div className="pt-4 space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      Use code R2K2 to claim
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      Claim within 24 hours of deposit
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      Tiered wagering requirements
                    </p>
                  </div>
                </div>
                <div className="space-y-3 bg-card/50 p-4 rounded-lg border border-border/50">
                  <h3 className="font-semibold">Bonus Details</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <span className="font-medium">Match Rate:</span>
                      <span className="text-muted-foreground ml-2">50%</span>
                    </li>
                    <li>
                      <span className="font-medium">Maximum Bonus:</span>
                      <span className="text-primary font-bold ml-2">$250</span>
                    </li>
                    <li>
                      <span className="font-medium">Minimum Deposit:</span>
                      <span className="text-muted-foreground ml-2">$10</span>
                    </li>
                    <li>
                      <span className="font-medium">Claim Window:</span>
                      <span className="text-muted-foreground ml-2">24 hours</span>
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

          {/* Wagering Requirements */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Wagering Requirements</CardTitle>
              <p className="text-sm text-muted-foreground pt-1">
                Must be completed within 7–10 days. Requirements are tiered by deposit amount.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-secondary/20 p-4 rounded-lg border border-border/50">
                  <p className="font-semibold mb-2">Deposits $10 – $100</p>
                  <p className="text-2xl font-bold text-primary mb-2">40x</p>
                  <p className="text-xs text-muted-foreground">
                    Example: $100 deposit + $50 bonus = $2,000 wagering required
                  </p>
                </div>
                <div className="bg-secondary/20 p-4 rounded-lg border border-border/50">
                  <p className="font-semibold mb-2">Deposits $101 – $250</p>
                  <p className="text-2xl font-bold text-primary mb-2">50x</p>
                  <p className="text-xs text-muted-foreground">
                    Example: $200 deposit + $100 bonus = $5,000 wagering required
                  </p>
                </div>
                <div className="bg-secondary/20 p-4 rounded-lg border border-border/50">
                  <p className="font-semibold mb-2">Deposits $250+</p>
                  <p className="text-2xl font-bold text-primary mb-2">80x</p>
                  <p className="text-xs text-muted-foreground">
                    Bonus is capped at $250 maximum regardless of deposit size
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Important Terms & Fair Play</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-1">Claim Window</h4>
                <p className="text-muted-foreground">
                  This bonus must be claimed within 24 hours of your deposit via a Discord ticket. Failure to claim within this window voids the bonus.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Wager Abuse</h4>
                <p className="text-muted-foreground">
                  Exploiting game weighting, bet patterns, or low house-edge mechanics to game the wagering requirement will result in disqualification and forfeiture of the bonus.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Excluded Games</h4>
                <p className="text-muted-foreground">
                  Dice, Blackjack, Baccarat, Roulette, and any other low house-edge or exploit-prone games do not count toward the wagering requirement. Playing them may result in bonus forfeiture.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">One Bonus Per Player</h4>
                <p className="text-muted-foreground">
                  Valid for first-time deposits only. Multiple accounts or bonus abuse will result in forfeiture and account restrictions.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Code Requirement</h4>
                <p className="text-muted-foreground">
                  The R2K2 referral code must be used at signup. Accounts without this code are not eligible.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* How to Claim */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>How to Claim Your Bonus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  step: 1,
                  title: 'Sign Up with Code R2K2',
                  body: `Visit acebet.co and use code R2K2 during registration`,
                },
                {
                  step: 2,
                  title: 'Make Your First Deposit',
                  body: 'Deposit at least $10 to qualify for the 50% match bonus',
                },
                {
                  step: 3,
                  title: 'Claim Within 24 Hours',
                  body: 'Open a ticket in Discord to claim your bonus within 24 hours of deposit',
                },
                {
                  step: 4,
                  title: 'Complete Wagering',
                  body: 'Play through your bonus according to the tiered wagering requirements (40x – 80x). Slots contribute 100%.',
                },
              ].map(({ step, title, body }) => (
                <div key={step} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      {step}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">{body}</p>
                  </div>
                </div>
              ))}
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
            <Link href="/leaderboard/acebet">
              <Button variant="outline">Back to {SPONSOR} Leaderboard</Button>
            </Link>
          </div>

        </div>
      </main>
    </div>
  )
}
