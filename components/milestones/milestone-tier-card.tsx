'use client'

import Link from 'next/link'
import { Gift, Lock, Check, Ticket } from 'lucide-react'
import type { MilestoneTier } from './milestone-tier-row'

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString('en-US')
}

export function compact(n: number) {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${+(n / 1_000).toFixed(1)}K`
  return Math.round(n).toLocaleString('en-US')
}

interface MilestoneTierCardProps {
  tier: MilestoneTier
  wagered: number
  discordUrl: string
  /** When false (signed out / not linked), only the tier and reward are shown. */
  tracking?: boolean
}

export function MilestoneTierCard({ tier, wagered, discordUrl, tracking = true }: MilestoneTierCardProps) {
  const reached = wagered >= tier.wager
  // A tier can only show "Claimed" once its wager requirement is genuinely met,
  // so an over-approved running total never marks a locked tier as claimed.
  const claimed = tier.claimed === true && reached
  const pct = Math.min(100, Math.max(0, (wagered / tier.wager) * 100))
  const remaining = Math.max(0, tier.wager - wagered)
  const reward =
    tier.claimable ?? (typeof tier.payout === 'number' ? tier.payout : null)

  return (
    <article
      className={`flex flex-col gap-3 rounded-xl border p-3 sm:p-4 ${
        reached ? 'border-emerald-400/30 bg-emerald-500/[0.06]' : 'border-border/50 bg-card/60'
      }`}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
        <h3 className="text-lg font-black leading-none tracking-tight tabular-nums text-foreground sm:text-xl">
          {fmt(tier.wager)}
        </h3>
        {reward != null && (
          <span className="inline-flex items-center gap-1 text-sm font-bold tabular-nums text-blue-300">
            <Gift className="h-3.5 w-3.5" aria-hidden="true" />
            {fmt(reward)}
            <span className="sr-only"> reward</span>
          </span>
        )}
      </div>

      {tracking && (
      <>
      <div className="flex flex-col gap-1.5">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          aria-label={`Progress to ${fmt(tier.wager)}`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-[width] duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-2 text-xs tabular-nums">
          {reached ? (
            <span className="font-semibold text-emerald-400">Reached</span>
          ) : (
            <span className="truncate text-muted-foreground">{compact(remaining)} to go</span>
          )}
          <span className="shrink-0 text-muted-foreground">{pct >= 100 ? '100' : pct.toFixed(1)}%</span>
        </div>
      </div>

      {claimed ? (
        <div className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-blue-500/10 text-xs font-bold uppercase tracking-wider text-blue-300">
          <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
          Claimed
        </div>
      ) : reached ? (
        <Link
          href={discordUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-blue-400 to-blue-600 text-xs font-black uppercase tracking-wider text-white transition-colors hover:from-blue-300 hover:to-blue-500 active:scale-95"
        >
          <Ticket className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
          Claim Ticket
        </Link>
      ) : (
        <div className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-muted/40 text-xs font-semibold text-muted-foreground">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Keep Wagering
        </div>
      )}
      </>
      )}
    </article>
  )
}
