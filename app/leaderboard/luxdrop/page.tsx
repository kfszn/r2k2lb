'use client'

import { Trophy, Sparkles, DollarSign } from 'lucide-react'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Header } from '@/components/header'

// LuxDrop sponsor leaderboard.
// Prize pool total: $2,500 — individual positions to be confirmed.
// NOTE: API not yet available. Once LuxDrop provides the endpoint, wire a
// fetch to `/api/leaderboard/luxdrop` (mirroring the AceBet page) and render
// the podium + table in place of the "launching soon" state below.
const PRIZE_TOTAL = 2500

export default function LuxdropLeaderboard() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <GiveawayCounter />
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/20 border border-primary/40">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="text-3xl font-bold text-primary">${PRIZE_TOTAL.toLocaleString()}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-balance">
              LuxDrop <span className="text-primary">${PRIZE_TOTAL.toLocaleString()}</span> Leaderboard
            </h1>
            <p className="text-lg text-muted-foreground text-pretty">
              Every <strong>wager</strong> on LuxDrop under Code <strong className="text-primary">R2K2</strong> counts towards your score.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/40 border border-border text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Prize positions coming soon — total pool of ${PRIZE_TOTAL.toLocaleString()}
            </div>
          </div>
        </div>
      </section>

      {/* Launching Soon State */}
      <section className="py-16 pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center py-16 bg-muted/30 rounded-2xl border border-border p-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/15 border border-primary/30 mb-6">
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-balance">The LuxDrop leaderboard is launching soon</h2>
            <p className="text-muted-foreground text-pretty">
              We&apos;re finishing the setup with our newest sponsor, LuxDrop. Standings and full prize
              breakdown will appear here once the competition goes live. Sign up on LuxDrop with code{' '}
              <strong className="text-primary">R2K2</strong> so your wagers count from day one.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
