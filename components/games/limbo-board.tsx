'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
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

export function LimboBoard() {
  const { data: balanceData } = useSWR(BALANCE_KEY, fetcher, { refreshInterval: 8000 })
  const balance = balanceData?.balance ?? 0

  const [betAmount, setBetAmount] = useState('10')
  const [target, setTarget] = useState('2.00')
  const [rolling, setRolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [last, setLast] = useState<LastResult | null>(null)
  const [display, setDisplay] = useState(1.0)

  const rafRef = useRef<number | null>(null)

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

  const animateTo = (value: number, win: boolean) => {
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
      refreshShell('limbo', data.balance)
      animateTo(data.rolled, data.win)
    } catch {
      setError('Network error')
      setRolling(false)
    }
  }

  const adjustBet = (fn: (n: number) => number) => {
    const next = round2(Math.max(1, fn(Number.isFinite(bet) ? bet : 0)))
    setBetAmount(String(next))
  }

  const resultColor = last ? (last.win ? 'text-emerald-400' : 'text-red-400') : 'text-foreground'
  const displayColor = rolling ? 'text-amber-400' : resultColor

  return (
    <div className="space-y-4">
      {/* Multiplier display */}
      <div className="relative rounded-2xl border border-border/40 bg-card/40 overflow-hidden">
        <div className="flex flex-col items-center justify-center py-16 md:py-24">
          <div
            className={`text-6xl md:text-8xl font-bold tabular-nums transition-colors duration-200 ${displayColor}`}
          >
            {display.toFixed(2)}
            <span className="text-3xl md:text-5xl">x</span>
          </div>
          {last && !rolling && (
            <div
              className={`mt-4 text-sm font-medium ${last.win ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {last.win
                ? `Win! +${formatKoins(last.profit)} R2K`
                : `Rolled below ${last.target.toFixed(2)}x`}
            </div>
          )}
          {!last && !rolling && (
            <div className="mt-4 text-sm text-muted-foreground">
              Beat your target multiplier to win
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-2xl border border-border/40 bg-card/40 p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bet amount */}
          <div className="space-y-1.5">
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
                className="tabular-nums"
              />
              <Button variant="outline" size="sm" disabled={rolling} onClick={() => adjustBet((n) => n / 2)}>
                ½
              </Button>
              <Button variant="outline" size="sm" disabled={rolling} onClick={() => adjustBet((n) => n * 2)}>
                2×
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={rolling}
                onClick={() => setBetAmount(String(round2(balance)))}
              >
                Max
              </Button>
            </div>
          </div>

          {/* Target multiplier */}
          <div className="space-y-1.5">
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
                className="tabular-nums"
              />
              {['2', '5', '10'].map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  disabled={rolling}
                  onClick={() => setTarget(Number(preset).toFixed(2))}
                >
                  {preset}×
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-muted/30 px-3 py-2">
            <div className="text-xs text-muted-foreground">Win Chance</div>
            <div className="text-sm font-semibold tabular-nums">{winChance.toFixed(2)}%</div>
          </div>
          <div className="rounded-lg bg-muted/30 px-3 py-2">
            <div className="text-xs text-muted-foreground">Payout on Win</div>
            <div className="text-sm font-semibold tabular-nums text-amber-400">
              {formatKoins(payoutOnWin)} R2K
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button onClick={placeBet} disabled={rolling} className="w-full h-12 text-base font-semibold gap-2">
          {rolling ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {rolling ? 'Rolling...' : 'Bet'}
        </Button>
      </div>
    </div>
  )
}
