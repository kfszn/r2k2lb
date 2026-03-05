'use client'

import { useState, useRef, useCallback } from 'react'
import { mutate } from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { GameLayout } from '@/components/games/game-layout'
import { cn } from '@/lib/utils'

type Risk = 'low' | 'medium' | 'high'
type TileState = 'idle' | 'picked' | 'drawn' | 'hit' | 'miss'

const TOTAL_NUMBERS = 40
const COLS = 8

// Multiplier tables (picks → matches → multiplier)
const MULTIPLIERS: Record<Risk, Record<number, Record<number, number>>> = {
  low: {
    1: { 1: 3.8 },
    2: { 2: 5.2, 1: 1 },
    3: { 3: 10, 2: 2, 1: 0.5 },
    4: { 4: 20, 3: 4, 2: 1 },
    5: { 5: 40, 4: 7, 3: 1.5, 2: 0.5 },
    6: { 6: 80, 5: 12, 4: 3, 3: 0.5 },
  },
  medium: {
    1: { 1: 4.5 },
    2: { 2: 7, 1: 0.5 },
    3: { 3: 20, 2: 2.5 },
    4: { 4: 50, 3: 5, 2: 0.5 },
    5: { 5: 120, 4: 12, 3: 2 },
    6: { 6: 400, 5: 25, 4: 5, 3: 1 },
  },
  high: {
    1: { 1: 5 },
    2: { 2: 12 },
    3: { 3: 50, 2: 1 },
    4: { 4: 150, 3: 8 },
    5: { 5: 500, 4: 20, 3: 1.5 },
    6: { 6: 1500, 5: 75, 4: 10, 3: 1 },
  },
}

const CHIP_COLORS = [
  { value: 50,   label: '50',  bg: 'bg-red-600 border-red-400 hover:bg-red-500' },
  { value: 100,  label: '100', bg: 'bg-green-600 border-green-400 hover:bg-green-500' },
  { value: 500,  label: '500', bg: 'bg-slate-700 border-slate-500 hover:bg-slate-600' },
  { value: 1000, label: '1K',  bg: 'bg-purple-700 border-purple-400 hover:bg-purple-600' },
]

function getTileState(n: number, picks: number[], drawnSet: Set<number>, hasResult: boolean): TileState {
  if (!hasResult) return picks.includes(n) ? 'picked' : 'idle'
  const wasPicked = picks.includes(n)
  const wasDrawn = drawnSet.has(n)
  if (wasPicked && wasDrawn) return 'hit'
  if (wasPicked && !wasDrawn) return 'miss'
  if (wasDrawn) return 'drawn'
  return 'idle'
}

export default function KenoPage() {
  const [wager, setWager] = useState(100)
  const [risk, setRisk] = useState<Risk>('medium')
  const [picks, setPicks] = useState<number[]>([])
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([])
  const [revealedDrawn, setRevealedDrawn] = useState<Set<number>>(new Set())
  const [matched, setMatched] = useState(0)
  const [multiplier, setMultiplier] = useState(0)
  const [payout, setPayout] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasResult, setHasResult] = useState(false)
  const [loading, setLoading] = useState(false)
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const drawnSet = new Set(drawnNumbers)

  const togglePick = useCallback((n: number) => {
    if (isPlaying) return
    // Keep picks after a result — allow re-picking
    setPicks(prev => {
      if (prev.includes(n)) return prev.filter(p => p !== n)
      if (prev.length >= 6) return prev
      return [...prev, n]
    })
  }, [isPlaying])

  const placeBet = async () => {
    if (picks.length === 0 || loading || isPlaying) return
    setLoading(true)
    setHasResult(false)
    setRevealedDrawn(new Set())
    setDrawnNumbers([])

    const res = await fetch('/api/games/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: 'keno', wager, gameData: { picks, risk } }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.error) return

    const drawn: number[] = data.result.drawn
    setDrawnNumbers(drawn)
    setMatched(data.result.matched)
    setMultiplier(data.result.multiplier)
    setPayout(data.payout)
    setIsPlaying(true)

    // Animate drawn numbers one-by-one
    let i = 0
    const reveal = () => {
      if (i >= drawn.length) {
        setHasResult(true)
        setIsPlaying(false)
        mutate('/api/games/profile')
        mutate('/api/games/history')
        return
      }
      setRevealedDrawn(prev => new Set([...prev, drawn[i]]))
      i++
      animRef.current = setTimeout(reveal, 120)
    }
    animRef.current = setTimeout(reveal, 200)
  }

  const reset = () => {
    if (animRef.current) clearTimeout(animRef.current)
    setHasResult(false)
    setDrawnNumbers([])
    setRevealedDrawn(new Set())
    setMatched(0)
    setMultiplier(0)
    setPayout(0)
    setIsPlaying(false)
    // Keep picks so user can quickly replay
  }

  const riskColors: Record<Risk, string> = {
    low:    'bg-blue-600/20 border-blue-400 text-blue-300',
    medium: 'bg-yellow-600/20 border-yellow-400 text-yellow-300',
    high:   'bg-red-600/20 border-red-400 text-red-300',
  }

  // Active drawn set (during animation it's partial)
  const activeDrawnSet = isPlaying ? revealedDrawn : (hasResult ? drawnSet : new Set<number>())

  const payoutTable = picks.length > 0 ? MULTIPLIERS[risk][picks.length] : null

  return (
    <GameLayout title="Keno">
      <div className="flex flex-col lg:flex-row gap-0 min-h-[calc(100vh-120px)] bg-[#0f1923]">

        {/* ── Left sidebar ── */}
        <div className="w-full lg:w-64 xl:w-72 shrink-0 bg-[#0d1620] border-b lg:border-b-0 lg:border-r border-white/5 p-5 flex flex-col gap-5">

          {/* Risk */}
          <div>
            <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Risk</p>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as Risk[]).map(r => (
                <button
                  key={r}
                  disabled={isPlaying || loading}
                  onClick={() => setRisk(r)}
                  className={cn(
                    'flex-1 h-8 rounded-lg border text-xs font-semibold capitalize transition-all',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    risk === r ? riskColors[r] : 'border-white/10 text-white/40 hover:border-white/20'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Wager */}
          <div>
            <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Bet Amount</p>
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">pts</span>
                <Input
                  type="number" min={1}
                  value={wager}
                  onChange={e => setWager(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={isPlaying || loading}
                  className="pl-9 bg-black/20 border-white/10 text-white h-9 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {CHIP_COLORS.map(chip => (
                <button
                  key={chip.value}
                  disabled={isPlaying || loading}
                  onClick={() => setWager(chip.value)}
                  className={cn(
                    'flex-1 h-7 rounded-lg border text-xs font-bold text-white transition-all',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    chip.bg,
                    wager === chip.value && 'ring-1 ring-white/30'
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Picks counter */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/40">
              <span className="text-white/80 font-bold text-base">{picks.length}</span>/6 picks
            </p>
            {picks.length > 0 && !isPlaying && (
              <button
                onClick={() => setPicks([])}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Auto Pick */}
          <button
            disabled={isPlaying || loading}
            onClick={() => {
              const nums = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1)
              const shuffled = nums.sort(() => Math.random() - 0.5)
              setPicks(shuffled.slice(0, 6))
            }}
            className="w-full h-9 rounded-lg border border-white/10 text-white/50 text-sm hover:border-white/20 hover:text-white/70 transition-all disabled:opacity-40"
          >
            Auto Pick
          </button>

          {/* Place Bet / Play Again */}
          {!hasResult ? (
            <button
              onClick={placeBet}
              disabled={loading || isPlaying || picks.length === 0}
              className={cn(
                'w-full h-12 rounded-xl font-bold text-sm transition-all',
                'bg-[#39d353] hover:bg-[#4ae664] text-black',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'flex items-center justify-center'
              )}
            >
              {loading || isPlaying ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Place Bet'}
            </button>
          ) : (
            <button
              onClick={reset}
              className="w-full h-12 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all"
            >
              {multiplier > 0 ? `Bet Again (+${(payout - wager).toLocaleString()} pts)` : 'Bet Again'}
            </button>
          )}

          {/* Payout table */}
          {payoutTable && (
            <div>
              <p className="text-xs uppercase tracking-widest text-white/30 mb-2">Payouts ({picks.length} picks)</p>
              <div className="space-y-1">
                {Object.entries(payoutTable)
                  .sort(([a], [b]) => parseInt(b) - parseInt(a))
                  .map(([hits, mult]) => {
                    const isWinning = hasResult && parseInt(hits) === matched && mult > 0
                    return (
                      <div
                        key={hits}
                        className={cn(
                          'flex justify-between items-center px-2 py-1 rounded text-xs',
                          isWinning ? 'bg-[#39d353]/20 text-[#39d353]' : 'text-white/30'
                        )}
                      >
                        <span>{hits} match{parseInt(hits) !== 1 ? 'es' : ''}</span>
                        <span className="font-bold">{mult}x</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>

        {/* ── Main grid area ── */}
        <div className="flex-1 flex flex-col p-4 md:p-6 gap-4">

          {/* Result banner */}
          {hasResult && (
            <div className={cn(
              'rounded-xl border p-3 text-center flex items-center justify-center gap-4',
              multiplier > 0
                ? 'border-[#39d353]/30 bg-[#39d353]/10'
                : 'border-red-500/30 bg-red-500/10'
            )}>
              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest">
                  {matched}/{picks.length} matched
                </p>
                <p className={cn('text-2xl font-extrabold', multiplier > 0 ? 'text-[#39d353]' : 'text-red-400')}>
                  {multiplier > 0 ? `${multiplier}x — +${(payout - wager).toLocaleString()} pts` : 'No win'}
                </p>
              </div>
            </div>
          )}

          {/* Number grid — 40 numbers, 8 columns */}
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
            {Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1).map(n => {
              const isPicked = picks.includes(n)
              const isRevealedDrawn = activeDrawnSet.has(n)
              const isHit = isPicked && isRevealedDrawn
              const isMiss = isPicked && hasResult && !drawnSet.has(n)

              return (
                <button
                  key={n}
                  onClick={() => togglePick(n)}
                  disabled={isPlaying || loading}
                  className={cn(
                    'aspect-square rounded-xl text-sm font-bold transition-all duration-150',
                    'flex items-center justify-center border',
                    'disabled:cursor-default',
                    // base
                    !isPicked && !isRevealedDrawn && 'bg-[#1a2744] border-[#243050] text-white/60 hover:bg-[#1e2f55] hover:text-white',
                    // player picked (not yet result)
                    isPicked && !hasResult && !isRevealedDrawn && 'bg-[#39d353] border-[#39d353] text-black scale-105 shadow-lg shadow-[#39d353]/20',
                    // drawn but not picked (orange/red)
                    !isPicked && isRevealedDrawn && 'bg-[#1a2744] border-[#1a2744] text-red-400',
                    // hit = picked AND drawn = bright green
                    isHit && 'bg-[#39d353] border-[#39d353] text-black scale-105 shadow-lg shadow-[#39d353]/30',
                    // miss = picked but not drawn
                    isMiss && 'bg-[#1a2744] border-[#243050] text-white/30',
                  )}
                >
                  {n}
                </button>
              )
            })}
          </div>

          {/* Bottom multiplier strip */}
          {payoutTable && picks.length > 0 && (
            <div className="flex gap-1 overflow-x-auto pb-1">
              {Object.entries(payoutTable)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([hits, mult]) => (
                  <div
                    key={hits}
                    className={cn(
                      'flex flex-col items-center min-w-[3.5rem] px-2 py-1.5 rounded-lg border text-center shrink-0',
                      hasResult && parseInt(hits) === matched && mult > 0
                        ? 'bg-[#39d353] border-[#39d353] text-black'
                        : 'bg-[#1a2744] border-[#243050] text-white/50'
                    )}
                  >
                    <span className="text-xs font-bold">{mult}x</span>
                    <span className="text-[10px] opacity-60">{hits} hit</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </GameLayout>
  )
}
