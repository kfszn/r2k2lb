import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Sparkles, Gift } from 'lucide-react'

export default function SeasonalBonusPage() {
  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">Seasonal Bonus</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Unlock exclusive seasonal rewards and limited-time bonuses with code R2K2
            </p>
          </div>

          {/* Main Seasonal Card */}
          <Card className="bg-gradient-to-br from-primary/10 via-card to-secondary/20 border-primary/30">
            <CardHeader>
              <CardTitle className="text-2xl">Seasonal Event Bonuses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Bonus Structure</h3>
                  <p className="text-3xl font-bold text-primary">25%+</p>
                  <p className="text-sm text-muted-foreground">
                    Additional bonus credits during seasonal events and promotions
                  </p>
                  <div className="pt-4 space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Exclusive seasonal offers
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Limited-time bonuses
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Event-based reward multipliers
                    </p>
                  </div>
                </div>
                <div className="space-y-3 bg-card/50 p-4 rounded-lg border border-border/50">
                  <h3 className="font-semibold">Season Details</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <span className="font-medium">Frequency:</span>
                      <span className="text-muted-foreground ml-2">Quarterly & Events</span>
                    </li>
                    <li>
                      <span className="font-medium">Bonus Type:</span>
                      <span className="text-muted-foreground ml-2">Draw Credits</span>
                    </li>
                    <li>
                      <span className="font-medium">Max Bonus:</span>
                      <span className="text-primary font-bold ml-2">Varies by Event</span>
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

          {/* Seasonal Calendar */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Upcoming Seasons & Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">Winter Season</p>
                      <p className="text-xs text-muted-foreground">December - February</p>
                    </div>
                    <span className="text-lg font-bold text-primary">+25%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Extra bonus credits on all pack purchases during winter months</p>
                </div>

                <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">Spring Fresh Start</p>
                      <p className="text-xs text-muted-foreground">March - May</p>
                    </div>
                    <span className="text-lg font-bold text-primary">+30%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">New season refresh with boosted reward rates</p>
                </div>

                <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">Summer Surge</p>
                      <p className="text-xs text-muted-foreground">June - August</p>
                    </div>
                    <span className="text-lg font-bold text-primary">+25%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Peak season rewards with exclusive summer draws</p>
                </div>

                <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">Fall Finale</p>
                      <p className="text-xs text-muted-foreground">September - November</p>
                    </div>
                    <span className="text-lg font-bold text-primary">+20%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">End of year bonuses and special limited packs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Special Events */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Special Event Bonuses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">Beyond seasonal events, we offer special bonuses during:</p>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-primary font-bold">🎉</span>
                  <div>
                    <p className="font-medium text-sm">Holiday Events</p>
                    <p className="text-xs text-muted-foreground">Christmas, New Year, Halloween bonuses</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-primary font-bold">📅</span>
                  <div>
                    <p className="font-medium text-sm">Milestone Celebrations</p>
                    <p className="text-xs text-muted-foreground">Platform anniversary and major milestones</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-primary font-bold">🎯</span>
                  <div>
                    <p className="font-medium text-sm">Community Challenges</p>
                    <p className="text-xs text-muted-foreground">Special bonuses for participating in community events</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-primary font-bold">🏆</span>
                  <div>
                    <p className="font-medium text-sm">Leaderboard Events</p>
                    <p className="text-xs text-muted-foreground">Bonus multipliers during seasonal leaderboard competitions</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>How Seasonal Bonuses Work</CardTitle>
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
                    <p className="text-sm text-muted-foreground">Create your account during any active season</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      2
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Automatic Enrollment</p>
                    <p className="text-sm text-muted-foreground">Automatically enrolled in all active seasonal promotions</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify="center rounded-full bg-primary/20 text-primary font-bold">
                      3
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Earn Extra Credits</p>
                    <p className="text-sm text-muted-foreground">Receive bonus percentage on top of regular rewards</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      4
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Use & Enjoy</p>
                    <p className="text-sm text-muted-foreground">Use bonus credits immediately on any available draws</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bonus Examples */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Example Seasonal Bonus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Current Season:</span> Spring Fresh Start (+30%)
                </p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Your Base Rewards:</span> $100 in credits earned
                </p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Seasonal Bonus:</span> $100 × 30% = $30 extra
                </p>
              </div>
              <div className="p-3 bg-primary/20 border border-primary/30 rounded-lg">
                <p className="text-sm font-medium">
                  Total Credits Earned: <span className="text-primary font-bold">$130</span>
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
                • Seasonal bonuses are applied automatically to all eligible accounts
              </p>
              <p className="text-muted-foreground">
                • Bonus percentages vary by season and are announced in advance
              </p>
              <p className="text-muted-foreground">
                • Seasonal bonuses stack on top of other rewards and promotions
              </p>
              <p className="text-muted-foreground">
                • All accounts created with code R2K2 are eligible for seasonal events
              </p>
              <p className="text-muted-foreground">
                • Special events and limited-time promotions are subject to change
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">Join the seasonal rewards program!</p>
            <a href="https://packdraw.gg?code=R2K2" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                <Gift className="h-5 w-5" />
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
