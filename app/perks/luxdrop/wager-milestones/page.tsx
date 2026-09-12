import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { MilestoneTracker } from '@/components/milestones/milestone-tracker'
import { getMilestoneTiers } from '@/lib/milestones/tiers'
import { createClient } from '@/lib/supabase/server'
import { Milestone } from 'lucide-react'

export const metadata: Metadata = generatePageMetadata('perksLuxdropWagerMilestones')

const SIGNUP_URL = 'https://luxdrop.com/r/R2K2'
const DISCORD_URL = 'https://discord.gg/RsjSPzGKTR'
const SPONSOR = 'LuxDrop'

export default async function LuxdropWagerMilestonesPage() {
  // Resolve the signed-in player's linked LuxDrop username (linked_accounts,
  // set via Discord linking) so tier "Claimed" status lines up exactly with
  // the account /api/milestones/progress tracks live wager progress for.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let username: string | null = null
  if (user) {
    const { data: link } = await supabase
      .from('linked_accounts')
      .select('platform_username')
      .eq('kick_user_id', user.id)
      .eq('platform', 'luxdrop')
      .maybeSingle()
    username = link?.platform_username ?? null
  }

  // Tiers are admin-editable — see wager_milestone_tiers in /admin's Rewards
  // tab. $10 per $1,000 wagered is the current default shape.
  const TIERS = await getMilestoneTiers('luxdrop', username)

  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Page header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Milestone className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Wager Milestones</h1>
            </div>
            <p className="text-muted-foreground">
              Earn <span className="text-foreground font-medium">$10 per $1,000 wagered</span> on {SPONSOR} with code{' '}
              <span className="text-primary font-mono font-bold">R2K2</span>. Hit a milestone, open a Discord ticket to
              claim your reward.
            </p>
          </div>

          {/* Personal progress + tier table */}
          <MilestoneTracker
            platform="luxdrop"
            sponsor={SPONSOR}
            tiers={TIERS}
            discordUrl={DISCORD_URL}
          />

          {/* Info note */}
          <p className="text-sm text-muted-foreground px-1">
            Wager totals are measured over the current {SPONSOR} leaderboard cycle and{' '}
            <span className="text-foreground font-medium">reset with the leaderboard</span>. Open a ticket in Discord to
            claim any milestone you&apos;ve unlocked before the cycle ends.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <a href={SIGNUP_URL} target="_blank" rel="noopener noreferrer">
              <Button size="sm">Sign Up with Code R2K2</Button>
            </a>
            <Link href="/leaderboard/luxdrop">
              <Button variant="outline" size="sm">Back to {SPONSOR} Leaderboard</Button>
            </Link>
          </div>

        </div>
      </main>
    </div>
  )
}
