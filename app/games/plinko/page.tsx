'use client'

import { useState, useEffect, useRef } from 'react'
import { mutate } from 'swr'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { GameLayout } from '@/components/games/game-layout'
import { cn } from '@/lib/utils'

type Risk = 'low' | 'medium' | 'high'

const ROWS = 16

// 17 bucket multipliers for low/medium/high matching Stake-style layout
const MULTIPLIERS: Record<Risk, number[]> = {
  low:    [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1.0, 0.5, 1.0, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
  medium: [110, 41, 10, 5, 3, 1.5, 1.0, 0.5, 0.3, 0.5, 1.0, 1.5, 3, 5, 10, 41, 110],
  high:   [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
}

function bucketColor(mult: number): string {
  if (mult >= 100) return 'bg-red-500 text-white border-red-400'
  if (mult >= 25)  return 'bg-orange-500 text-white border-orange-400'
  if (mult >= 10)  return 'bg-yellow-500 text-black border-yellow-400'
  if (mult >= 3)   return 'bg-[#39d353] text-black border-green-400'
  if (mult >= 1)   return 'bg-[#2ebd4a] text-black border-green-500'
  return 'bg-[#1a3d25] text-green-400/70 border-[#1f4a2d]'
}

// Build a ball path that ends at targetSlot (0-indexed from left)
// After ROWS bounces the ball has made exactly targetSlot right-moves.
function buildPath(targetSlot: number): boolean[] {
  const path: boolean[] = []
  let rightMoves = 0
  for (let row = 0; row < ROWS; row++) {
    const rowsLeft = ROWS - row - 1
    const rightNeeded = targetSlot - rightMoves
    const leftNeeded = rowsLeft - rightNeeded
    let goRight: boolean
    if (rightNeeded <= 0) {
      goRight = false
    } else if (leftNeeded <= 0) {
      goRight = true
    } else {
      // Spread moves: bias toward target proportionally, with jitter
      goRight = (row + rightMoves) % 2 === 0
        ? rightNeeded > rowsLeft / 2
        : rightNeeded >= rowsLeft / 2
    }
    path.push(goRight)
    if (goRight) rightMoves++
  }
  return path
}

const CHIP_COLORS = [
  { value: 50,   label: '50',  cls: 'bg-red-600 border-red-400 hover:bg-red-500' },
  { value: 100,  label: '100', cls: 'bg-green-600 border-green-400 hover:bg-green-500' },
  { value: 500,  label: '500', cls: 'bg-slate-700 border-slate-500 hover:bg-slate-600' },
  { value: 1000, label: '1K',  cls: 'bg-purple-700 border-purple-400 hover:bg-purple-600' },
]

export default function PlinkoPage() {
  const [wager, setWager] = useState(100)
  const [risk, setRisk] = useState<Risk>('medium')
  const [loading, setLoading] = useState(false)
  const [animStep, setAnimStep] = useState(-1)        // -1 = no ball
  const [ballCol, setBallCol] = useState(0)            // current column of ball
  const [finalSlot, setFinalSlot] = useState<number | null>(null)
  const [payout, setPayout] = useState<number | null>(null)
  const [multiplier, setMultiplier] = useState<number | null>(null)
  const [path, setPath] = useState<boolean[] | null>(null)
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isAnimating = animStep >= 0 && finalSlot === null

  const placeBet = async () => {
    if (loading || isAnimating) return
    setLoading(true)
    setFinalSlot(null)
    setPayout(null)
    setMultiplier(null)
    setAnimStep(-1)
    setBallCol(0)
    setPath(null)

    const res = await fetch('/api/games/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: 'plinko', wager, gameData: { risk } }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.error) return

    const slot = data.result.slot as number
    const ballPath = buildPath(slot)
    setPath(ballPath)
    setAnimStep(0)
    setBallCol(0)

    let step = 0
    let col = 0
    const tick = () => {
      if (step >= ROWS) {
        setFinalSlot(slot)
        setPayout(data.payout)
        setMultiplier(data.result.multiplier)
        setAnimStep(-1)
        mutate('/api/games/profile')
        mutate('/api/games/history')
        return
      }
      setAnimStep(step)
      setBallCol(col)
      if (ballPath[step]) col++
      step++
      animRef.current = setTimeout(tick, 55)
    }
    animRef.current = setTimeout(tick, 100)
  }

  useEffect(() => () => { if (animRef.current) clearTimeout(animRef.current) }, [])

  const mults = MULTIPLIERS[risk]
  const riskColors: Record<Risk, string> = {
    low:    'bg-blue-600/20 border-blue-400 text-blue-300',
    medium: 'bg-yellow-600/20 border-yellow-400 text-yellow-300',
    high:   'bg-red-600/20 border-red-400 text-red-300',
  }

  // SVG board geometry — reference: triangle of pegs growing from 3 at top to ROWS+2 at bottom
  // We use a fixed-width grid. Each row r has (r+3) pegs.
  // The centre column stays at x=50. Pegs are spaced PEG_SPACING apart horizontally.
  const BOARD_W = 100
  const ROW_H = 5.5
  const BOARD_H = ROWS * ROW_H + 10
  const PEG_SPACING = 4.5 // horizontal gap between pegs

  // Peg positions — row r has (r+3) pegs centered at x=50
  const pegRows = Array.from({ length: ROWS }, (_, row) => {
    const numPegs = row + 3
    const totalWidth = (numPegs - 1) * PEG_SPACING
    const startX = (BOARD_W - totalWidth) / 2
    return Array.from({ length: numPegs }, (_, col) => ({
      x: startX + col * PEG_SPACING,
      y: ROW_H * (row + 1),
    }))
  })

  // Ball position during animation
  // At row `animStep`, the ball has made `col` right-moves so far.
  // The ball sits at the gap left of peg[col] in that row (between peg col-1 and col).
  let ballX = BOARD_W / 2
  let ballY = ROW_H * 0.5
  if (path && animStep >= 0) {
    let col = 0
    for (let r = 0; r < animStep && r < ROWS; r++) {
      if (path[r]) col++
    }
    const row = Math.min(animStep, ROWS - 1)
    const numPegs = row + 3
    const totalWidth = (numPegs - 1) * PEG_SPACING
    const startX = (BOARD_W - totalWidth) / 2
    // Ball hovers between the col-th and (col+1)-th peg — i.e. at startX + col * PEG_SPACING + PEG_SPACING/2
    // But for row 0 the ball starts at center above first peg row
    ballX = startX + col * PEG_SPACING + (row > 0 ? PEG_SPACING / 2 : 0)
    ballY = ROW_H * (row + 0.5)
  }

  return (
    <GameLayout title="Plinko">
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-120px)] bg-[#0f1923]">

        {/* ── Sidebar ── */}
        <div className="w-full lg:w-64 xl:w-72 shrink-0 bg-[#0d1620] border-b lg:border-b-0 lg:border-r border-white/5 p-5 flex flex-col gap-5">

          {/* Risk */}
          <div>
            <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Risk</p>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as Risk[]).map(r => (
                <button
                  key={r}
                  disabled={isAnimating || loading}
                  onClick={() => { setRisk(r); setFinalSlot(null); setPayout(null); setMultiplier(null) }}
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
            <div className="relative mb-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">pts</span>
              <Input
                type="number" min={1}
                value={wager}
                onChange={e => setWager(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={isAnimating || loading}
                className="pl-9 bg-black/20 border-white/10 text-white h-9 text-sm"
              />
            </div>
            <div className="flex gap-1.5">
              {CHIP_COLORS.map(chip => (
                <button
                  key={chip.value}
                  disabled={isAnimating || loading}
                  onClick={() => setWager(chip.value)}
                  className={cn(
                    'flex-1 h-7 rounded-lg border text-xs font-bold text-white transition-all',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    chip.cls,
                    wager === chip.value && 'ring-1 ring-white/30'
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rows display */}
          <div>
            <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Rows</p>
            <div className="h-9 px-3 flex items-center rounded-lg bg-black/20 border border-white/10 text-white text-sm">
              16
            </div>
          </div>

          {/* Place bet */}
          <button
            onClick={placeBet}
            disabled={loading || isAnimating || wager < 1}
            className={cn(
              'w-full h-12 rounded-xl font-bold text-sm mt-auto',
              'bg-[#39d353] hover:bg-[#4ae664] text-black transition-all',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'flex items-center justify-center'
            )}
          >
            {loading || isAnimating ? <Loader2 className="h-5 w-5 animate-spin text-black" /> : 'Drop Ball'}
          </button>

          {/* Result */}
          {finalSlot !== null && (
            <div className={cn(
              'rounded-xl border p-3 text-center',
              (multiplier ?? 0) >= 1
                ? 'border-[#39d353]/30 bg-[#39d353]/10'
                : 'border-red-500/30 bg-red-500/10'
            )}>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-1">{multiplier}x</p>
              <p className={cn('text-xl font-extrabold',
                (payout ?? 0) >= wager ? 'text-[#39d353]' : 'text-red-400'
              )}>
                {(payout ?? 0) >= wager
                  ? `+${((payout ?? 0) - wager).toLocaleString()} pts`
                  : `-${(wager - (payout ?? 0)).toLocaleString()} pts`
                }
              </p>
            </div>
          )}
        </div>

        {/* ── Plinko board ── */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
          <svg
            viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
            className="w-full max-w-lg"
            style={{ maxHeight: '70vh' }}
          >
            {/* Background */}
            <rect width={BOARD_W} height={BOARD_H} fill="#0f1923" rx="2" />

            {/* Pegs */}
            {pegRows.map((pegs, row) =>
              pegs.map((peg, col) => (
                <circle key={`${row}-${col}`} cx={peg.x} cy={peg.y} r="0.8" fill="#e2e8f0" opacity="0.85" />
              ))
            )}

            {/* Animated ball */}
            {(isAnimating || finalSlot !== null) && (
              <circle
                cx={finalSlot !== null
                  ? (() => {
                      // Bucket positions mirror the bottom row of pegs
                      const numBuckets = mults.length // = ROWS + 1 = 17
                      const bottomRowPegs = ROWS + 2 // row ROWS-1 has ROWS+2 pegs
                      const totalWidth = (bottomRowPegs - 1) * PEG_SPACING
                      const startX = (BOARD_W - totalWidth) / 2
                      // bucket i sits between peg i-1 and peg i → center at startX + (i-0.5)*PEG_SPACING... 
                      // simpler: bucket i center = startX - PEG_SPACING/2 + i * PEG_SPACING
                      return startX - PEG_SPACING / 2 + finalSlot * PEG_SPACING
                    })()
                  : ballX}
                cy={finalSlot !== null ? BOARD_H - 4.5 : ballY}
                r="1.8"
                fill="#39d353"
                style={{ filter: 'drop-shadow(0 0 3px #39d353)' }}
              />
            )}

            {/* Bucket multipliers — 17 buckets aligned under the bottom peg row */}
            {mults.map((m, i) => {
              // Bottom peg row (row 15) has 18 pegs; buckets sit in the 17 gaps between them
              const bottomRowPegs = ROWS + 2
              const totalWidth = (bottomRowPegs - 1) * PEG_SPACING
              const startX = (BOARD_W - totalWidth) / 2
              const bw = PEG_SPACING
              const x = startX - PEG_SPACING / 2 + i * bw
              const y = BOARD_H - 7
              const isLit = finalSlot === i
              const colors: Record<string, string> = {
                red:    '#ef4444',
                orange: '#f97316',
                yellow: '#eab308',
                green:  '#39d353',
                dkgreen:'#1a5e28',
              }
              const col = m >= 100 ? colors.red : m >= 25 ? colors.orange : m >= 10 ? colors.yellow : m >= 1 ? colors.green : colors.dkgreen
              return (
                <g key={i}>
                  <rect
                    x={x + 0.2}
                    y={y}
                    width={bw - 0.4}
                    height={6}
                    rx="0.8"
                    fill={isLit ? col : col + '55'}
                    stroke={isLit ? '#fff' : 'none'}
                    strokeWidth={isLit ? 0.25 : 0}
                  />
                  <text
                    x={x + bw / 2}
                    y={y + 3.8}
                    textAnchor="middle"
                    fontSize="1.8"
                    fontWeight="bold"
                    fill={isLit ? '#000' : '#fff'}
                    opacity={isLit ? 1 : 0.7}
                  >
                    {m >= 1 ? `${m}x` : `${m}x`}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>
    </GameLayout>
  )
}
