'use client'

import { useState, useRef, useCallback } from 'react'
import { mutate } from 'swr'
import { Input } from '@/components/ui/input'
import { Loader2, ChevronDown } from 'lucide-react'
import { GameLayout } from '@/components/games/game-layout'
import { cn } from '@/lib/utils'

type Risk = 'classic' | 'low' | 'high'

const TOTAL = 40
const COLS = 8

// Mirror server KENO_MULTIPLIERS — keyed by picks count → hits → multiplier
const MULTIPLIERS: Record<Risk, Record<number, Record<number, number>>> = {
  classic: {
    1: { 1: 3 },
    2: { 2: 7, 1: 0 },
    3: { 3: 27, 2: 2, 1: 0 },
    4: { 4: 90, 3: 3, 2: 1 },
    5: { 5: 250, 4: 7, 3: 2, 2: 0 },
    6: { 6: 750, 5: 18, 4: 4, 3: 1 },
  },
  low: {
    1: { 1: 2 },
    2: { 2: 4, 1: 1 },
    3: { 3: 8, 2: 2, 1: 0.5 },
    4: { 4: 15, 3: 3, 2: 1 },
    5: { 5: 30, 4: 6, 3: 2, 2: 0.5 },
    6: { 6: 60, 5: 12, 4: 4, 3: 1 },
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

function DiamondIcon({ glow = false }: { glow?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('w-8 h-8', glow && 'drop-shadow-[0_0_6px_#22c55e]')} fill="none">
      <polygon points="16,3 29,12 16,29 3,12" fill="#16a34a" stroke="#4ade80" strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points="16,3 29,12 16,17" fill="#4ade80" opacity="0.7" />
      <polygon points="3,12 16,17 16,29" fill="#14532d" opacity="0.6" />
      <line x1="3" y1="12" x2="29" y2="12" stroke="#4ade80" strokeWidth="0.8" opacity="0.5" />
      <circle cx="25" cy="7"  r="1"   fill="#bbf7d0" opacity="0.9" />
      <circle cx="7"  cy="8"  r="0.7" fill="#bbf7d0" opacity="0.7" />
      <circle cx="24" cy="18" r="0.6" fill="#bbf7d0" opacity="0.6" />
    </svg>
  )
}

export default function KenoPage() {
  const [mode, setMode] = useState<'manual' | 'auto'>('manual')
  const [wager, setWager] = useState(100)
  const [risk, setRisk] = useState<Risk>('classic')
  const [picks, setPicks] = useState<Set<number>>(new Set())
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
  const activeDrawnSet: Set<number> = isPlaying ? revealedDrawn : (hasResult ? drawnSet : new Set())

  const togglePick = useCallback((n: number) => {
    if (isPlaying || loading) return
    setPicks(prev => {
      const next = new Set(prev)
      if (next.has(n)) { next.delete(n); return next }
      if (next.size >= 6) return prev
      next.add(n)
      return next
    })
  }, [isPlaying, loading])

  const autoPick = () => {
    const nums = Array.from({ length: TOTAL }, (_, i) => i + 1).sort(() => Math.random() - 0.5)
    setPicks(new Set(nums.slice(0, 6)))
  }

  const clearTable = () => {
    if (isPlaying || loading) return
    setPicks(new Set())
    setHasResult(false)
    setDrawnNumbers([])
    setRevealedDrawn(new Set())
  }

  const placeBet = async () => {
    if (picks.size === 0 || loading || isPlaying) return
    setLoading(true)
    setHasResult(false)
    setRevealedDrawn(new Set())
    setDrawnNumbers([])

    const res = await fetch('/api/games/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: 'keno', wager, gameData: { picks: Array.from(picks), risk } }),
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

    // Reveal drawn numbers one at a time
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
      animRef.current = setTimeout(reveal, 110)
    }
    animRef.current = setTimeout(reveal, 150)
  }

  const betAgain = () => {
    if (animRef.current) clearTimeout(animRef.current)
    setHasResult(false)
    setDrawnNumbers([])
    setRevealedDrawn(new Set())
    setMatched(0)
    setMultiplier(0)
    setPayout(0)
    setIsPlaying(false)
    // Picks intentionally kept
  }

  const payoutTable = picks.size > 0 ? MULTIPLIERS[risk]?.[picks.size] : null
  // Sort payout entries by hits asc for the strip at bottom
  const payoutEntries = payoutTable
    ? Object.entries(payoutTable)
        .map(([h, m]) => ({ hits: parseInt(h), mult: m }))
        .sort((a, b) => a.hits - b.hits)
    : []

  return (
    <GameLayout title="Keno">
      <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-120px)] bg-[#0d1117]">

        {/* ── Sidebar ── */}
        <aside className="w-full lg:w-[300px] shrink-0 bg-[#0d1117] border-b lg:border-b-0 lg:border-r border-white/[0.06] flex flex-col p-4 gap-4">

          {/* Manual / Auto toggle */}
          <div className="flex rounded-xl border border-white/10 bg-[#161b22] p-1 gap-1">
            {(['manual', 'auto'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'flex-1 h-8 rounded-lg text-sm font-semibold capitalize transition-all',
                  mode === m
                    ? 'bg-[#21262d] text-white shadow'
                    : 'text-white/30 hover:text-white/60'
                )}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          {/* Bet Amount */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">Bet Amount</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs font-mono">pts</span>
              <Input
                type="number" min={1}
                value={wager}
                onChange={e => setWager(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={isPlaying || loading}
                className="pl-10 bg-[#161b22] border-white/10 text-white h-10 text-sm font-mono"
              />
            </div>
            <div className="flex gap-1.5 mt-2">
              <button
                onClick={() => setWager(v => Math.max(1, Math.floor(v / 2)))}
                disabled={isPlaying || loading}
                className="flex-1 h-7 rounded-lg bg-[#21262d] border border-white/10 text-white/50 text-xs hover:text-white/80 transition-colors disabled:opacity-40"
              >1/2</button>
              <button
                onClick={() => setWager(v => v * 2)}
                disabled={isPlaying || loading}
                className="flex-1 h-7 rounded-lg bg-[#21262d] border border-white/10 text-white/50 text-xs hover:text-white/80 transition-colors disabled:opacity-40"
              >x2</button>
              <button
                onClick={() => setWager(999999)}
                disabled={isPlaying || loading}
                className="flex-1 h-7 rounded-lg bg-blue-600 border border-blue-400 text-white text-xs font-bold hover:bg-blue-500 transition-colors disabled:opacity-40"
              >Max</button>
            </div>
          </div>

          {/* Risk dropdown */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">Risk</p>
            <div className="relative">
              <select
                value={risk}
                onChange={e => setRisk(e.target.value as Risk)}
                disabled={isPlaying || loading}
                className="w-full h-10 rounded-lg bg-[#161b22] border border-white/10 text-white text-sm px-3 appearance-none cursor-pointer disabled:opacity-40 focus:outline-none focus:border-blue-500/50"
              >
                <option value="classic">Classic</option>
                <option value="low">Low</option>
                <option value="high">High</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
            </div>
          </div>

          {/* Auto Pick */}
          <button
            onClick={autoPick}
            disabled={isPlaying || loading}
            className="w-full h-10 rounded-lg bg-[#161b22] border border-white/10 text-white/50 text-sm hover:bg-[#1c2128] hover:text-white/80 transition-all disabled:opacity-40"
          >
            Auto Pick
          </button>

          {/* Clear Table */}
          <button
            onClick={clearTable}
            disabled={isPlaying || loading}
            className="w-full h-10 rounded-lg bg-[#161b22] border border-white/10 text-white/40 text-sm hover:bg-[#1c2128] hover:text-white/60 transition-all disabled:opacity-40"
          >
            Clear Table
          </button>

          {/* Place Bet / Bet Again */}
          <button
            onClick={hasResult ? betAgain : placeBet}
            disabled={loading || isPlaying || picks.size === 0}
            className={cn(
              'w-full h-12 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              hasResult
                ? 'bg-[#21262d] border border-white/10 text-white hover:bg-[#2d333b]'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-700/30'
            )}
          >
            {(loading || isPlaying) ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : hasResult ? 'Bet Again' : 'Place Bet'}
          </button>

          {/* Result summary */}
          {hasResult && (
            <div className={cn(
              'rounded-xl border p-3 text-center',
              multiplier > 0 ? 'border-blue-500/30 bg-blue-600/10' : 'border-white/10 bg-white/5'
            )}>
              <p className="text-xs text-white/40 mb-0.5">{matched}/{picks.size} matched</p>
              <p className={cn('text-xl font-extrabold', multiplier > 0 ? 'text-blue-400' : 'text-white/30')}>
                {multiplier > 0 ? `${multiplier}x` : 'No win'}
              </p>
              {multiplier > 0 && (
                <p className="text-sm text-blue-300/70 font-mono">+{(payout - wager).toLocaleString()} pts</p>
              )}
            </div>
          )}
        </aside>

        {/* ── Game area ── */}
        <div className="flex-1 flex flex-col p-4 md:p-6 gap-4 overflow-hidden">

          {/* Number grid 8×5 = 40 */}
          <div className="grid grid-cols-8 gap-2 flex-1">
            {Array.from({ length: TOTAL }, (_, i) => i + 1).map(n => {
              const isPicked        = picks.has(n)
              const isRevealedDrawn = activeDrawnSet.has(n)
              const isHit           = isPicked && isRevealedDrawn
              const isMiss          = isPicked && hasResult && !drawnSet.has(n)
              const isDrawnOnly     = !isPicked && isRevealedDrawn

              return (
                <button
                  key={n}
                  onClick={() => togglePick(n)}
                  disabled={isPlaying || loading}
                  className={cn(
                    'aspect-square rounded-xl font-bold text-sm transition-all duration-150',
                    'flex items-center justify-center border relative',
                    'disabled:cursor-default',
                    // default
                    !isPicked && !isRevealedDrawn &&
                      'bg-[#161b22] border-[#21262d] text-white/60 hover:bg-[#1c2128] hover:border-blue-500/25 hover:text-white',
                    // selected, not drawn yet
                    isPicked && !isHit && !isMiss &&
                      'bg-[#22c55e] border-[#4ade80] text-black shadow-lg shadow-green-500/25',
                    // drawn but not picked — dark, red number
                    isDrawnOnly &&
                      'bg-[#161b22] border-[#21262d] text-red-400',
                    // HIT: picked + drawn = green with gem icon + glow border
                    isHit &&
                      'bg-[#22c55e] border-[#86efac] text-black shadow-xl shadow-green-500/30 scale-[1.05] z-10',
                    // MISS: picked but not in drawn — dim
                    isMiss &&
                      'bg-[#22c55e]/20 border-[#4ade80]/20 text-white/20',
                  )}
                >
                  {isHit ? <DiamondIcon glow /> : <span>{n}</span>}
                </button>
              )
            })}
          </div>

          {/* Payout multiplier strip */}
          {payoutEntries.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
              {payoutEntries.map(({ hits, mult }) => {
                const isWin = hasResult && hits === matched && mult > 0
                const isActive = picks.size > 0 && mult > 0
                return (
                  <div
                    key={hits}
                    className={cn(
                      'flex flex-col items-center shrink-0 min-w-[68px] px-2 py-2 rounded-xl border text-center transition-all',
                      isWin
                        ? 'border-blue-400 bg-blue-600/20 text-white'
                        : isActive
                          ? 'border-dashed border-white/20 bg-transparent text-white/50'
                          : 'border-transparent bg-transparent text-white/20'
                    )}
                  >
                    <span className={cn('text-sm font-bold', isWin && 'text-blue-300')}>
                      {mult > 0 ? `${mult}x` : '0x'}
                    </span>
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
