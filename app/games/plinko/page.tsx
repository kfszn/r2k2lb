'use client'

import { useState, useEffect, useRef } from 'react'
import { mutate } from 'swr'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { GameLayout } from '@/components/games/game-layout'
import { cn } from '@/lib/utils'

type Risk = 'low' | 'medium' | 'high'

const ROWS = 16

const MULTIPLIERS: Record<Risk, number[]> = {
  low:    [0.5, 0.7, 1.0, 1.2, 1.5, 2.0, 3.0, 5.0, 3.0, 2.0, 1.5, 1.2, 1.0, 0.7, 0.5, 0.3, 0.2],
  medium: [0.3, 0.5, 0.7, 1.0, 1.5, 2.0, 5.0, 8.0, 5.0, 2.0, 1.5, 1.0, 0.7, 0.5, 0.3, 0.2, 0.1],
  high:   [0.2, 0.3, 0.5, 0.7, 1.0, 2.0, 5.0, 10.0, 25.0, 10.0, 5.0, 2.0, 1.0, 0.7, 0.5, 0.3, 0.2],
}

function multColor(mult: number) {
  if (mult >= 10) return 'bg-yellow-500 text-yellow-950 border-yellow-400'
  if (mult >= 5) return 'bg-orange-500 text-orange-950 border-orange-400'
  if (mult >= 2) return 'bg-green-500 text-green-950 border-green-400'
  if (mult >= 1) return 'bg-blue-500 text-blue-950 border-blue-400'
  return 'bg-muted text-muted-foreground border-border/40'
}

// Simulate plinko path client-side for animation (using result slot)
function buildPath(targetSlot: number): ('L' | 'R')[] {
  // Deterministic path that ends at targetSlot using a simple distribution
  const path: ('L' | 'R')[] = []
  let pos = 0
  for (let row = 0; row < ROWS; row++) {
    const remaining = ROWS - row
    const needed = targetSlot - pos
    // Force right if we must, force left if we must, else alternate
    if (needed >= remaining) {
      path.push('R'); pos++
    } else if (needed <= 0) {
      path.push('L')
    } else {
      // distribute
      path.push(row % 2 === 0 ? (needed > remaining / 2 ? 'R' : 'L') : (needed > remaining / 2 ? 'R' : 'L'))
      if (path[path.length - 1] === 'R') pos++
    }
  }
  return path
}

export default function PlinkoPage() {
  const [wager, setWager] = useState('100')
  const [risk, setRisk] = useState<Risk>('medium')
  const [loading, setLoading] = useState(false)
  const [ballPath, setBallPath] = useState<('L' | 'R')[] | null>(null)
  const [animRow, setAnimRow] = useState(-1)
  const [finalSlot, setFinalSlot] = useState<number | null>(null)
  const [payout, setPayout] = useState<number | null>(null)
  const [multiplier, setMultiplier] = useState<number | null>(null)
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const placeBet = async () => {
    if (loading || animRow >= 0) return
    setLoading(true)
    setBallPath(null)
    setFinalSlot(null)
    setPayout(null)
    setMultiplier(null)
    setAnimRow(-1)

    const res = await fetch('/api/games/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: 'plinko', wager: parseInt(wager), gameData: { risk } }),
    })
    const data = await res.json()
    if (data.error) { setLoading(false); return }

    const slot = data.result.slot as number
    const path = buildPath(slot)
    setBallPath(path)
    setLoading(false)

    // Animate
    let row = 0
    const step = () => {
      setAnimRow(row)
      row++
      if (row <= ROWS) {
        animRef.current = setTimeout(step, 60)
      } else {
        setFinalSlot(slot)
        setPayout(data.payout)
        setMultiplier(data.result.multiplier)
        mutate('/api/games/profile')
        mutate('/api/games/history')
      }
    }
    animRef.current = setTimeout(step, 60)
  }

  useEffect(() => () => { if (animRef.current) clearTimeout(animRef.current) }, [])

  const mults = MULTIPLIERS[risk]
  const riskColors: Record<Risk, string> = {
    low: 'text-blue-400 border-blue-400/40 bg-blue-400/10',
    medium: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10',
    high: 'text-red-400 border-red-400/40 bg-red-400/10',
  }

  // Calculate ball column position per row for visual
  const ballCols: number[] = []
  if (ballPath) {
    let col = 0
    for (const dir of ballPath) {
      ballCols.push(col)
      if (dir === 'R') col++
    }
    ballCols.push(col) // final
  }

  const isAnimating = animRow >= 0 && finalSlot === null

  return (
    <GameLayout title="Plinko">
      <Card className="border-border/40 bg-card/50">
        <CardContent className="p-6 space-y-6">
          {/* Risk */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-12">Risk</span>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as Risk[]).map(r => (
                <Button key={r} size="sm" variant="outline"
                  disabled={isAnimating || loading}
                  className={cn('capitalize h-8 text-xs transition-all', risk === r && riskColors[r])}
                  onClick={() => { setRisk(r); setFinalSlot(null); setPayout(null); setMultiplier(null) }}>
                  {r}
                </Button>
              ))}
            </div>
          </div>

          {/* Plinko board */}
          <div className="bg-muted/20 border border-border/30 rounded-xl p-4 overflow-x-auto">
            <div className="relative min-w-[320px]">
              {/* Pegs */}
              {Array.from({ length: ROWS }, (_, row) => {
                const pegsInRow = row + 2
                return (
                  <div key={row} className="flex justify-center gap-0" style={{ marginBottom: '6px' }}>
                    {Array.from({ length: pegsInRow }, (_, col) => {
                      const isBall = ballPath !== null && animRow === row && ballCols[row] === col
                      return (
                        <div key={col} style={{ width: `${Math.floor(320 / (ROWS + 2))}px` }} className="flex justify-center">
                          <div className={cn(
                            'w-3 h-3 rounded-full transition-all duration-100',
                            isBall ? 'bg-primary scale-150 shadow-lg shadow-primary/50' : 'bg-border/60'
                          )} />
                        </div>
                      )
                    })}
                  </div>
                )
              })}

              {/* Slots */}
              <div className="flex justify-center gap-1 mt-3">
                {mults.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex-1 rounded text-center py-1 text-xs font-bold border transition-all',
                      multColor(m),
                      finalSlot === i && 'ring-2 ring-white scale-110'
                    )}
                    style={{ minWidth: 0 }}
                  >
                    {m}x
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Result */}
          {finalSlot !== null && (
            <div className="border border-border/40 rounded-xl p-4 text-center bg-muted/20">
              <p className="text-sm text-muted-foreground mb-1">
                Slot {finalSlot + 1} — <span className="text-foreground font-semibold">{multiplier}x multiplier</span>
              </p>
              {(payout ?? 0) > (parseInt(wager) || 0) ? (
                <p className="text-2xl font-bold text-green-400">+{((payout ?? 0) - parseInt(wager)).toLocaleString()} pts</p>
              ) : (payout ?? 0) === parseInt(wager) ? (
                <p className="text-2xl font-bold text-blue-400">Break even</p>
              ) : (
                <p className="text-2xl font-bold text-red-400">-{(parseInt(wager) - (payout ?? 0)).toLocaleString()} pts</p>
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
                disabled={isAnimating || loading}
                className="w-36"
              />
              <div className="flex gap-2">
                {[50, 100, 500, 1000].map(v => (
                  <Button key={v} size="sm" variant="outline" className="text-xs h-8 px-2"
                    disabled={isAnimating || loading}
                    onClick={() => setWager(String(v))}>
                    {v}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              onClick={placeBet}
              disabled={loading || isAnimating || !wager || parseInt(wager) < 1}
              className="w-full h-12 text-base font-semibold"
            >
              {loading || isAnimating ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Drop Ball'}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground border-t border-border/30 pt-4">
            <Badge variant="outline" className="text-xs">16 rows</Badge>
            <Badge variant="outline" className="text-xs">17 slots</Badge>
            <Badge variant="outline" className="text-xs">Max payout 20,000 pts</Badge>
          </div>
        </CardContent>
      </Card>
    </GameLayout>
  )
}
