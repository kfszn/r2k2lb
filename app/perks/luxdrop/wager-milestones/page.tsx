import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Milestone, Clock } from 'lucide-react'

export const metadata: Metadata = generatePageMetadata('perksLuxdropWagerMilestones')

const SIGNUP_URL = 'https://luxdrop.com/r/R2K2'
const SPONSOR = 'LuxDrop'

export default function LuxdropWagerMilestonesPage() {
  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Milestone className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">Wager Milestones</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Tiered rewards based on your total {SPONSOR} wager volume with code R2K2
            </p>
          </div>

          {/* Coming Soon Card */}
          <Card className="bg-gradient-to-br from-primary/10 via-card to-secondary/20 border-primary/30">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Clock className="h-6 w-6 text-primary" />
                Coming Soon
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                We&apos;re finalizing the {SPONSOR} wager milestone program. Soon you&apos;ll be able to unlock tiered
                bonuses as you hit total wager thresholds using code R2K2. Full details, milestone tiers, and reward
                amounts will be published here.
              </p>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Details Coming Soon
              </div>
              <div className="pt-2 space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <span className="text-primary">•</span>
                  Rewards scale with your total wagered volume
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-primary">•</span>
                  Exclusive to players using code R2K2
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-primary">•</span>
                  Sign up now so your wagers count once milestones go live
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">
              Get set up now so you&apos;re ready when milestones launch
            </p>
            <a href={SIGNUP_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                <Milestone className="h-5 w-5" />
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
