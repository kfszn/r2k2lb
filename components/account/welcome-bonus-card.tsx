'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Loader2, PartyPopper, CheckCircle2 } from 'lucide-react'

interface WelcomeBonusStatus {
  periodLabel: string
  wagerRequired: number
  amount: number
  wagered: number | null
  wagerError: boolean
  remaining: number
  claimed: boolean
  claimStatus: 'pending' | 'approved' | 'paid' | null
  canRedeem: boolean
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount)
}

const CLAIM_STATUS_COPY: Record<NonNullable<WelcomeBonusStatus['claimStatus']>, string> = {
  pending: 'Redeemed. Pending payout.',
  approved: 'Redeemed. Approved, payout on the way.',
  paid: 'Redeemed and paid out.',
}

export function WelcomeBonusCard() {
  const { data, mutate } = useSWR<{ status: WelcomeBonusStatus | null }>('/api/account/welcome-bonus', fetcher)
  const [redeeming, setRedeeming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const status = data?.status
  if (!status) return null

  const wagered = status.wagered ?? 0
  const pct = Math.min(100, (wagered / status.wagerRequired) * 100)

  const redeem = async () => {
    setRedeeming(true)
    setError(null)
    try {
      const res = await fetch('/api/account/welcome-bonus', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Redeem failed')
      await mutate()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Redeem failed')
      await mutate()
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <PartyPopper className="h-4 w-4 text-primary shrink-0" />
            Monthly Welcome Bonus
          </div>
          <p className="text-xs text-muted-foreground">
            Wager {formatMoney(status.wagerRequired)} on Roobet this month to redeem {formatMoney(status.amount)}.
          </p>
        </div>
        <span className="text-lg font-bold text-primary shrink-0">{formatMoney(status.amount)}</span>
      </div>

      {status.wagerError ? (
        <p className="text-xs text-muted-foreground">Couldn&apos;t load your live Roobet wager right now.</p>
      ) : status.claimed ? (
        <div className="flex items-center gap-2 text-xs text-foreground">
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          {status.claimStatus ? CLAIM_STATUS_COPY[status.claimStatus] : 'Redeemed.'}
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
                role="progressbar"
                aria-valuenow={Math.round(pct)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Welcome bonus wager progress"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {formatMoney(wagered)} of {formatMoney(status.wagerRequired)} wagered
              {!status.canRedeem && ` · ${formatMoney(status.remaining)} to go`}
            </p>
          </div>

          <Button onClick={redeem} disabled={!status.canRedeem || redeeming} className="w-full h-11">
            {redeeming && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            {status.canRedeem ? `Redeem ${formatMoney(status.amount)}` : 'Keep wagering to unlock'}
          </Button>
        </>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-[10px] text-muted-foreground italic">
        One redemption per month. Resets with the new {status.periodLabel.replace(' Welcome Bonus', '')} cycle.
      </p>
    </div>
  )
}
