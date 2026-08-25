'use client'

import Link from 'next/link'
import { Medal, Award, Star, Sparkles, Gem, Crown, Trophy, Ticket, Check, Lock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface MilestoneTier {
  tier: number
  label: string
  wager: number
  /** Cumulative payout total at this milestone */
  payout: number | string
  /** Amount claimable at this tier = payout minus previous tier's payout */
  claimable?: number
  payoutLabel?: string
}

interface Palette {
  icon: LucideIcon
  iconWrap: string
  iconText: string
  pill: string
  accent: string
  rowHover: string
}

// Escalating "metal/gem" palettes — bronze → silver → gold → platinum → sapphire → ruby → diamond → elite
const PALETTES: Record<string, Palette> = {
  bronze: {
    icon: Medal,
    iconWrap: 'bg-gradient-to-br from-amber-500/25 to-amber-800/20 ring-1 ring-amber-500/40 shadow-[0_0_22px_-8px_rgba(245,158,11,0.7)]',
    iconText: 'text-amber-300',
    pill: 'bg-amber-500/10 border-amber-500/25 text-amber-300',
    accent: 'bg-amber-500',
    rowHover: 'hover:bg-amber-500/[0.04]',
  },
  silver: {
    icon: Award,
    iconWrap: 'bg-gradient-to-br from-slate-300/25 to-slate-600/20 ring-1 ring-slate-300/40 shadow-[0_0_22px_-8px_rgba(203,213,225,0.6)]',
    iconText: 'text-slate-200',
    pill: 'bg-slate-400/10 border-slate-300/25 text-slate-200',
    accent: 'bg-slate-300',
    rowHover: 'hover:bg-slate-300/[0.04]',
  },
  gold: {
    icon: Star,
    iconWrap: 'bg-gradient-to-br from-yellow-400/30 to-amber-600/20 ring-1 ring-yellow-400/45 shadow-[0_0_24px_-7px_rgba(250,204,21,0.75)]',
    iconText: 'text-yellow-200',
    pill: 'bg-yellow-400/10 border-yellow-400/25 text-yellow-200',
    accent: 'bg-yellow-400',
    rowHover: 'hover:bg-yellow-400/[0.04]',
  },
  platinum: {
    icon: Sparkles,
    iconWrap: 'bg-gradient-to-br from-teal-300/25 to-cyan-600/20 ring-1 ring-teal-300/40 shadow-[0_0_24px_-7px_rgba(94,234,212,0.7)]',
    iconText: 'text-teal-200',
    pill: 'bg-teal-400/10 border-teal-300/25 text-teal-200',
    accent: 'bg-teal-300',
    rowHover: 'hover:bg-teal-400/[0.04]',
  },
  sapphire: {
    icon: Gem,
    iconWrap: 'bg-gradient-to-br from-blue-400/30 to-blue-700/20 ring-1 ring-blue-400/45 shadow-[0_0_24px_-7px_rgba(96,165,250,0.75)]',
    iconText: 'text-blue-200',
    pill: 'bg-blue-500/10 border-blue-400/25 text-blue-200',
    accent: 'bg-blue-400',
    rowHover: 'hover:bg-blue-500/[0.04]',
  },
  ruby: {
    icon: Gem,
    iconWrap: 'bg-gradient-to-br from-rose-400/30 to-red-700/20 ring-1 ring-rose-400/45 shadow-[0_0_24px_-7px_rgba(251,113,133,0.75)]',
    iconText: 'text-rose-200',
    pill: 'bg-rose-500/10 border-rose-400/25 text-rose-200',
    accent: 'bg-rose-400',
    rowHover: 'hover:bg-rose-500/[0.04]',
  },
  diamond: {
    icon: Crown,
    iconWrap: 'bg-gradient-to-br from-sky-200/30 to-cyan-500/20 ring-1 ring-sky-200/50 shadow-[0_0_26px_-6px_rgba(186,230,253,0.85)]',
    iconText: 'text-sky-100',
    pill: 'bg-sky-400/10 border-sky-200/30 text-sky-100',
    accent: 'bg-sky-200',
    rowHover: 'hover:bg-sky-400/[0.04]',
  },
  elite: {
    icon: Trophy,
    iconWrap: 'bg-gradient-to-br from-violet-400/30 to-indigo-700/25 ring-1 ring-violet-400/50 shadow-[0_0_28px_-6px_rgba(167,139,250,0.9)]',
    iconText: 'text-violet-200',
    pill: 'bg-violet-500/10 border-violet-400/30 text-violet-200',
    accent: 'bg-violet-400',
    rowHover: 'hover:bg-violet-500/[0.04]',
  },
}

const TIER_TO_PALETTE: Record<number, keyof typeof PALETTES> = {
  1: 'bronze', 2: 'bronze', 3: 'bronze',
  4: 'silver', 5: 'silver', 6: 'silver',
  7: 'gold',   8: 'gold',
  9: 'platinum', 10: 'platinum',
  11: 'sapphire',
  12: 'ruby',
  13: 'diamond',
  14: 'elite',
}

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US')
}

interface MilestoneTierRowProps {
  tier: MilestoneTier
  discordUrl: string
  isLast?: boolean
  /**
   * Per-user progress state:
   *  - undefined → no tracking (visitor not signed in / not linked)
   *  - true      → wager requirement met this cycle (unlocked)
   *  - false     → tracking active but not yet reached (locked)
   */
  reached?: boolean
}

export function MilestoneTierRow({ tier, discordUrl, isLast, reached }: MilestoneTierRowProps) {
  const palette = PALETTES[TIER_TO_PALETTE[tier.tier] ?? 'elite']
  const Icon = palette.icon
  const payoutText = typeof tier.payout === 'number' ? fmt(tier.payout) : tier.payout
  const claimableText = tier.claimable != null ? fmt(tier.claimable) : null

  const tracking = reached !== undefined
  const isUnlocked = reached === true
  const isLocked = reached === false

  return (
    <div
      className={`group relative flex flex-col gap-3 px-4 py-4 transition-colors sm:flex-row sm:items-center sm:gap-4 sm:px-5 ${palette.rowHover} ${
        !isLast ? 'border-b border-border/30' : ''
      } ${isUnlocked ? 'bg-emerald-500/[0.05]' : ''} ${isLocked ? 'opacity-55' : ''}`}
    >
      {/* Left accent bar — persistent when unlocked, else fades in on hover */}
      <span
        className={`absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-r-full transition-all duration-300 ${
          isUnlocked
            ? 'h-[62%] bg-emerald-400 opacity-100'
            : `h-0 ${palette.accent} opacity-0 group-hover:h-[62%] group-hover:opacity-100`
        }`}
        aria-hidden="true"
      />

      {/* Top row (mobile): icon + tier/badge + reward. Desktop: same row as everything else. */}
      <div className="flex items-center gap-4 sm:contents">
        {/* Tier medal icon */}
        <div
          className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14 ${palette.iconWrap} transition-transform duration-300 group-hover:scale-105`}
          aria-hidden="true"
        >
          <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${palette.iconText}`} strokeWidth={2} />
        </div>

        {/* Tier name + level pill */}
        <div className="min-w-0 flex-1 sm:w-28 sm:flex-none sm:shrink-0">
          <p className="text-sm sm:text-base font-black uppercase tracking-wide text-foreground leading-tight">
            {tier.label}
          </p>
          {isUnlocked ? (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              <Check className="h-3 w-3" strokeWidth={3} />
              Unlocked
            </span>
          ) : (
            <span
              className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${palette.pill}`}
            >
              Level {tier.tier}
            </span>
          )}
        </div>

        {/* Reward — cumulative total + claimable delta (shown here on mobile, right-aligned) */}
        <div className="shrink-0 text-right sm:hidden">
          <span className="text-lg font-black tabular-nums text-emerald-400 leading-none [text-shadow:0_0_22px_rgba(52,211,153,0.4)]">
            {payoutText}
          </span>
          {claimableText && (
            <p className="mt-0.5 text-[10px] font-semibold tabular-nums text-emerald-300/60 leading-none">
              +{claimableText} claim
            </p>
          )}
        </div>
      </div>

      {/* Wager requirement */}
      <div className="flex-1 min-w-0 sm:order-none">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-0.5 sm:hidden">
          Wager Required
        </p>
        <p className="text-base sm:text-lg font-bold tabular-nums text-foreground truncate">
          {fmt(tier.wager)}
        </p>
      </div>

      {/* Reward — desktop only (duplicated compact version shown above on mobile) */}
      <div className="hidden w-28 shrink-0 text-right sm:block">
        <span className="text-2xl font-black tabular-nums text-emerald-400 leading-none [text-shadow:0_0_22px_rgba(52,211,153,0.4)]">
          {payoutText}
        </span>
        {claimableText && (
          <p className="mt-0.5 text-[10px] font-semibold tabular-nums text-emerald-300/60 leading-none">
            +{claimableText} claim
          </p>
        )}
      </div>

      {/* Claim Ticket — gradient blue pill with glow. Locked when tracking a
          user who hasn't reached this tier yet. Full-width on mobile, fixed-width on desktop. */}
      <div className="w-full shrink-0 sm:ml-2 sm:w-[130px]">
        {isLocked ? (
          <div
            className="flex items-center justify-center gap-1.5 rounded-full border border-border/50 bg-muted/30 px-5 py-2.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground whitespace-nowrap sm:text-[12px]"
            aria-label="Locked — milestone not yet reached"
          >
            <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
            Locked
          </div>
        ) : (
          <Link
            href={discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 px-5 py-2.5 text-[11px] font-black uppercase tracking-wider text-white whitespace-nowrap shadow-[0_0_20px_-6px_rgba(96,165,250,0.7)] transition-all duration-200 hover:from-blue-300 hover:to-blue-500 hover:shadow-[0_0_24px_-4px_rgba(96,165,250,0.9)] active:scale-95 sm:text-[12px]"
          >
            <Ticket className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
            Claim Ticket
          </Link>
        )}
      </div>
    </div>
  )
}
