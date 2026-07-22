'use client'

import { useState, type ReactNode } from 'react'
import { Crown, Medal, Trophy } from 'lucide-react'

// ---------------------------------------------------------------------------
// Animated futuristic backdrop — fixed, non-interactive
// ---------------------------------------------------------------------------
export function LeaderboardBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* base wash */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
      {/* perspective grid */}
      <div className="lb-grid absolute inset-x-0 top-0 h-[70vh]" />
      {/* aurora orbs */}
      <div className="lb-orb absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/25" />
      <div
        className="lb-orb absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-accent/20"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="lb-orb absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-primary/15"
        style={{ animationDelay: '4s' }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Rank medallion
// ---------------------------------------------------------------------------
const TIER = {
  1: {
    label: '1st',
    text: 'text-yellow-300',
    ring: 'ring-yellow-400/60',
    glow: 'shadow-[0_0_50px_-6px_rgba(250,204,21,0.55)]',
    chip: 'bg-yellow-400/10 border-yellow-400/30 text-yellow-300',
    grad: 'from-yellow-300 to-amber-500',
    Icon: Crown,
  },
  2: {
    label: '2nd',
    text: 'text-slate-200',
    ring: 'ring-slate-300/50',
    glow: 'shadow-[0_0_40px_-10px_rgba(203,213,225,0.4)]',
    chip: 'bg-slate-300/10 border-slate-300/25 text-slate-200',
    grad: 'from-slate-200 to-slate-400',
    Icon: Medal,
  },
  3: {
    label: '3rd',
    text: 'text-amber-400',
    ring: 'ring-amber-600/50',
    glow: 'shadow-[0_0_40px_-10px_rgba(217,119,6,0.4)]',
    chip: 'bg-amber-600/10 border-amber-600/25 text-amber-400',
    grad: 'from-amber-400 to-amber-700',
    Icon: Medal,
  },
} as const

export function RankBadge({ rank }: { rank: number }) {
  const tier = TIER[rank as 1 | 2 | 3]
  if (tier) {
    return (
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${tier.grad} text-sm font-black text-background shadow-lg`}
      >
        {rank}
      </span>
    )
  }
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-muted/40 font-mono text-sm font-bold text-muted-foreground">
      {rank}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
export function StatCard({
  label,
  value,
  icon,
  tone = 'primary',
  className = '',
}: {
  label: string
  value: ReactNode
  icon: ReactNode
  tone?: 'primary' | 'accent' | 'destructive'
  className?: string
}) {
  const toneMap = {
    primary: { border: 'border-primary/25', text: 'text-primary', icon: 'text-primary/50', bar: 'bg-primary' },
    accent: { border: 'border-accent/30', text: 'text-accent', icon: 'text-accent/50', bar: 'bg-accent' },
    destructive: { border: 'border-destructive/30', text: 'text-destructive', icon: 'text-destructive/50', bar: 'bg-destructive' },
  }[tone]

  return (
    <div className={`lb-card group relative overflow-hidden rounded-xl border ${toneMap.border} ${className}`}>
      <div className={`absolute left-0 top-0 h-full w-0.5 ${toneMap.bar} opacity-70`} />
      <div className="flex items-center justify-between gap-2 px-4 py-3.5">
        <div className="min-w-0">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
          <p className={`truncate font-mono text-xl font-bold tabular-nums ${toneMap.text}`}>{value}</p>
        </div>
        <span className={`flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${toneMap.icon}`}>{icon}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Podium card (top 3)
// ---------------------------------------------------------------------------
export function PodiumCard({
  rank,
  name,
  avatar,
  wagered,
  prize,
  fallback,
  size = 'md',
}: {
  rank: 1 | 2 | 3
  name: string
  avatar: string
  wagered: string
  prize: string
  fallback: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const [imgError, setImgError] = useState(false)
  const tier = TIER[rank]
  const isFirst = rank === 1

  const avatarSize = size === 'lg' ? 'h-24 w-24' : size === 'sm' ? 'h-14 w-14' : 'h-16 w-16'
  const pad = size === 'lg' ? 'p-6 pt-8' : size === 'sm' ? 'p-4 pt-6' : 'p-5 pt-7'

  return (
    <div
      className={`relative rounded-2xl ${isFirst ? 'lb-ring lb-shimmer' : ''} ${tier.glow} transition-transform duration-300 hover:-translate-y-1.5`}
    >
      <div className={`relative flex flex-col items-center gap-3 rounded-2xl border ${isFirst ? 'border-transparent' : 'border-border/50'} bg-card/70 text-center backdrop-blur-xl ${pad}`}>
        {/* floating rank numeral */}
        <span
          className={`pointer-events-none absolute right-3 top-2 select-none font-mono text-5xl font-black leading-none ${tier.text} opacity-10`}
        >
          {rank}
        </span>

        <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] ${tier.text}`}>
          <tier.Icon className={`${size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'}`} />
          {tier.label} Place
        </div>

        <div className={`relative ${avatarSize} overflow-hidden rounded-full ring-2 ${tier.ring}`}>
          <img
            src={imgError ? fallback : avatar}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover"
            crossOrigin="anonymous"
            onError={() => setImgError(true)}
          />
        </div>

        <p className={`w-full truncate font-bold text-foreground ${size === 'lg' ? 'text-xl' : 'text-sm'}`}>{name}</p>

        <div className="w-full space-y-1.5">
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-1.5 text-xs">
            <span className="text-muted-foreground">Wagered</span>
            <span className="font-mono font-semibold tabular-nums text-foreground">{wagered}</span>
          </div>
          <div className={`flex items-center justify-between rounded-lg border px-3 py-1.5 text-xs ${tier.chip}`}>
            <span className="opacity-80">Prize</span>
            <span className={`font-bold ${size === 'lg' ? 'text-base' : ''}`}>{prize}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Player row (rank 4+)
// ---------------------------------------------------------------------------
export function PlayerRow({
  rank,
  name,
  avatar,
  wagered,
  prize,
  fallback,
}: {
  rank: number
  name: string
  avatar: string
  wagered: string
  prize: string
  fallback: string
}) {
  const [imgError, setImgError] = useState(false)
  return (
    <div className="group relative grid grid-cols-[56px_1fr_130px_100px] items-center px-4 py-3 transition-colors hover:bg-primary/5">
      {/* hover accent line */}
      <div className="absolute left-0 top-0 h-full w-0.5 origin-top scale-y-0 bg-primary transition-transform duration-200 group-hover:scale-y-100" />
      <div className="flex items-center">
        <RankBadge rank={rank} />
      </div>
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full ring-1 ring-primary/30">
          <img
            src={imgError ? fallback : avatar}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover"
            crossOrigin="anonymous"
            onError={() => setImgError(true)}
          />
        </div>
        <p className="truncate text-sm font-semibold">{name}</p>
      </div>
      <p className="text-right font-mono text-sm font-semibold tabular-nums text-foreground">{wagered}</p>
      <p className="text-right font-mono text-sm font-bold tabular-nums text-accent">{prize}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Table header (matches PlayerRow grid)
// ---------------------------------------------------------------------------
export function TableHeader() {
  return (
    <div className="grid grid-cols-[56px_1fr_130px_100px] border-b border-border/50 bg-muted/30 px-4 py-3">
      <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Rank</span>
      <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Player</span>
      <span className="text-right text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Wagered</span>
      <span className="text-right text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Prize</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Prize badge (hero total)
// ---------------------------------------------------------------------------
export function PrizePool({ total }: { total: string }) {
  return (
    <div className="lb-ring inline-flex items-center gap-3 rounded-full border border-transparent bg-card/60 px-7 py-3 backdrop-blur-xl">
      <Trophy className="h-6 w-6 text-primary" />
      <span className="neon-text font-mono text-3xl font-black tabular-nums text-primary">{total}</span>
    </div>
  )
}
