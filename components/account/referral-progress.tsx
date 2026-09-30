'use client'

import useSWR from 'swr'
import { Loader2, Users2 } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface ReferredBreakdown {
  referredUsername: string
  rawEarnings: number
  cappedContribution: number
}

interface PlatformReferrals {
  total: number
  breakdown: ReferredBreakdown[]
}

interface ReferralsData {
  periodLabel: string
  referredCount: number
  platforms: { roobet: PlatformReferrals | null; luxdrop: PlatformReferrals | null }
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount)
}

function ReferredPlayerBar({ row }: { row: ReferredBreakdown }) {
  const pct = Math.min(100, (row.cappedContribution / 200) * 100)
  const capped = row.rawEarnings * 0.05 > row.cappedContribution
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{row.referredUsername}</span>
        <span className="font-mono">
          {formatMoney(row.cappedContribution)} <span className="text-muted-foreground">/ $200</span>
          {capped && <span className="text-yellow-500"> (capped)</span>}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function PlatformReferralCard({ label, data }: { label: string; data: PlatformReferrals }) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold text-emerald-400">{formatMoney(data.total)}</span>
      </div>
      {data.breakdown.length === 0 ? (
        <p className="text-xs text-muted-foreground">No referred activity yet this month.</p>
      ) : (
        <div className="space-y-2.5">
          {data.breakdown.map((row) => (
            <ReferredPlayerBar key={row.referredUsername} row={row} />
          ))}
        </div>
      )}
    </div>
  )
}

export function ReferralProgress() {
  const { data, isLoading } = useSWR<ReferralsData>('/api/account/referrals', fetcher)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading referral progress...
      </div>
    )
  }

  if (!data || data.referredCount === 0) {
    return (
      <div className="rounded-lg border border-border/40 bg-background/40 p-4 flex items-start gap-3">
        <Users2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Ask an admin to link a referral to start earning 10% of your referrals&apos; wager rewards, up to $200/mo per referral per
          platform.
        </p>
      </div>
    )
  }

  const { platforms, periodLabel } = data

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        10% of each referred player&apos;s claimed wager rewards, capped at $200/mo per referral per platform · {periodLabel}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {platforms.roobet && <PlatformReferralCard label="Roobet" data={platforms.roobet} />}
        {platforms.luxdrop && <PlatformReferralCard label="LuxDrop" data={platforms.luxdrop} />}
      </div>
    </div>
  )
}
