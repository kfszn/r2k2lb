'use client'

import Link from 'next/link'

export interface MilestoneTier {
  tier: number
  label: string
  wager: number
  payout: number | string
  payoutLabel?: string
}

// Per-tier icon: coloured circle with a letter/symbol, matching the reference image style
const TIER_STYLES: Record<number, { bg: string; border: string; text: string; symbol: string }> = {
  1:  { bg: 'bg-amber-800/70',   border: 'border-amber-600/60',  text: 'text-amber-300',  symbol: 'I'   },
  2:  { bg: 'bg-amber-700/70',   border: 'border-amber-500/60',  text: 'text-amber-200',  symbol: 'II'  },
  3:  { bg: 'bg-slate-600/70',   border: 'border-slate-400/60',  text: 'text-slate-200',  symbol: 'III' },
  4:  { bg: 'bg-violet-900/70',  border: 'border-violet-500/60', text: 'text-violet-300', symbol: 'IV'  },
  5:  { bg: 'bg-yellow-700/70',  border: 'border-yellow-500/60', text: 'text-yellow-200', symbol: 'V'   },
  6:  { bg: 'bg-yellow-600/70',  border: 'border-yellow-400/60', text: 'text-yellow-100', symbol: 'VI'  },
  7:  { bg: 'bg-teal-800/70',    border: 'border-teal-500/60',   text: 'text-teal-200',   symbol: 'VII' },
  8:  { bg: 'bg-blue-900/70',    border: 'border-blue-500/60',   text: 'text-blue-300',   symbol: 'VIII'},
  9:  { bg: 'bg-red-900/70',     border: 'border-red-500/60',    text: 'text-red-300',    symbol: 'IX'  },
  10: { bg: 'bg-zinc-600/70',    border: 'border-zinc-300/50',   text: 'text-zinc-100',   symbol: 'X'   },
  11: { bg: 'bg-indigo-900/70',  border: 'border-indigo-400/60', text: 'text-indigo-200', symbol: 'XI'  },
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
      className={`flex items-center gap-5 px-5 py-4 hover:bg-white/[0.025] transition-colors ${
        !isLast ? 'border-b border-border/25' : ''
      }`}
    >
      {/* Medal icon — circle with roman numeral, matching the reference image */}
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 ${style.bg} ${style.border}`}
        aria-hidden="true"
      >
        <span className={`text-[11px] font-black tracking-tight ${style.text}`}>{style.symbol}</span>
      </div>

      {/* Tier name + level sublabel */}
      <div className="w-32 shrink-0">
        <p className="text-base font-black uppercase tracking-wide text-foreground leading-tight">
          {tier.label}
        </p>
        <p className={`text-[11px] font-bold uppercase tracking-[0.18em] mt-0.5 ${style.text}`}>
          Level {tier.tier}
        </p>
      </div>

      {/* Wager requirement — large, prominent */}
      <div className="flex-1 text-base font-bold tabular-nums text-foreground">
        {fmt(tier.wager)}
      </div>

      {/* Payout — bright green, very large */}
      <div className="w-32 shrink-0 text-right">
        <span className="text-2xl font-black tabular-nums text-green-400 leading-none">
          {payoutText}
        </span>
      </div>

      {/* CLAIM TICKET button — solid green pill, all-caps, bold */}
      <div className="shrink-0 ml-2">
        <Link
          href={discordUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full bg-green-500 hover:bg-green-400 active:scale-95 transition-all px-6 py-2.5 text-[13px] font-black uppercase tracking-[0.12em] text-black whitespace-nowrap shadow-[0_0_12px_rgba(74,222,128,0.25)]"
        >
          Claim Ticket
        </Link>
      </div>
    </div>
  )
}
