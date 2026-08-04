'use client'

import Link from 'next/link'

export interface MilestoneTier {
  tier: number
  label: string
  wager: number
  payout: number | string
  payoutLabel?: string // e.g. "$25" or "Contact"
}

// Per-tier medal colour + emoji used as a fallback icon inside a dark rounded square
const TIER_STYLES: Record<number, { bg: string; border: string; emoji: string }> = {
  1:  { bg: 'bg-amber-900/60',   border: 'border-amber-700/50',  emoji: '🥉' },
  2:  { bg: 'bg-amber-800/60',   border: 'border-amber-600/50',  emoji: '🪙' },
  3:  { bg: 'bg-slate-600/60',   border: 'border-slate-400/50',  emoji: '💎' },
  4:  { bg: 'bg-purple-900/60',  border: 'border-purple-500/50', emoji: '🔷' },
  5:  { bg: 'bg-yellow-800/60',  border: 'border-yellow-500/50', emoji: '⭐' },
  6:  { bg: 'bg-yellow-700/60',  border: 'border-yellow-400/50', emoji: '🌟' },
  7:  { bg: 'bg-teal-800/60',    border: 'border-teal-500/50',   emoji: '💠' },
  8:  { bg: 'bg-blue-900/60',    border: 'border-blue-500/50',   emoji: '🔵' },
  9:  { bg: 'bg-red-900/60',     border: 'border-red-500/50',    emoji: '🔴' },
  10: { bg: 'bg-zinc-600/60',    border: 'border-zinc-300/50',   emoji: '👑' },
  11: { bg: 'bg-indigo-900/60',  border: 'border-indigo-400/50', emoji: '✨' },
}

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US')
}

interface MilestoneTierRowProps {
  tier: MilestoneTier
  discordUrl: string
  isLast?: boolean
}

export function MilestoneTierRow({ tier, discordUrl, isLast }: MilestoneTierRowProps) {
  const style = TIER_STYLES[tier.tier] ?? TIER_STYLES[11]
  const payoutText = typeof tier.payout === 'number' ? fmt(tier.payout) : tier.payout

  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors ${
        !isLast ? 'border-b border-border/30' : ''
      }`}
    >
      {/* Medal icon */}
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-xl ${style.bg} ${style.border}`}
        aria-hidden="true"
      >
        {style.emoji}
      </div>

      {/* Tier name + level */}
      <div className="w-28 shrink-0">
        <p className="text-sm font-bold uppercase tracking-wide">Tier {tier.tier}</p>
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Level {tier.tier}
        </p>
      </div>

      {/* Wager requirement */}
      <div className="flex-1 text-sm font-semibold tabular-nums text-foreground/80">
        {fmt(tier.wager)}
      </div>

      {/* Payout — bright green, large */}
      <div className="w-28 text-right shrink-0">
        <span className="text-lg font-bold tabular-nums text-green-400">{payoutText}</span>
      </div>

      {/* CTA */}
      <div className="shrink-0 ml-2">
        <Link
          href={discordUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full bg-green-500 px-5 py-2 text-xs font-bold uppercase tracking-widest text-black hover:bg-green-400 active:scale-95 transition-all whitespace-nowrap"
        >
          Claim Ticket
        </Link>
      </div>
    </div>
  )
}
