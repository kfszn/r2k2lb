'use client'

import { useCallback, useRef, useState } from 'react'
import useSWR from 'swr'
import { Input } from '@/components/ui/input'
import { Loader2, Shuffle, Eraser } from 'lucide-react'
import { BALANCE_KEY, refreshShell, formatKoins } from '@/components/games/game-shell'
import {
  KENO_GRID,
  KENO_MAX_PICKS,
  KENO_MULTIPLIERS,
  kenoMultiplier,
  type KenoRisk,
} from '@/lib/games/keno-config'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())
const round2 = (n: number) => Math.round(n * 100) / 100
const RISKS: KenoRisk[] = ['low', 'medium', 'high']

interface Result {
  picks: number[]
  drawn: number[]
  matched: number
  multiplier: number
  payout: number
  profit: number
}

export function KenoBoard() {
  const { data: balanceData } = useSWR(BALANCE_KEY, fetcher, { refreshInterval: 8000 })
  const balance = balanceData?.balance ?? 0

  const [betAmount, setBetAmount] = useState('10')
  const [risk, setRisk] = useState<KenoRisk>('medium')
  const [picks, setPicks] = useState<Set<number>>(new Set())
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [result, setResult] = useState<Result | null>(null)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const drawTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  const bet = Number(betAmount)
  const drawnSet = result ? new Set(result.drawn) : new Set<number>()

  const togglePick = (n: number) => {
    if (playing) return
    setResult(null)
    setRevealed(new Set())
    setPicks((prev) => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n)
      else if (next.size < KENO_MAX_PICKS) next.add(n)
      return next
    })
  }

  const autoPick = () => {
    if (playing) return
    setResult(null)
    setRevealed(new Set())
    const pool = Array.from({ length: KENO_GRID }, (_, i) => i + 1)
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    setPicks(new Set(pool.slice(0, KENO_MAX_PICKS)))
  }

  const clear = () => {
    if (playing) return
    setPicks(new Set())
    setResult(null)
    setRevealed(new Set())
  }

  const clearTimers = () => {
    drawTimers.current.forEach(clearTimeout)
    drawTimers.current = []
  }

  const placeBet = useCallback(async () => {
    setError(null)
    if (picks.size === 0) {
      setError('Pick at least one number')
      return
    }
    if (!Number.isFinite(bet) || bet < 1) {
      setError('Enter a valid bet amount')
      return
    }
    if (bet > balance) {
      setError('Insufficient R2Koins balance')
      return
    }

    clearTimers()
    setPlaying(true)
    setResult(null)
    setRevealed(new Set())

    try {
      const res = await fetch('/api/games/v2/keno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount: round2(bet), picks: Array.from(picks), risk }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Bet failed')
        setPlaying(false)
        return
      }

      // Reveal drawn numbers one at a time.
      const drawn: number[] = data.drawn
      drawn.forEach((num, i) => {
        const t = setTimeout(() => {
          setRevealed((prev) => new Set([...prev, num]))
          if (i === drawn.length - 1) {
            setResult({
              picks: data.picks,
              drawn: data.drawn,
              matched: data.matched,
              multiplier: data.multiplier,
              payout: data.payout,
              profit: data.profit,
            })
            refreshShell('keno', data.balance)
            setPlaying(false)
          }
        }, 70 * (i + 1))
        drawTimers.current.push(t)
      })
    } catch {
      setError('Network error')
      setPlaying(false)
    }
  }, [picks, bet, balance, risk])

  const adjustBet = (fn: (n: number) => number) => {
    const next = round2(Math.max(1, fn(Number.isFinite(bet) ? bet : 0)))
    setBetAmount(String(next))
  }

  // Paytable rows for current pick count.
  const table = picks.size > 0 ? KENO_MULTIPLIERS[risk][picks.size] : null
  const tableRows = table
    ? Object.entries(table)
        .map(([hits, mult]) => ({ hits: Number(hits), mult: mult as number }))
        .sort((a, b) => a.hits - b.hits)
    : []

  const potentialTop =
    picks.size > 0 ? kenoMultiplier(risk, picks.size, picks.size) : 0

  return (
    <div className="space-y-4">
      {/* Game stage */}
      <div
        className="relative rounded-2xl border border-border/50 overflow-hidden p-4 md:p-6"
        style={{
          background:
            'radial-gradient(120% 120% at 50% 0%, oklch(0.2 0.03 260) 0%, oklch(0.13 0.02 260) 55%, oklch(0.11 0.02 260) 100%)',
        }}
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Number grid */}
          <div className="flex-1">
            <div className="grid grid-cols-10 gap-1.5 md:gap-2">
              {Array.from({ length: KENO_GRID }, (_, i) => i + 1).map((n) => {
                const picked = picks.has(n)
                const isRevealed = revealed.has(n)
                const isHit = picked && drawnSet.has(n) && isRevealed
                const isMiss = picked && result != null && !drawnSet.has(n)
                const drawnOnly = !picked && drawnSet.has(n) && isRevealed

                return (
                  <button
                    key={n}
                    onClick={() => togglePick(n)}
                    disabled={playing}
                    className={cn(
                      'aspect-square rounded-lg text-xs md:text-sm font-bold tabular-nums flex items-center justify-center border transition-all duration-150 select-none disabled:cursor-default',
                      !picked &&
                        !isRevealed &&
                        'bg-background/40 border-border/40 text-muted-foreground hover:border-amber-500/40 hover:text-foreground',
                      picked &&
                        !isHit &&
                        !isMiss &&
                        'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_10px_-1px_rgba(245,158,11,0.5)]',
                      isHit &&
                        'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-[0_0_14px_-1px_rgba(16,185,129,0.6)] scale-105 z-10',
                      isMiss && 'bg-amber-500/5 border-amber-500/20 text-amber-500/30',
                      drawnOnly && 'bg-red-900/25 border-red-800/40 text-red-400/70',
                    )}
                  >
                    {n}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Paytable */}
          <div className="lg:w-52 shrink-0">
            <div className="rounded-xl border border-border/40 bg-background/40 p-3 h-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Payouts
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {picks.size}/{KENO_MAX_PICKS}
                </span>
              </div>
              {tableRows.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 py-4 text-center">
                  Select numbers to see payouts
                </p>
              ) : (
                <div className="space-y-1">
                  {tableRows.map(({ hits, mult }) => {
                    const isWin = result != null && result.matched === hits && mult > 0
                    return (
                      <div
                        key={hits}
                        className={cn(
                          'flex items-center justify-between rounded-md px-2 py-1 text-xs border transition-all',
                          isWin
                            ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-300'
                            : 'border-transparent text-muted-foreground',
                        )}
                      >
                        <span>{hits} hit{hits !== 1 ? 's' : ''}</span>
                        <span className="font-bold tabular-nums text-foreground">{mult}x</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Result banner */}
        <div className="h-7 mt-4 flex items-center justify-center">
          {result && (
            <div
              className={cn(
                'text-sm font-semibold animate-fade-in',
                result.multiplier > 0 ? 'text-emerald-400' : 'text-red-400',
              )}
            >
              {result.matched} of {result.picks.length} hit ·{' '}
              {result.multiplier > 0
                ? `${result.multiplier}x · +${formatKoins(result.profit)} R2K`
                : `No win · ${formatKoins(result.profit)} R2K`}
            </div>
          )}
          {!result && !playing && (
            <span className="text-sm text-muted-foreground">
              Pick 1–{KENO_MAX_PICKS} numbers, then place your bet
            </span>
          )}
          {playing && (
            <span className="text-sm text-amber-400 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Drawing…
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-2xl border border-border/50 bg-card/60 p-4 md:p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bet amount */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Bet Amount (R2K)
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                min={1}
                step="0.01"
                disabled={playing}
                className="tabular-nums font-semibold"
              />
              {[
                { label: '½', fn: (n: number) => n / 2 },
                { label: '2×', fn: (n: number) => n * 2 },
              ].map((b) => (
                <button
                  key={b.label}
                  disabled={playing}
                  onClick={() => adjustBet(b.fn)}
                  className="shrink-0 rounded-md border border-border/60 bg-muted/40 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                >
                  {b.label}
                </button>
              ))}
              <button
                disabled={playing}
                onClick={() => setBetAmount(String(round2(balance)))}
                className="shrink-0 rounded-md border border-border/60 bg-muted/40 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                Max
              </button>
            </div>
          </div>

          {/* Risk */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Risk
            </label>
            <div className="flex gap-2">
              {RISKS.map((r) => (
                <button
                  key={r}
                  disabled={playing}
                  onClick={() => {
                    setRisk(r)
                    setResult(null)
                    setRevealed(new Set())
                  }}
                  className={cn(
                    'flex-1 h-10 rounded-md border text-sm font-semibold capitalize transition-colors disabled:opacity-40',
                    risk === r
                      ? 'border-amber-500/50 bg-amber-500/15 text-amber-400'
                      : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick actions + stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            disabled={playing}
            onClick={autoPick}
            className="h-11 rounded-xl border border-border/60 bg-muted/40 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Shuffle className="h-4 w-4" /> Auto Pick
          </button>
          <button
            disabled={playing}
            onClick={clear}
            className="h-11 rounded-xl border border-border/60 bg-muted/40 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Eraser className="h-4 w-4" /> Clear
          </button>
          <div className="rounded-xl border border-border/40 bg-background/40 px-4 py-2 flex flex-col justify-center">
            <div className="text-xs text-muted-foreground">Max Win</div>
            <div className="text-sm font-bold tabular-nums text-amber-400">
              {picks.size > 0 ? `${potentialTop}x` : '--'}
            </div>
          </div>
          <div className="rounded-xl border border-border/40 bg-background/40 px-4 py-2 flex flex-col justify-center">
            <div className="text-xs text-muted-foreground">Potential</div>
            <div className="text-sm font-bold tabular-nums text-foreground">
              {picks.size > 0 && Number.isFinite(bet)
                ? formatKoins(round2(bet * potentialTop))
                : '--'}
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={placeBet}
          disabled={playing || picks.size === 0}
          className="w-full h-14 rounded-xl bg-emerald-500 text-base font-bold text-emerald-950 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.6)] transition-all hover:bg-emerald-400 hover:shadow-[0_8px_36px_-6px_rgba(16,185,129,0.75)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {playing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Drawing…
            </>
          ) : (
            'Place Bet'
          )}
        </button>
      </div>
    </div>
  )
}
