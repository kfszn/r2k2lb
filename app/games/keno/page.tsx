'use client'

import { useState } from 'react'
import { mutate } from 'swr'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { GameLayout } from '@/components/games/game-layout'
import { cn } from '@/lib/utils'

type Risk = 'low' | 'medium' | 'high'
type GameState = 'idle' | 'result'

const MULTIPLIERS: Record<Risk, Record<number, Record<number, number>>> = {
  low: {
    1: { 1: 2 },
    2: { 2: 4, 1: 1 },
    3: { 3: 8, 2: 2, 1: 0.5 },
    4: { 4: 15, 3: 3, 2: 1 },
    5: { 5: 30, 4: 6, 3: 2, 2: 0.5 },
    6: { 6: 60, 5: 12, 4: 4, 3: 1 },
  },
  medium: {
    1: { 1: 2.5 },
    2: { 2: 6, 1: 0.5 },
    3: { 3: 15, 2: 2 },
    4: { 4: 40, 3: 4, 2: 1 },
    5: { 5: 100, 4: 10, 3: 2 },
    6: { 6: 300, 5: 20, 4: 5, 3: 2 },
  },
  high: {
    1: { 1: 3 },
    2: { 2: 10 },
    3: { 3: 30, 2: 1 },
    4: { 4: 100, 3: 5 },
    5: { 5: 300, 4: 15, 3: 2 },
    6: { 6: 1000, 5: 50, 4: 8, 3: 2 },
  },
}

export default function KenoPage() {
  const [wager, setWager] = useState('100')
  const [risk, setRisk] = useState<Risk>('medium')
  const [picks, setPicks] = useState<number[]>([])
  const [drawn, setDrawn] = useState<number[]>([])
  const [matched, setMatched] = useState(0)
  const [multiplier, setMultiplier] = useState(0)
  const [payout, setPayout] = useState(0)
  const [state, setState] = useState<GameState>('idle')
  const [loading, setLoading] = useState(false)

  const togglePick = (n: number) => {
    if (state === 'result') return
    if (picks.includes(n)) {
      setPicks(picks.filter(p => p !== n))
    } else if (picks.length < 6) {
      setPicks([...picks, n])
    }
  }

  const placeBet = async () => {
    if (picks.length === 0) return
    setLoading(true)
    const res = await fetch('/api/games/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game: 'keno',
        wager: parseInt(wager),
        gameData: { picks, risk },
      }),
    })
    const data = await res.json()
    if (data.error) { setLoading(false); return }

    setDrawn(data.result.drawn)
    setMatched(data.result.matched)
    setMultiplier(data.result.multiplier)
    setPayout(data.payout)
    setState('result')
    mutate('/api/games/profile')
    mutate('/api/games/history')
    setLoading(false)
  }

  const reset = () => {
    setState('idle')
    setPicks([])
    setDrawn([])
    setMatched(0)
    setMultiplier(0)
    setPayout(0)
  }

  const riskColors: Record<Risk, string> = {
    low: 'text-blue-400 border-blue-400/40 bg-blue-400/10',
    medium: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10',
    high: 'text-red-400 border-red-400/40 bg-red-400/10',
  }

  return (
    <GameLayout title="Keno">
      <Card className="border-border/40 bg-card/50">
        <CardContent className="p-6 space-y-6">
          {/* Risk selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-12">Risk</span>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as Risk[]).map(r => (
                <Button
                  key={r}
                  size="sm"
                  variant="outline"
                  disabled={state === 'result' || loading}
                  className={cn('capitalize h-8 text-xs transition-all', risk === r && riskColors[r])}
                  onClick={() => setRisk(r)}
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>

          {/* Pick counter */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Pick <span className="text-foreground font-semibold">{picks.length}</span>/6 numbers
            </p>
            {picks.length > 0 && state === 'idle' && (
              <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setPicks([])}>Clear</Button>
            )}
          </div>

          {/* Number grid */}
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
            {Array.from({ length: 30 }, (_, i) => i + 1).map(n => {
              const isPicked = picks.includes(n)
              const isDrawn = drawn.includes(n)
              const isMatch = isPicked && isDrawn

              return (
                <button
                  key={n}
                  onClick={() => togglePick(n)}
                  disabled={state === 'result' || loading}
                  className={cn(
                    'aspect-square rounded-lg text-sm font-semibold transition-all border-2 flex items-center justify-center',
                    state === 'idle' && !isPicked && 'border-border/40 bg-muted/30 hover:border-primary/40 hover:bg-primary/10',
                    state === 'idle' && isPicked && 'border-primary bg-primary/20 text-primary',
                    state === 'result' && !isPicked && !isDrawn && 'border-border/20 bg-muted/20 text-muted-foreground/50',
                    state === 'result' && isDrawn && !isPicked && 'border-orange-400/40 bg-orange-400/10 text-orange-400',
                    state === 'result' && isMatch && 'border-green-400 bg-green-400/20 text-green-400 scale-105',
                    state === 'result' && isPicked && !isDrawn && 'border-muted/40 bg-muted/20 text-muted-foreground/60',
                  )}
                >
                  {n}
                </button>
              )
            })}
          </div>

          {/* Result display */}
          {state === 'result' && (
            <div className="border border-border/40 rounded-xl p-4 text-center space-y-2 bg-muted/20">
              <p className="text-sm text-muted-foreground">
                Matched <span className="text-foreground font-bold text-lg">{matched}</span> of {picks.length} picks
              </p>
              {multiplier > 0 ? (
                <p className="text-2xl font-bold text-green-400">
                  {multiplier}x — +{payout.toLocaleString()} pts
                </p>
              ) : (
                <p className="text-2xl font-bold text-red-400">No win this round</p>
              )}
            </div>
          )}

          {/* Wager + action */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground w-16 shrink-0">Wager</label>
              <Input
                type="number" min={1}
                value={wager}
                onChange={e => setWager(e.target.value)}
                disabled={state === 'result' || loading}
                className="w-36"
              />
              <div className="flex gap-2">
                {[50, 100, 500, 1000].map(v => (
                  <Button key={v} size="sm" variant="outline" className="text-xs h-8 px-2"
                    disabled={state === 'result' || loading}
                    onClick={() => setWager(String(v))}>
                    {v}
                  </Button>
                ))}
              </div>
            </div>

            {state === 'idle' ? (
              <Button
                onClick={placeBet}
                disabled={loading || picks.length === 0 || !wager || parseInt(wager) < 1}
                className="w-full h-12 text-base font-semibold"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `Play — Pick ${picks.length} numbers`}
              </Button>
            ) : (
              <Button onClick={reset} className="w-full h-12 text-base font-semibold" variant="outline">
                Play Again
              </Button>
            )}
          </div>

          {/* Payout table */}
          {picks.length > 0 && (
            <div className="border-t border-border/30 pt-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Payout Table — {picks.length} picks, {risk} risk</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(MULTIPLIERS[risk][picks.length] ?? {})
                  .sort(([a], [b]) => parseInt(b) - parseInt(a))
                  .map(([hits, mult]) => (
                    <Badge
                      key={hits}
                      variant="outline"
                      className={cn('text-xs', parseInt(hits) === matched && state === 'result' && mult > 0 && 'border-green-400 text-green-400 bg-green-400/10')}
                    >
                      {hits} hit = {mult}x
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground border-t border-border/30 pt-4">
            <Badge variant="outline" className="text-xs">30 numbers, 10 drawn</Badge>
            <Badge variant="outline" className="text-xs">Pick 1–6</Badge>
            <Badge variant="outline" className="text-xs">Max payout 20,000 pts</Badge>
          </div>
        </CardContent>
      </Card>
    </GameLayout>
  )
}
