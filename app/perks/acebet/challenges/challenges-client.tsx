'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Trophy, MessageCircle, ExternalLink, Zap, Clock } from 'lucide-react'

type Challenge = {
  id: string
  title: string
  description: string
  prize: string
  image_url: string | null
  active: boolean
  sort_order: number
}

const DISCORD_URL = 'https://discord.gg/r2k2'
const SPONSOR = 'AceBet'
const PERKS_NAV = [
  { label: 'Wager Rewards', href: '/perks/acebet/wager-rewards' },
  { label: 'Reward Match', href: '/perks/acebet/reward-match' },
  { label: 'Challenges', href: '/perks/acebet/challenges' },
]

export function ChallengesClient({ challenges }: { challenges: Challenge[] }) {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-orange-900/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-xs font-bold text-amber-400 uppercase tracking-wider">
            {challenges.filter((c) => c.active).length} Active
          </span>
        </div>
        <div className="relative p-8 md:p-12 space-y-4">
          <p className="text-sm font-semibold text-amber-400 uppercase tracking-widest">
            {SPONSOR} — Code R2K2
          </p>
          <h1 className="text-4xl md:text-6xl font-black text-foreground leading-tight text-balance">
            Challenges.<br />
            <span className="text-amber-400">Win Prizes.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
            Complete the challenges below while playing on {SPONSOR} under code{' '}
            <span className="font-mono font-bold text-foreground">R2K2</span>. Hit the target,
            open a Discord ticket with proof, and claim your prize.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-amber-400 to-amber-500 px-5 py-2.5 text-sm font-black uppercase tracking-wider text-amber-950 shadow-[0_0_24px_-6px_rgba(245,158,11,0.7)] transition-all hover:from-amber-300 hover:to-amber-400 hover:shadow-[0_0_28px_-4px_rgba(245,158,11,0.9)] active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              Create a Ticket
            </Link>
            <a
              href="https://acebet.co"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-5 py-2.5 text-sm font-bold text-foreground transition-all hover:bg-card hover:border-border active:scale-95"
            >
              Play on {SPONSOR}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Perks sub-nav */}
      <nav className="flex flex-wrap gap-2" aria-label="AceBet perks">
        {PERKS_NAV.map((item) => {
          const isActive = item.href.includes('challenges')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Challenges grid */}
      {challenges.length === 0 ? (
        <div className="rounded-2xl border border-border/40 bg-card/30 py-20 text-center">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-lg font-semibold text-muted-foreground">No challenges yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Check back soon — new challenges drop regularly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className={`group relative rounded-2xl border overflow-hidden transition-all ${
                challenge.active
                  ? 'border-border/40 bg-gradient-to-b from-card/70 to-card/30 hover:border-amber-500/30 hover:shadow-[0_0_40px_-16px_rgba(245,158,11,0.3)]'
                  : 'border-border/20 bg-card/20 opacity-50'
              }`}
            >
              {/* Ended ribbon */}
              {!challenge.active && (
                <div className="absolute top-3 left-3 z-10">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 border border-border/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Ended
                  </span>
                </div>
              )}

              {/* Image */}
              <div className="relative w-full aspect-video bg-muted/30 overflow-hidden">
                {challenge.image_url ? (
                  <Image
                    src={challenge.image_url}
                    alt={challenge.title}
                    fill
                    className={`object-cover transition-transform duration-500 ${challenge.active ? 'group-hover:scale-105' : 'grayscale'}`}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Trophy className="h-12 w-12 text-muted-foreground/20" />
                  </div>
                )}
                {/* Prize badge */}
                <div className="absolute top-3 right-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full backdrop-blur-sm px-3 py-1 text-[11px] font-black uppercase tracking-wider shadow-lg ${challenge.active ? 'bg-emerald-500/90 text-emerald-950' : 'bg-muted/80 text-muted-foreground'}`}>
                    <Zap className="h-3 w-3" />
                    {challenge.prize}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-3">
                <h3 className="text-base font-black text-foreground leading-tight">{challenge.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{challenge.description}</p>

                <div className="flex items-center justify-between pt-1 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prize</span>
                    <span className={`text-sm font-black ${challenge.active ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                      {challenge.prize}
                    </span>
                  </div>
                  {challenge.active ? (
                    <Link
                      href={DISCORD_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full bg-gradient-to-b from-amber-400 to-amber-500 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-amber-950 shadow-[0_0_16px_-6px_rgba(245,158,11,0.6)] transition-all hover:from-amber-300 hover:to-amber-400 active:scale-95 whitespace-nowrap"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Claim — Open Ticket
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1.5 rounded-full border border-border/40 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                      <Clock className="h-3.5 w-3.5" />
                      Ended
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* How to claim */}
      <div className="rounded-xl border border-border/40 bg-card/30 px-4 py-4 space-y-1.5">
        <p className="text-sm font-semibold text-foreground">How to claim</p>
        <p className="text-sm text-muted-foreground">
          Complete the challenge on {SPONSOR} while using code{' '}
          <span className="font-mono font-bold text-foreground">R2K2</span>. Open a ticket in the
          Discord server and post your screen recording or screenshot as proof. Prizes are paid once
          verified — one claim per challenge per user.
        </p>
      </div>
    </div>
  )
}
