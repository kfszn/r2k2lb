'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { Input } from '@/components/ui/input'
import { Loader2, Rocket } from 'lucide-react'
import { BALANCE_KEY, refreshShell, formatKoins } from '@/components/games/game-shell'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const round2 = (n: number) => Math.round(n * 100) / 100
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

interface LastResult {
  rolled: number
  target: number
  win: boolean
  payout: number
  profit: number
}

interface HistoryPill {
  id: number
  rolled: number
  win: boolean
}

export function LimboBoard() {
  const { data: balanceData } = useSWR(BALANCE_KEY, fetcher, { refreshInterval: 8000 })
  const balance = balanceData?.balance ?? 0

  const [betAmount, setBetAmount] = useState('10')
  const [target, setTarget] = useState('2.00')
  const [rolling, setRolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [last, setLast] = useState<LastResult | null>(null)
  const [display, setDisplay] = useState(1.0)
  const [history, setHistory] = useState<HistoryPill[]>([])

  const rafRef = useRef<number | null>(null)
  const pillId = useRef(0)

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const bet = Number(betAmount)
  const tgt = Number(target)
  const validTarget = Number.isFinite(tgt) && tgt >= 1.01
  const winChance = validTarget ? 99 / tgt : 0
  const payoutOnWin = validTarget && Number.isFinite(bet) ? round2(bet * tgt) : 0

  const animateTo = (value: number) => {
    const start = performance.now()
    const duration = 900
    const from = 1.0
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = easeOutCubic(p)
      setDisplay(from + (value - from) * eased)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        setDisplay(value)
        setRolling(false)
      }
    }
    rafRef.current = requestAnimationFrame(step)
  }

  const placeBet = async () => {
    setError(null)
    if (!Number.isFinite(bet) || bet < 1) {
      setError('Enter a valid bet amount')
      return
    }
    if (bet > balance) {
      setError('Insufficient R2Koins balance')
      return
    }
    if (!validTarget) {
      setError('Target must be at least 1.01x')
      return
    }

    setRolling(true)
    setLast(null)
    setDisplay(1.0)
    try {
      const res = await fetch('/api/games/v2/limbo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount: round2(bet), target: round2(tgt) }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Bet failed')
        setRolling(false)
        return
      }
      setLast({
        rolled: data.rolled,
        target: data.target,
        win: data.win,
        payout: data.payout,
        profit: data.profit,
      })
      setHistory((prev) =>
        [{ id: pillId.current++, rolled: data.rolled, win: data.win }, ...prev].slice(0, 14),
      )
      refreshShell('limbo', data.balance)
      animateTo(data.rolled)
    } catch {
      setError('Network error')
      setRolling(false)
    }
  }

  const adjustBet = (fn: (n: number) => number) => {
    const next = round2(Math.max(1, fn(Number.isFinite(bet) ? bet : 0)))
    setBetAmount(String(next))
  }

  const state: 'idle' | 'rolling' | 'win' | 'lose' = rolling
    ? 'rolling'
    : last
      ? last.win
        ? 'win'
        : 'lose'
      : 'idle'

  const stageGlow =
    state === 'win'
      ? 'shadow-[0_0_120px_-20px_rgba(16,185,129,0.55)]'
      : state === 'lose'
        ? 'shadow-[0_0_120px_-30px_rgba(248,113,113,0.4)]'
        : 'shadow-[0_0_120px_-40px_rgba(245,158,11,0.35)]'

  const numberColor =
    state === 'rolling'
      ? 'text-amber-300'
      : state === 'win'
        ? 'text-emerald-400'
        : state === 'lose'
          ? 'text-red-400'
          : 'text-foreground'

  return (
    <div className="space-y-4">
      {/* Recent multipliers strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {history.length === 0 ? (
          <span className="text-xs text-muted-foreground/60 py-1">Your recent multipliers will appear here</span>
        ) : (
          history.map((h) => (
            <span
              key={h.id}
              className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold tabular-nums border ${
                h.win
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-muted/40 border-border/40 text-muted-foreground'
              }`}
            >
              {h.rolled.toFixed(2)}x
            </span>
          ))
        )}
      </div>

      {/* Game stage */}
      <div
        className={`relative rounded-2xl border border-border/50 overflow-hidden transition-shadow duration-500 ${stageGlow}`}
        style={{
          background:
            'radial-gradient(120% 120% at 50% 15%, oklch(0.2 0.03 260) 0%, oklch(0.13 0.02 260) 55%, oklch(0.11 0.02 260) 100%)',
        }}
      >
        {/* grid backdrop */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(to right, oklch(0.4 0.03 260 / 0.5) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.4 0.03 260 / 0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(circle at 50% 40%, black 40%, transparent 80%)',
          }}
        />

        <div className="relative flex flex-col items-center justify-center py-16 md:py-24">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
            <Rocket className={`h-3.5 w-3.5 ${state === 'rolling' ? 'text-amber-400 animate-pulse' : 'text-muted-foreground'}`} />
            {state === 'rolling' ? 'Rolling' : 'Multiplier'}
          </div>

          <div
            className={`text-7xl md:text-9xl font-bold tabular-nums leading-none transition-colors duration-200 ${numberColor}`}
            style={
              state === 'win'
                ? { textShadow: '0 0 40px rgba(16,185,129,0.45)' }
                : state === 'rolling'
                  ? { textShadow: '0 0 40px rgba(245,158,11,0.4)' }
                  : undefined
            }
          >
            {display.toFixed(2)}
            <span className="text-4xl md:text-6xl align-top text-muted-foreground">x</span>
          </div>

          {/* target reference */}
          <div className="mt-6 flex items-center gap-2 rounded-full border border-border/50 bg-background/40 px-4 py-1.5 text-sm backdrop-blur-sm">
            <span className="text-muted-foreground">Target</span>
            <span className="font-semibold tabular-nums text-amber-400">{validTarget ? tgt.toFixed(2) : '--'}x</span>
          </div>

          <div className="h-6 mt-4">
            {state === 'win' && (
              <div className="text-sm font-semibold text-emerald-400 animate-fade-in">
                Win! +{formatKoins(last!.profit)} R2K
              </div>
            )}
            {state === 'lose' && (
              <div className="text-sm font-medium text-red-400 animate-fade-in">
                Missed {last!.target.toFixed(2)}x target
              </div>
            )}
            {state === 'idle' && (
              <div className="text-sm text-muted-foreground">Beat your target multiplier to win</div>
            )}
          </div>
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
                disabled={rolling}
                className="tabular-nums font-semibold"
              />
              {[
                { label: '½', fn: (n: number) => n / 2 },
                { label: '2×', fn: (n: number) => n * 2 },
              ].map((b) => (
                <button
                  key={b.label}
                  disabled={rolling}
                  onClick={() => adjustBet(b.fn)}
                  className="shrink-0 rounded-md border border-border/60 bg-muted/40 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                >
                  {b.label}
                </button>
              ))}
              <button
                disabled={rolling}
                onClick={() => setBetAmount(String(round2(balance)))}
                className="shrink-0 rounded-md border border-border/60 bg-muted/40 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                Max
              </button>
            </div>
          </div>

          {/* Target multiplier */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Target Multiplier
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                min={1.01}
                step="0.01"
                disabled={rolling}
                className="tabular-nums font-semibold"
              />
              {['2', '5', '10'].map((preset) => (
                <button
                  key={preset}
                  disabled={rolling}
                  onClick={() => setTarget(Number(preset).toFixed(2))}
                  className={`shrink-0 rounded-md border px-3 text-sm font-semibold transition-colors disabled:opacity-40 ${
                    target === Number(preset).toFixed(2)
                      ? 'border-amber-500/50 bg-amber-500/15 text-amber-400'
                      : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {preset}×
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/40 bg-background/40 px-4 py-3">
            <div className="text-xs text-muted-foreground mb-0.5">Win Chance</div>
            <div className="text-lg font-bold tabular-nums">{winChance.toFixed(2)}%</div>
          </div>
          <div className="rounded-xl border border-border/40 bg-background/40 px-4 py-3">
            <div className="text-xs text-muted-foreground mb-0.5">Payout on Win</div>
            <div className="text-lg font-bold tabular-nums text-amber-400">
              {formatKoins(payoutOnWin)} <span className="text-sm text-muted-foreground">R2K</span>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={placeBet}
          disabled={rolling}
          className="w-full h-14 rounded-xl bg-emerald-500 text-base font-bold text-emerald-950 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.6)] transition-all hover:bg-emerald-400 hover:shadow-[0_8px_36px_-6px_rgba(16,185,129,0.75)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {rolling ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Rolling...
            </>
          ) : (
            'Place Bet'
          )}
        </button>
      </div>
    </div>
  )
}
