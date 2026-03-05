'use client'

import { useState, useRef, useCallback } from 'react'
import { mutate } from 'swr'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { GameLayout } from '@/components/games/game-layout'
import { cn } from '@/lib/utils'

type Risk = 'low' | 'medium' | 'high'

const TOTAL = 40
const COLS = 8

// Client-side payout display (mirrors server KENO_MULTIPLIERS)
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

// Diamond gem SVG — shown on hit tiles matching the reference screenshot
function DiamondIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 drop-shadow-lg" fill="none">
      <polygon
        points="12,2 22,9 12,22 2,9"
        fill="#22c55e"
        stroke="#4ade80"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <polygon
        points="12,2 22,9 12,13"
        fill="#4ade80"
        opacity="0.6"
      />
      <polygon
        points="2,9 12,13 12,22"
        fill="#166534"
        opacity="0.5"
      />
      <line x1="2" y1="9" x2="22" y2="9" stroke="#4ade80" strokeWidth="0.8" opacity="0.5" />
      {/* sparkles */}
      <circle cx="19" cy="5" r="0.8" fill="#86efac" opacity="0.9" />
      <circle cx="5"  cy="6" r="0.6" fill="#86efac" opacity="0.7" />
      <circle cx="18" cy="14" r="0.5" fill="#86efac" opacity="0.6" />
    </svg>
  )
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
    if (isPlaying || loading) return
    setPicks(prev => {
      if (prev.includes(n)) return prev.filter(p => p !== n)
      if (prev.length >= 6) return prev
      return [...prev, n]
    })
  }, [isPlaying, loading])

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

    // Animate reveals one-by-one with 120ms delay
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
    // Keep picks intentionally for quick replay
  }

  // Partial drawn set during animation
  const activeDrawnSet = isPlaying ? revealedDrawn : (hasResult ? drawnSet : new Set<number>())
  const payoutTable = picks.length > 0 ? MULTIPLIERS[risk][picks.length] : null

  const riskBtnCls: Record<Risk, string> = {
    low:    'bg-blue-600/20 border-blue-500 text-blue-300',
    medium: 'bg-yellow-600/20 border-yellow-500 text-yellow-300',
    high:   'bg-red-600/20 border-red-500 text-red-300',
  }

  return (
    <GameLayout title="Keno">
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-120px)] bg-[#0d1117]">

        {/* ── Left Sidebar ── */}
        <div className="w-full lg:w-64 xl:w-72 shrink-0 bg-[#0d1117] border-b lg:border-b-0 lg:border-r border-white/5 p-5 flex flex-col gap-5">

          {/* Risk */}
          <div>
            <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Risk</p>
            <div className="flex gap-1.5">
              {(['low', 'medium', 'high'] as Risk[]).map(r => (
                <button
                  key={r}
                  disabled={isPlaying || loading}
                  onClick={() => setRisk(r)}
                  className={cn(
                    'flex-1 h-9 rounded-lg border text-xs font-semibold capitalize transition-all',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    risk === r ? riskBtnCls[r] : 'border-white/10 text-white/40 hover:border-white/20'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Bet Amount */}
          <div>
            <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Bet Amount</p>
            <div className="relative mb-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs">pts</span>
              <Input
                type="number" min={1}
                value={wager}
                onChange={e => setWager(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={isPlaying || loading}
                className="pl-9 bg-[#161b22] border-white/10 text-white h-10 text-sm"
              />
            </div>
            <div className="flex gap-1.5">
              {[
                { v: 50,   l: '50',  c: 'bg-red-600 border-red-400 hover:bg-red-500' },
                { v: 100,  l: '100', c: 'bg-green-600 border-green-400 hover:bg-green-500' },
                { v: 500,  l: '500', c: 'bg-slate-700 border-slate-500 hover:bg-slate-600' },
                { v: 1000, l: '1K',  c: 'bg-purple-700 border-purple-400 hover:bg-purple-600' },
              ].map(chip => (
                <button
                  key={chip.v}
                  disabled={isPlaying || loading}
                  onClick={() => setWager(chip.v)}
                  className={cn(
                    'flex-1 h-8 rounded-lg border text-xs font-bold text-white transition-all',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    chip.c,
                    wager === chip.v && 'ring-2 ring-white/30 scale-105'
                  )}
                >
                  {chip.l}
                </button>
              ))}
            </div>
          </div>

          {/* Pick counter */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/40">
              <span className="text-white font-bold text-base">{picks.length}</span>/6 picks
            </p>
            {picks.length > 0 && !isPlaying && (
              <button onClick={() => setPicks([])} className="text-xs text-white/30 hover:text-white/60 transition-colors">
                Clear
              </button>
            )}
          </div>

          {/* Auto Pick */}
          <button
            disabled={isPlaying || loading}
            onClick={() => {
              const nums = Array.from({ length: TOTAL }, (_, i) => i + 1).sort(() => Math.random() - 0.5)
              setPicks(nums.slice(0, 6))
            }}
            className="w-full h-9 rounded-lg border border-white/10 text-white/50 text-sm hover:border-blue-500/40 hover:text-white/70 transition-all disabled:opacity-40"
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
                'bg-blue-600 hover:bg-blue-500 text-white',
                'disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center'
              )}
            >
              {loading || isPlaying ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Place Bet'}
            </button>
          ) : (
            <button
              onClick={reset}
              className="w-full h-12 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all"
            >
              Bet Again
            </button>
          )}

          {/* Payout table */}
          {payoutTable && (
            <div>
              <p className="text-xs uppercase tracking-widest text-white/30 mb-2">Payouts — {picks.length} picks</p>
              <div className="space-y-1">
                {Object.entries(payoutTable).sort(([a], [b]) => parseInt(b) - parseInt(a)).map(([hits, mult]) => {
                  const isWin = hasResult && parseInt(hits) === matched && mult > 0
                  return (
                    <div key={hits} className={cn(
                      'flex justify-between items-center px-2.5 py-1 rounded-lg text-xs border',
                      isWin
                        ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                        : 'bg-white/3 border-transparent text-white/30'
                    )}>
                      <span>{hits} match{parseInt(hits) !== 1 ? 'es' : ''}</span>
                      <span className="font-bold">{mult}x</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Main area ── */}
        <div className="flex-1 flex flex-col p-4 md:p-6 gap-4">

          {/* Result banner */}
          {hasResult && (
            <div className={cn(
              'rounded-xl border p-3 text-center',
              multiplier > 0
                ? 'border-blue-500/30 bg-blue-600/10'
                : 'border-red-500/30 bg-red-500/10'
            )}>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-0.5">
                {matched}/{picks.length} matched
              </p>
              <p className={cn('text-2xl font-extrabold', multiplier > 0 ? 'text-blue-400' : 'text-red-400')}>
                {multiplier > 0 ? `${multiplier}x — +${(payout - wager).toLocaleString()} pts` : 'No win'}
              </p>
            </div>
          )}

          {/* Number grid: 40 numbers, 8 cols */}
          <div
            className="grid gap-2 flex-1"
            style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: TOTAL }, (_, i) => i + 1).map(n => {
              const isPicked = picks.includes(n)
              const isRevealedDrawn = activeDrawnSet.has(n)
              const isHit = isPicked && isRevealedDrawn
              const isMiss = isPicked && hasResult && !drawnSet.has(n)
              const isDrawnOnly = !isPicked && isRevealedDrawn

              return (
                <button
                  key={n}
                  onClick={() => togglePick(n)}
                  disabled={isPlaying || loading}
                  className={cn(
                    'aspect-square rounded-xl text-sm font-bold transition-all duration-150',
                    'flex flex-col items-center justify-center border relative overflow-hidden',
                    'disabled:cursor-default',
                    // base state
                    !isPicked && !isRevealedDrawn && 'bg-[#161b22] border-[#21262d] text-white/60 hover:bg-[#1c2128] hover:text-white hover:border-blue-500/30',
                    // picked, not yet drawn
                    isPicked && !hasResult && !isRevealedDrawn && 'bg-blue-600 border-blue-400 text-white scale-105 shadow-lg shadow-blue-600/30',
                    // drawn only (not picked) — dark tile, red number
                    isDrawnOnly && 'bg-[#161b22] border-[#21262d] text-red-400',
                    // HIT — picked and drawn — bright green + diamond gem
                    isHit && 'bg-[#22c55e] border-[#4ade80] text-black scale-[1.06] shadow-xl shadow-green-500/30 z-10',
                    // MISS — picked but not drawn — dimmed blue
                    isMiss && 'bg-blue-900/40 border-blue-800/40 text-blue-300/40',
                  )}
                >
                  {isHit ? (
                    <DiamondIcon />
                  ) : (
                    <span className={cn(isHit && 'sr-only')}>{n}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Multiplier strip */}
          {payoutTable && picks.length > 0 && (
            <div className="flex gap-1 overflow-x-auto pb-1">
              {Object.entries(payoutTable).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([hits, mult]) => {
                const isWin = hasResult && parseInt(hits) === matched && mult > 0
                return (
                  <div key={hits} className={cn(
                    'flex flex-col items-center min-w-[4rem] px-2 py-2 rounded-lg border text-center shrink-0',
                    isWin
                      ? 'bg-blue-600 border-blue-400 text-white'
                      : 'bg-[#161b22] border-[#21262d] text-white/40'
                  )}>
                    <span className="text-xs font-bold">{mult}x</span>
                    <span className="text-[10px] opacity-60">{hits} hit</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </GameLayout>
  )
}
