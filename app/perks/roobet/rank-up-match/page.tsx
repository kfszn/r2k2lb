import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo-metadata'
import Link from 'next/link'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Button } from '@/components/ui/button'
import { Crown, Sparkles, MessageCircle } from 'lucide-react'

export const metadata: Metadata = generatePageMetadata('perksRoobetRankUpMatch')

const SIGNUP_URL = 'https://roobet.com/?ref=R2K2'
const DISCORD_URL = 'https://discord.gg/DwpA8vaGPj'
const SPONSOR = 'Roobet'

export default function RoobetRankUpMatchPage() {
  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-8">

          {/* Hero */}
          <div className="relative rounded-2xl overflow-hidden border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-emerald-900/10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 border border-primary/40 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider">
                Coming Soon
              </span>
            </div>
            <div className="relative p-8 md:p-12 space-y-4 text-center sm:text-left">
              <p className="text-sm font-semibold text-primary uppercase tracking-widest">
                {SPONSOR} — Code R2K2
              </p>
              <h1 className="text-4xl md:text-6xl font-black text-foreground leading-tight text-balance">
                Rank Up<br />
                <span className="text-primary">Match.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mx-auto sm:mx-0">
                Every time you rank up on {SPONSOR} under code{' '}
                <span className="font-mono font-bold text-foreground">R2K2</span>, R2K2 will
                match your rank up reward. Full details, tier breakdown, and claim flow are on the way.
              </p>
            </div>
          </div>

          {/* Placeholder detail card */}
          <div className="rounded-2xl border border-border/40 bg-card/30 p-8 sm:p-10 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30">
              <Crown className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">This page is still being built</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              We&apos;re finalizing the {SPONSOR} rank tier breakdown, match amounts, and Roobet rank
              badges/logos for this page. Check back soon — or join the Discord to be notified the
              moment it&apos;s live.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
                <Button size="sm">
                  <MessageCircle className="h-4 w-4 mr-1.5" />
                  Join Discord for Updates
                </Button>
              </a>
              <a href={SIGNUP_URL} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline">
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  Sign Up with Code R2K2
                </Button>
              </a>
            </div>
          </div>

          <div className="text-center">
            <Link href="/leaderboard/roobet" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to {SPONSOR} Leaderboard
            </Link>
          </div>

        </div>
      </main>
    </div>
  )
}
