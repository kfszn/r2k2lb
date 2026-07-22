'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { BALANCE_KEY, refreshShell, formatKoins } from '@/components/games/game-shell'
import {
  PLINKO_ROWS_OPTIONS,
  PLINKO_RISKS,
  plinkoBuckets,
  plinkoBucketTier,
  type PlinkoRisk,
  type PlinkoRows,
} from '@/lib/games/plinko-config'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())
const round2 = (n: number) => Math.round(n * 100) / 100

// Board geometry (SVG user units).
const VB_W = 800
const PEG_GAP_X = 34
const PEG_GAP_Y = 34
const TOP_PAD = 40
const BALL_R = 7
const PEG_R = 3.5

interface Ball {
  id: number
  start: number
  duration: number
  slot: number
  xs: number[] // x offset (in gap units) at each row boundary 0..rows
  landed: boolean
}

interface HistDot {
  id: number
  multiplier: number
}

const easeInQuad = (t: number) => t * t

/** Build a per-row left/right walk that ends at `slot` right-moves. */
function decisionsForSlot(rows: number, slot: number): number[] {
  // xs[0..rows]; each step +/-0.5. slot = number of rights.
  const rights = slot
  const seq: boolean[] = []
  let placedRights = 0
  for (let r = 0; r < rows; r++) {
    const remaining = rows - r
    const need = rights - placedRights
    let goRight: boolean
    if (need <= 0) goRight = false
    else if (need >= remaining) goRight = true
    else goRight = Math.random() < need / remaining
    if (goRight) placedRights++
    seq.push(goRight)
  }
  const xs = [0]
  let x = 0
  for (const right of seq) {
    x += right ? 0.5 : -0.5
    xs.push(x)
  }
  return xs
}

const tierClass: Record<ReturnType<typeof plinkoBucketTier>, string> = {
  cold: 'bg-muted/40 text-muted-foreground border-border/40',
  low: 'bg-muted/60 text-muted-foreground border-border/50',
  mid: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  hot: 'bg-amber-500/30 text-amber-100 border-amber-400/50',
  max: 'bg-emerald-500/25 text-emerald-200 border-emerald-400/60',
}

export function PlinkoBoard() {
  const { data: balanceData } = useSWR(BALANCE_KEY, fetcher, { refreshInterval: 8000 })
  const balance = balanceData?.balance ?? 0

  const [betAmount, setBetAmount] = useState('10')
  const [rows, setRows] = useState<PlinkoRows>(12)
  const [risk, setRisk] = useState<PlinkoRisk>('medium')
  const [error, setError] = useState<string | null>(null)
  const [dropping, setDropping] = useState(false)
  const [flash, setFlash] = useState<{ slot: number; at: number } | null>(null)
  const [history, setHistory] = useState<HistDot[]>([])
  const [, forceTick] = useState(0)

  const ballsRef = useRef<Ball[]>([])
  const rafRef = useRef<number | null>(null)
  const ballId = useRef(0)
  const dotId = useRef(0)

  const buckets = plinkoBuckets(rows, risk)
  const bucketCount = rows + 1
  const boardHeight = TOP_PAD + rows * PEG_GAP_Y + 20

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const centerX = VB_W / 2
  const pegX = (offset: number) => centerX + offset * PEG_GAP_X
  const rowY = (r: number) => TOP_PAD + r * PEG_GAP_Y

  const loop = useCallback(() => {
    const now = performance.now()
    let active = false
    for (const ball of ballsRef.current) {
      if (!ball.landed) {
        const p = Math.min((now - ball.start) / ball.duration, 1)
        if (p >= 1) ball.landed = true
        else active = true
      }
    }
    // prune balls that landed a while ago
    ballsRef.current = ballsRef.current.filter((b) => !b.landed || now - (b.start + b.duration) < 400)
    forceTick((t) => t + 1)
    if (active || ballsRef.current.length > 0) {
      rafRef.current = requestAnimationFrame(loop)
    } else {
      rafRef.current = null
    }
  }, [])

  const startLoop = () => {
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(loop)
  }

  const placeBet = useCallback(async () => {
    setError(null)
    const bet = Number(betAmount)
    if (!Number.isFinite(bet) || bet < 1) {
      setError('Enter a valid bet amount')
      return
    }
    if (bet > balance) {
      setError('Insufficient R2Koins balance')
      return
    }

    setDropping(true)
    try {
      const res = await fetch('/api/games/v2/plinko', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount: round2(bet), rows, risk }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Bet failed')
        setDropping(false)
        return
      }

      const slot: number = data.slot
      const duration = 250 + rows * 75
      const ball: Ball = {
        id: ballId.current++,
        start: performance.now(),
        duration,
        slot,
        xs: decisionsForSlot(rows, slot),
        landed: false,
      }
      ballsRef.current = [...ballsRef.current, ball]
      startLoop()

      // Land handling: flash bucket + record + refresh shell.
      window.setTimeout(() => {
        setFlash({ slot, at: performance.now() })
        setHistory((prev) => [{ id: dotId.current++, multiplier: data.multiplier }, ...prev].slice(0, 18))
        refreshShell('plinko', data.balance)
      }, duration)
    } catch {
      setError('Network error')
    } finally {
      // Allow rapid re-drops; re-enable button shortly after firing.
      window.setTimeout(() => setDropping(false), 180)
    }
  }, [betAmount, balance, rows, risk])

  const adjustBet = (fn: (n: number) => number) => {
    const bet = Number(betAmount)
    const next = round2(Math.max(1, fn(Number.isFinite(bet) ? bet : 0)))
    setBetAmount(String(next))
  }

  // Ball render positions for current frame.
  const now = performance.now()
  const renderedBalls = ballsRef.current.map((ball) => {
    const p = Math.min((now - ball.start) / ball.duration, 1)
    const rowFloat = p * rows
    const idx = Math.min(Math.floor(rowFloat), rows)
    const frac = rowFloat - idx
    const x0 = ball.xs[idx] ?? ball.xs[ball.xs.length - 1]
    const x1 = ball.xs[Math.min(idx + 1, rows)] ?? x0
    const xOff = x0 + (x1 - x0) * frac
    const y = TOP_PAD + easeInQuad(p) * (rows * PEG_GAP_Y)
    return { id: ball.id, cx: pegX(xOff), cy: Math.min(y, rows * PEG_GAP_Y + TOP_PAD), done: p >= 1 }
  })

  const flashActive = flash && now - flash.at < 350

  return (
    <div className="space-y-4">
      {/* Recent multipliers strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {history.length === 0 ? (
          <span className="text-xs text-muted-foreground/60 py-1">Recent drops will appear here</span>
        ) : (
          history.map((h) => {
            const tier = plinkoBucketTier(h.multiplier)
            return (
              <span
                key={h.id}
                className={cn(
                  'shrink-0 rounded-md px-2 py-1 text-xs font-semibold tabular-nums border',
                  tierClass[tier],
                )}
              >
                {h.multiplier}x
              </span>
            )
          })
        )}
      </div>

      {/* Game stage */}
      <div
        className="relative rounded-2xl border border-border/50 overflow-hidden p-3 md:p-5"
        style={{
          background:
            'radial-gradient(120% 120% at 50% 0%, oklch(0.2 0.03 260) 0%, oklch(0.13 0.02 260) 55%, oklch(0.11 0.02 260) 100%)',
        }}
      >
        <svg
          viewBox={`0 0 ${VB_W} ${boardHeight}`}
          className="w-full"
          style={{ maxHeight: '58vh' }}
          role="img"
          aria-label="Plinko board"
        >
          {/* Pegs: row r has r+2 pegs, centered. */}
          {Array.from({ length: rows }, (_, r) => {
            const count = r + 2
            const startOff = -(count - 1) / 2
            return Array.from({ length: count }, (_, k) => (
              <circle
                key={`${r}-${k}`}
                cx={pegX(startOff + k)}
                cy={rowY(r) + PEG_GAP_Y}
                r={PEG_R}
                className="fill-muted-foreground/40"
              />
            ))
          })}

          {/* Balls */}
          {renderedBalls.map((b) => (
            <circle
              key={b.id}
              cx={b.cx}
              cy={b.cy}
              r={BALL_R}
              className="fill-amber-400"
              style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.7))' }}
            />
          ))}
        </svg>

        {/* Buckets */}
        <div
          className="grid gap-1 mt-1"
          style={{ gridTemplateColumns: `repeat(${bucketCount}, minmax(0, 1fr))` }}
        >
          {buckets.map((mult, i) => {
            const tier = plinkoBucketTier(mult)
            const lit = flashActive && flash!.slot === i
            return (
              <div
                key={i}
                className={cn(
                  'rounded-md border text-center py-1.5 text-[10px] md:text-xs font-bold tabular-nums transition-all duration-150',
                  tierClass[tier],
                  lit && 'scale-110 -translate-y-1 ring-2 ring-amber-300 shadow-[0_0_16px_-2px_rgba(245,158,11,0.8)] z-10',
                )}
              >
                {mult}x
              </div>
            )
          })}
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
                className="tabular-nums font-semibold"
              />
              {[
                { label: '½', fn: (n: number) => n / 2 },
                { label: '2×', fn: (n: number) => n * 2 },
              ].map((b) => (
                <button
                  key={b.label}
                  onClick={() => adjustBet(b.fn)}
                  className="shrink-0 rounded-md border border-border/60 bg-muted/40 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {b.label}
                </button>
              ))}
              <button
                onClick={() => setBetAmount(String(round2(balance)))}
                className="shrink-0 rounded-md border border-border/60 bg-muted/40 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
              {PLINKO_RISKS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRisk(r)}
                  className={cn(
                    'flex-1 h-10 rounded-md border text-sm font-semibold capitalize transition-colors',
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

        {/* Rows */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Rows
          </label>
          <div className="flex gap-2">
            {PLINKO_ROWS_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRows(r)}
                className={cn(
                  'flex-1 h-10 rounded-md border text-sm font-semibold tabular-nums transition-colors',
                  rows === r
                    ? 'border-amber-500/50 bg-amber-500/15 text-amber-400'
                    : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={placeBet}
          disabled={dropping}
          className="w-full h-14 rounded-xl bg-emerald-500 text-base font-bold text-emerald-950 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.6)] transition-all hover:bg-emerald-400 hover:shadow-[0_8px_36px_-6px_rgba(16,185,129,0.75)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {dropping ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Dropping…
            </>
          ) : (
            'Drop Ball'
          )}
        </button>
      </div>
    </div>
  )
}
