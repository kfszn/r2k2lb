'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { Loader2 } from 'lucide-react'
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

  const [mode, setMode] = useState<'manual' | 'auto'>('manual')
  const [betAmount, setBetAmount] = useState('10')
  const [risk, setRisk] = useState<KenoRisk>('medium')
  const [autoRounds, setAutoRounds] = useState('10')
  const [autoLeft, setAutoLeft] = useState(0)
  const [picks, setPicks] = useState<Set<number>>(new Set())
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [result, setResult] = useState<Result | null>(null)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const drawTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const autoStop = useRef(false)

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

  useEffect(() => () => clearTimers(), [])

  /** Run one round; resolves with the profit (or null on error). */
  const runRound = useCallback(
    (pickList: number[]): Promise<number | null> => {
      return new Promise((resolve) => {
        clearTimers()
        setResult(null)
        setRevealed(new Set())
        ;(async () => {
          try {
            const res = await fetch('/api/games/v2/keno', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ betAmount: round2(bet), picks: pickList, risk }),
            })
            const data = await res.json()
            if (!res.ok) {
              setError(data.error ?? 'Bet failed')
              resolve(null)
              return
            }
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
                  resolve(data.profit)
                }
              }, 60 * (i + 1))
              drawTimers.current.push(t)
            })
          } catch {
            setError('Network error')
            resolve(null)
          }
        })()
      })
    },
    [bet, risk],
  )

  const validate = (): number[] | null => {
    setError(null)
    if (picks.size === 0) {
      setError('Pick at least one number')
      return null
    }
    if (!Number.isFinite(bet) || bet < 1) {
      setError('Enter a valid bet amount')
      return null
    }
    if (bet > balance) {
      setError('Insufficient R2Koins balance')
      return null
    }
    return Array.from(picks)
  }

  const placeBet = useCallback(async () => {
    const pickList = validate()
    if (!pickList) return
    setPlaying(true)
    await runRound(pickList)
    setPlaying(false)
  }, [picks, bet, balance, risk, runRound])

  const startAuto = useCallback(async () => {
    const pickList = validate()
    if (!pickList) return
    const rounds = Math.max(1, Math.min(1000, Math.trunc(Number(autoRounds)) || 1))
    autoStop.current = false
    setPlaying(true)
    for (let i = 0; i < rounds; i++) {
      if (autoStop.current) break
      setAutoLeft(rounds - i)
      const profit = await runRound(pickList)
      if (profit === null) break
      await new Promise((r) => setTimeout(r, 350))
    }
    setAutoLeft(0)
    setPlaying(false)
  }, [picks, bet, balance, risk, autoRounds, runRound])

  const stopAuto = () => {
    autoStop.current = true
  }

  const adjustBet = (fn: (n: number) => number) => {
    const next = round2(Math.max(1, fn(Number.isFinite(bet) ? bet : 0)))
    setBetAmount(String(next))
  }

  // Multiplier strip for the current pick count.
  const table = picks.size > 0 ? KENO_MULTIPLIERS[risk][picks.size] : null
  const stripRows = table
    ? Object.entries(table)
        .map(([hits, mult]) => ({ hits: Number(hits), mult: mult as number }))
        .sort((a, b) => a.hits - b.hits)
    : []

  const potentialTop = picks.size > 0 ? kenoMultiplier(risk, picks.size, picks.size) : 0
  const canBet = picks.size > 0 && !playing

  return (
    <div
      className="relative rounded-2xl border border-border/50 overflow-hidden"
      style={{
        background:
          'radial-gradient(130% 130% at 50% 0%, oklch(0.2 0.03 260) 0%, oklch(0.14 0.02 260) 55%, oklch(0.11 0.02 260) 100%)',
      }}
    >
      <div className="flex flex-col lg:flex-row">
        {/* ── Control panel ─────────────────────────────────────────────── */}
        <div className="lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-border/40 bg-background/30 p-4 space-y-4">
          {/* Manual / Auto */}
          <div className="grid grid-cols-2 gap-1 rounded-full bg-background/60 border border-border/50 p-1">
            {(['manual', 'auto'] as const).map((m) => (
              <button
                key={m}
                disabled={playing}
                onClick={() => setMode(m)}
                className={cn(
                  'h-9 rounded-full text-sm font-semibold capitalize transition-colors disabled:opacity-50',
                  mode === m
                    ? 'bg-muted text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Bet amount */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Bet Amount</label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {Number.isFinite(bet) ? formatKoins(round2(bet)) : '0'} R2K
              </span>
            </div>
            <div className="flex rounded-lg border border-border/60 bg-background/60 overflow-hidden">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                min={1}
                step="0.01"
                disabled={playing}
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm font-semibold tabular-nums outline-none disabled:opacity-60"
              />
              <button
                disabled={playing}
                onClick={() => adjustBet((n) => n / 2)}
                className="px-3 text-sm font-semibold text-muted-foreground border-l border-border/60 transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                ½
              </button>
              <button
                disabled={playing}
                onClick={() => adjustBet((n) => n * 2)}
                className="px-3 text-sm font-semibold text-muted-foreground border-l border-border/60 transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                2×
              </button>
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
            <div className="relative">
              <select
                value={risk}
                disabled={playing}
                onChange={(e) => {
                  setRisk(e.target.value as KenoRisk)
                  setResult(null)
                  setRevealed(new Set())
                }}
                className="w-full appearance-none rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm font-semibold capitalize outline-none transition-colors hover:bg-muted/40 disabled:opacity-60"
              >
                {RISKS.map((r) => (
                  <option key={r} value={r} className="bg-card capitalize">
                    {r}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>

          {/* Auto rounds */}
          {mode === 'auto' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Number of Bets</label>
              <input
                type="number"
                value={autoRounds}
                onChange={(e) => setAutoRounds(e.target.value)}
                min={1}
                max={1000}
                disabled={playing}
                className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm font-semibold tabular-nums outline-none disabled:opacity-60"
              />
            </div>
          )}

          {/* Random / Clear */}
          <div className="space-y-2">
            <button
              disabled={playing}
              onClick={autoPick}
              className="w-full h-11 rounded-lg border border-border/60 bg-muted/40 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              Random Pick
            </button>
            <button
              disabled={playing || picks.size === 0}
              onClick={clear}
              className="w-full h-11 rounded-lg border border-border/60 bg-muted/40 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              Clear Table
            </button>
          </div>

          {/* Bet / Auto action */}
          {mode === 'manual' ? (
            <button
              onClick={placeBet}
              disabled={!canBet}
              className="w-full h-12 rounded-lg bg-emerald-500 text-base font-bold text-emerald-950 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.6)] transition-all hover:bg-emerald-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none flex items-center justify-center gap-2"
            >
              {playing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Bet'}
            </button>
          ) : playing ? (
            <button
              onClick={stopAuto}
              className="w-full h-12 rounded-lg bg-red-500 text-base font-bold text-red-950 transition-all hover:bg-red-400 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              Stop {autoLeft > 0 ? `(${autoLeft})` : ''}
            </button>
          ) : (
            <button
              onClick={startAuto}
              disabled={picks.size === 0}
              className="w-full h-12 rounded-lg bg-emerald-500 text-base font-bold text-emerald-950 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.6)] transition-all hover:bg-emerald-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none flex items-center justify-center"
            >
              Start Autobet
            </button>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        {/* ── Grid + hint ───────────────────────────────────────────────── */}
        <div className="flex-1 p-4 md:p-6 flex flex-col gap-4">
          <div className="grid grid-cols-8 gap-2 md:gap-3">
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
                    'aspect-square rounded-xl text-lg md:text-2xl font-bold tabular-nums flex items-center justify-center border-2 transition-[background-color,border-color,box-shadow,color] duration-300 ease-out select-none active:scale-90 disabled:cursor-default',
                    !picked &&
                      !isRevealed &&
                      'bg-[oklch(0.26_0.02_260)] border-transparent text-foreground/90 hover:bg-[oklch(0.31_0.02_260)] hover:-translate-y-0.5',
                    picked &&
                      !isHit &&
                      !isMiss &&
                      'animate-tile-pop bg-amber-500 border-amber-300 text-amber-950 shadow-[0_0_26px_-4px_rgba(245,158,11,0.85)] z-10',
                    isHit &&
                      'bg-emerald-500 border-emerald-300 text-emerald-950 shadow-[0_0_28px_-2px_rgba(16,185,129,0.9)] scale-105 z-20',
                    isMiss && 'bg-amber-500/10 border-amber-500/25 text-amber-500/40',
                    drawnOnly && 'bg-[oklch(0.22_0.02_260)] border-border/40 text-muted-foreground/60',
                  )}
                >
                  {n}
                </button>
              )
            })}
          </div>

          {/* Multiplier strip (appears once numbers are picked) */}
          {stripRows.length > 0 && (
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${stripRows.length}, minmax(0, 1fr))` }}>
              {stripRows.map(({ hits, mult }) => {
                const isWin = result != null && result.matched === hits && mult > 0
                return (
                  <div
                    key={hits}
                    className={cn(
                      'rounded-lg border px-1 py-2 text-center transition-all',
                      isWin
                        ? 'border-emerald-400/60 bg-emerald-500/15'
                        : 'border-border/40 bg-background/40',
                    )}
                  >
                    <div
                      className={cn(
                        'text-sm font-bold tabular-nums',
                        isWin ? 'text-emerald-300' : 'text-foreground',
                      )}
                    >
                      {mult}x
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {hits} hit{hits !== 1 ? 's' : ''}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Hint / result bar */}
          <div className="rounded-xl bg-background/50 border border-border/40 py-4 px-4 text-center">
            {result ? (
              <span
                className={cn(
                  'text-sm font-semibold',
                  result.multiplier > 0 ? 'text-emerald-400' : 'text-muted-foreground',
                )}
              >
                {result.matched} of {result.picks.length} hit ·{' '}
                {result.multiplier > 0
                  ? `${result.multiplier}x · +${formatKoins(result.profit)} R2K`
                  : `No win · ${formatKoins(result.profit)} R2K`}
              </span>
            ) : playing ? (
              <span className="text-sm text-amber-400 inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Drawing…
              </span>
            ) : picks.size > 0 ? (
              <span className="text-sm text-muted-foreground">
                {picks.size} selected · top win {potentialTop}x
                {Number.isFinite(bet) ? ` · ${formatKoins(round2(bet * potentialTop))} R2K` : ''}
              </span>
            ) : (
              <span className="text-sm font-medium text-muted-foreground">
                Select 1 - {KENO_MAX_PICKS} numbers to play
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
