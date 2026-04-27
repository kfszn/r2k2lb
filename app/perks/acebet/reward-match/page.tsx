import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Flame,
  Trophy,
  Calendar,
  CalendarDays,
  Crown,
  BadgeCheck,
  MessageCircle,
  ChevronRight,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Reward Match | R2K2',
  description:
    'R2K2 personally matches 100% of every Acebet reward you earn — weekly, pre-monthly, and monthly. Play under code R2K2 and double every payout.',
}

export default function RewardMatchPage() {
  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">

          {/* Hero */}
          <div className="relative rounded-2xl overflow-hidden border border-purple-500/40 bg-gradient-to-br from-purple-500/10 via-card to-purple-900/10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 px-3 py-1 text-xs font-bold text-purple-400 uppercase tracking-wider">
                R2K2 Exclusive
              </span>
            </div>
            <div className="relative p-8 md:p-12 space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-purple-400 uppercase tracking-widest">Acebet — Code R2K2</p>
                <h1 className="text-4xl md:text-6xl font-black text-foreground leading-tight text-balance">
                  Reward<br />
                  <span className="text-purple-400">Match.</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                  Whatever Acebet rewards you — I&apos;ll match it. Every time. Weekly, pre-monthly, and monthly payouts all doubled, personally by me.
                </p>
              </div>

              {/* $X + $X = $2X formula */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-2.5 rounded-xl bg-card/70 border border-border/60 px-4 py-3">
                  <BadgeCheck className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground leading-none mb-0.5">Acebet Pays</p>
                    <p className="text-xl font-black text-foreground">$X</p>
                  </div>
                </div>
                <span className="text-3xl font-black text-purple-400">+</span>
                <div className="flex items-center gap-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 px-4 py-3">
                  <Flame className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-purple-400/70 leading-none mb-0.5">R2K2 Matches</p>
                    <p className="text-xl font-black text-purple-400">$X</p>
                  </div>
                </div>
                <span className="text-3xl font-black text-foreground">=</span>
                <div className="flex items-center gap-2.5 rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-3">
                  <Trophy className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-green-400/70 leading-none mb-0.5">You Pocket</p>
                    <p className="text-xl font-black text-green-400">$2X</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Three Reward Cycles */}
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Three Payout Cycles</h2>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                Acebet rewards you across three cycles. R2K2 doubles every single one.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Weekly */}
              <Card className="border-blue-500/30 bg-gradient-to-b from-blue-500/10 to-card relative overflow-hidden flex flex-col">
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-2 py-0.5">
                    Weekly
                  </span>
                </div>
                <CardContent className="pt-6 pb-5 space-y-3 flex-1 flex flex-col">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/20">
                    <Calendar className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">Weekly Reward</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Paid out by Acebet every week. Earn consistently just by playing under code R2K2.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    <p className="text-xs text-blue-400 font-medium">R2K2 doubles this payout</p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="w-full mt-2 border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/50">
                    <a href="https://discord.gg/RsjSPzGKTR" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Claim Via Discord
                    </a>
                  </Button>
                </CardContent>
              </Card>

              {/* Pre-Monthly */}
              <Card className="border-purple-500/30 bg-gradient-to-b from-purple-500/10 to-card relative overflow-hidden flex flex-col">
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full px-2 py-0.5">
                    Mid-Cycle
                  </span>
                </div>
                <CardContent className="pt-6 pb-5 space-y-3 flex-1 flex flex-col">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/20">
                    <CalendarDays className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">Pre-Monthly Reward</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      A mid-cycle bonus from Acebet before the monthly closes out.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                    <p className="text-xs text-purple-400 font-medium">R2K2 doubles this payout</p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="w-full mt-2 border-purple-500/30 hover:bg-purple-500/10 hover:border-purple-500/50">
                    <a href="https://discord.gg/RsjSPzGKTR" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Claim Via Discord
                    </a>
                  </Button>
                </CardContent>
              </Card>

              {/* Monthly */}
              <Card className="border-green-500/30 bg-gradient-to-b from-green-500/10 to-card relative overflow-hidden flex flex-col">
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5">
                    Monthly
                  </span>
                </div>
                <CardContent className="pt-6 pb-5 space-y-3 flex-1 flex flex-col">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/15 border border-green-500/20">
                    <Crown className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">Monthly Reward</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      The biggest cycle. Acebet&apos;s largest payout of the month — matched cent for cent.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 flex-shrink-0" />
                    <p className="text-xs text-green-400 font-medium">R2K2 doubles this payout</p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="w-full mt-2 border-green-500/30 hover:bg-green-500/10 hover:border-green-500/50">
                    <a href="https://discord.gg/RsjSPzGKTR" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Claim Via Discord
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* How to Claim */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Flame className="h-5 w-5 text-purple-400" />
                How to Claim Your Match
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Three steps to collect R2K2&apos;s match on top of your Acebet reward.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row">
                {/* Step 1 */}
                <div className="flex-1 flex md:flex-col gap-4 md:gap-3 items-start md:items-center md:text-center p-4 rounded-xl hover:bg-secondary/20 transition-colors">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 border border-border/60 text-xl font-black text-primary flex-shrink-0">
                    1
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold">Receive Your Acebet Reward</p>
                    <p className="text-sm text-muted-foreground">
                      Acebet pays your weekly, pre-monthly, or monthly reward automatically to your account.
                    </p>
                  </div>
                </div>

                <div className="hidden md:flex items-center text-muted-foreground/30 px-1">
                  <ChevronRight className="h-5 w-5" />
                </div>

                {/* Step 2 */}
                <div className="flex-1 flex md:flex-col gap-4 md:gap-3 items-start md:items-center md:text-center p-4 rounded-xl hover:bg-secondary/20 transition-colors">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/15 border border-blue-500/20 text-xl font-black text-blue-400 flex-shrink-0">
                    2
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold">Claim via Discord</p>
                    <p className="text-sm text-muted-foreground">
                      Open a ticket in the Discord and send a screenshot of your reward. Once verified, you get paid.
                    </p>
                    <a
                      href="https://discord.gg/RsjSPzGKTR"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors mt-1"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Join Discord
                    </a>
                  </div>
                </div>

                <div className="hidden md:flex items-center text-muted-foreground/30 px-1">
                  <ChevronRight className="h-5 w-5" />
                </div>

                {/* Step 3 */}
                <div className="flex-1 flex md:flex-col gap-4 md:gap-3 items-start md:items-center md:text-center p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/15 border border-purple-500/20 text-xl font-black text-purple-400 flex-shrink-0">
                    3
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-purple-400">R2K2 Doubles It</p>
                    <p className="text-sm text-muted-foreground">
                      Once verified, R2K2 pays you the exact same amount Acebet rewarded you. Doubled. Done.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4 pb-4">
            <p className="text-muted-foreground text-sm">
              Not on Acebet yet? Sign up and use code <span className="font-bold text-foreground">R2K2</span> to qualify.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="font-bold">
                <a href="https://www.acebet.co/welcome/r/r2k2" target="_blank" rel="noopener noreferrer">
                  Sign Up on Acebet
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/perks/acebet/wager-rewards">
                  View Wager Rewards
                </Link>
              </Button>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
