'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KindBadge, KindSelect } from '@/components/admin/bonus-hunt-entries'
import { formatMoney, type Currency } from '@/lib/hunt/currency'
import type { HuntEntry, HuntStats } from '@/lib/hunt/stats'
import { huntRequest } from '@/lib/hunt/use-bonus-hunt'

const ENTRIES_URL = '/api/admin/bonus-hunt/entries'

function PlayStat({ label, value, tone }: { label: string; value: string; tone?: 'win' | 'loss' }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border bg-card px-4 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`text-lg font-semibold tabular-nums ${
          tone === 'win' ? 'text-primary' : tone === 'loss' ? 'text-destructive' : 'text-foreground'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function Thumb({ entry }: { entry: HuntEntry }) {
  return entry.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={entry.imageUrl} alt="" className="size-14 rounded-md border border-border object-cover" />
  ) : (
    <span
      aria-hidden="true"
      className="flex size-14 items-center justify-center rounded-md border border-border bg-muted text-lg font-semibold text-muted-foreground"
    >
      {entry.game.charAt(0).toUpperCase()}
    </span>
  )
}

export function BonusHuntPlay({
  entries,
  stats,
  currency,
  startBalance,
  onRefresh,
  onExit,
}: {
  entries: HuntEntry[]
  stats: HuntStats
  currency: Currency
  startBalance: number
  onRefresh: () => void
  onExit: () => void
}) {
  const firstUnopened = Math.max(
    0,
    entries.findIndex((entry) => entry.status !== 'opened' || entry.payout === null),
  )
  const [index, setIndex] = useState(firstUnopened)
  const [payout, setPayout] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const payoutRef = useRef<HTMLInputElement>(null)

  const current = entries[Math.min(index, entries.length - 1)]
  const next = entries[index + 1]
  const money = (value: number) => formatMoney(value, currency)

  useEffect(() => {
    setPayout(current?.payout === null || current?.payout === undefined ? '' : String(current.payout))
    setError(null)
    payoutRef.current?.focus()
  }, [current?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const multiplier = useMemo(() => {
    const value = Number.parseFloat(payout)
    if (!current || !Number.isFinite(value) || current.betSize <= 0) return null
    return value / current.betSize
  }, [payout, current])

  if (!current) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">This hunt has no bonuses to open yet.</p>
        <Button variant="outline" onClick={onExit}>
          Back to hunt
        </Button>
      </div>
    )
  }

  const opened = entries.filter((entry) => entry.status === 'opened' && entry.payout !== null).length
  const profit = stats.winnings - startBalance
  const cumulativeX = entries.reduce(
    (sum, entry) => (entry.payout !== null && entry.betSize > 0 ? sum + entry.payout / entry.betSize : sum),
    0,
  )
  const isLast = index >= entries.length - 1

  async function save(patch: Record<string, unknown>) {
    setBusy(true)
    const result = await huntRequest('PATCH', ENTRIES_URL, { id: current.id, ...patch })
    setBusy(false)
    if (!result.ok) setError(result.error ?? 'Could not save.')
    else onRefresh()
    return result.ok
  }

  async function continueToNext() {
    if (payout.trim() === '') return
    const ok = await save({ payout })
    if (!ok) return
    if (isLast) onExit()
    else setIndex(index + 1)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <PlayStat label="Progress" value={`${index + 1} / ${entries.length}`} />
        <PlayStat label="Start Cost" value={money(startBalance)} />
        <PlayStat label="Winnings" value={money(stats.winnings)} />
        <PlayStat label="P&L" value={`${profit >= 0 ? '+' : '-'}${money(Math.abs(profit))}`} tone={profit >= 0 ? 'win' : 'loss'} />
        <PlayStat label="Remaining" value={String(stats.remaining)} />
        <PlayStat label="Run Avg" value={stats.runAverage === null ? '—' : `${stats.runAverage.toFixed(2)}x`} />
        <PlayStat label="Req Avg" value={stats.requiredAverage === null ? '—' : `${stats.requiredAverage.toFixed(2)}x`} />
        <PlayStat label="Cum. X" value={`${cumulativeX.toFixed(2)}x`} />
        <PlayStat label="Break Even" value={money(Math.max(0, startBalance - stats.winnings))} />
        <PlayStat label="Opened" value={`${opened} / ${entries.length}`} />
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onExit}>
          <ArrowLeft className="mr-1 size-4" aria-hidden="true" />
          Back to hunt
        </Button>
      </div>

      <section aria-label="Open bonus" className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Thumb entry={current} />
            <div className="flex flex-col gap-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">{current.game}</h2>
                <KindBadge kind={current.kind} />
              </div>
              <p className="text-sm text-muted-foreground">
                Game {index + 1}/{entries.length}
                {current.calledBy ? ` · Called by ${current.calledBy}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <KindSelect value={current.kind} onChange={(kind) => void save({ kind })} className="w-28" />
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous bonus"
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next bonus"
              disabled={isLast}
              onClick={() => setIndex(index + 1)}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="play-bet">Bet Size ({currency})</Label>
            <Input id="play-bet" readOnly value={current.betSize > 0 ? money(current.betSize) : '—'} className="tabular-nums" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="play-payout">Payout ({currency})</Label>
            <Input
              id="play-payout"
              ref={payoutRef}
              inputMode="decimal"
              placeholder="0.00"
              value={payout}
              onChange={(event) => setPayout(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.nativeEvent.isComposing) void continueToNext()
              }}
              className="tabular-nums"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="play-multi">Multiplier</Label>
            <Input
              id="play-multi"
              readOnly
              value={multiplier === null ? '—' : `${multiplier.toFixed(2)}x`}
              className="tabular-nums"
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="secondary" onClick={onExit}>
            Cancel
          </Button>
          <p className="text-sm text-muted-foreground">
            {next ? (
              <>
                Next Game: <span className="font-semibold text-foreground">{next.game}</span>
              </>
            ) : (
              'Last bonus'
            )}
          </p>
          <Button onClick={() => void continueToNext()} disabled={busy || payout.trim() === ''}>
            {isLast ? 'Finish' : 'Continue'}
            <ArrowRight className="ml-1 size-4" aria-hidden="true" />
          </Button>
        </div>
      </section>
    </div>
  )
}
