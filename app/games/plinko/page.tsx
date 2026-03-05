'use client'

import { useState, useEffect, useRef } from 'react'
import { mutate } from 'swr'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { GameLayout } from '@/components/games/game-layout'
import { cn } from '@/lib/utils'

type Risk = 'low' | 'medium' | 'high'

const ROWS = 16

// These MUST exactly match the server PLINKO_MULTIPLIERS in /app/api/games/bet/route.ts
// Slot 0 = leftmost bucket, slot 16 = rightmost bucket
const SERVER_MULTIPLIERS: Record<Risk, number[]> = {
  low:    [0.5, 0.7, 1.0, 1.2, 1.5, 2.0, 3.0, 5.0, 3.0, 2.0, 1.5, 1.2, 1.0, 0.7, 0.5, 0.3, 0.2],
  medium: [0.3, 0.5, 0.7, 1.0, 1.5, 2.0, 5.0, 8.0, 5.0, 2.0, 1.5, 1.0, 0.7, 0.5, 0.3, 0.2, 0.1],
  high:   [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
}

function bucketColor(mult: number): string {
  if (mult >= 100)  return '#ef4444'
  if (mult >= 20)   return '#f97316'
  if (mult >= 5)    return '#eab308'
  if (mult >= 2)    return '#22c55e'
  if (mult >= 1)    return '#3b82f6'
  return '#1e3a5f'
}

// Build a deterministic ball path that ends at targetSlot out of ROWS bounces
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
      // Deterministic jitter: alternates bias based on row parity
      goRight = (row + rightMoves) % 2 === 0
        ? rightNeeded > rowsLeft / 2
        : rightNeeded >= rowsLeft / 2
    }
    path.push(goRight)
    if (goRight) rightMoves++
  }
  return path
}

const CHIPS = [
  { value: 50,   label: '50',  cls: 'bg-red-600 border-red-400 hover:bg-red-500' },
  { value: 100,  label: '100', cls: 'bg-green-600 border-green-400 hover:bg-green-500' },
  { value: 500,  label: '500', cls: 'bg-slate-700 border-slate-500 hover:bg-slate-600' },
  { value: 1000, label: '1K',  cls: 'bg-purple-700 border-purple-400 hover:bg-purple-600' },
]

export default function PlinkoPage() {
  const [wager, setWager] = useState(100)
  const [risk, setRisk] = useState<Risk>('high')
  const [loading, setLoading] = useState(false)
  const [animStep, setAnimStep] = useState(-1)
  const [ballCol, setBallCol] = useState(0)
  const [finalSlot, setFinalSlot] = useState<number | null>(null)
  const [payout, setPayout] = useState<number | null>(null)
  // multiplier shown to user — comes FROM SERVER, not from local table
  const [resultMultiplier, setResultMultiplier] = useState<number | null>(null)
  const [path, setPath] = useState<boolean[] | null>(null)
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isAnimating = animStep >= 0 && finalSlot === null
  const mults = SERVER_MULTIPLIERS[risk]

  const placeBet = async () => {
    if (loading || isAnimating) return
    setLoading(true)
    setFinalSlot(null)
    setPayout(null)
    setResultMultiplier(null)
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

    // Server tells us the exact slot (0–16) and the exact multiplier it used
    const slot: number = data.result.slot
    const serverMult: number = data.result.multiplier
    const ballPath = buildPath(slot)

    setPath(ballPath)
    setAnimStep(0)
    setBallCol(0)

    let step = 0
    let col = 0
    const tick = () => {
      if (step >= ROWS) {
        // Animation complete — show final result using SERVER values
        setFinalSlot(slot)
        setPayout(data.payout)
        setResultMultiplier(serverMult)
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

  // ── SVG geometry ──
  const BOARD_W = 100
  const ROW_H = 5.5
  const PEG_SPACING = 4.5
  // row r has (r+3) pegs. Row ROWS-1 (row 15) has 18 pegs → 17 gaps = 17 buckets ✓
  const BOARD_H = ROWS * ROW_H + 10

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
    ballX = startX + col * PEG_SPACING + (row > 0 ? PEG_SPACING / 2 : 0)
    ballY = ROW_H * (row + 0.5)
  }

  // Bucket layout: 17 buckets sitting under the 17 gaps in the bottom row (18 pegs)
  const bottomRowPegs = ROWS + 2 // = 18
  const bottomTotalWidth = (bottomRowPegs - 1) * PEG_SPACING
  const bottomStartX = (BOARD_W - bottomTotalWidth) / 2
  const bucketY = BOARD_H - 7

  const getBucketCenterX = (i: number) => bottomStartX - PEG_SPACING / 2 + i * PEG_SPACING

  const riskBtnCls: Record<Risk, string> = {
    low:    'bg-blue-600/20 border-blue-500 text-blue-300',
    medium: 'bg-yellow-600/20 border-yellow-500 text-yellow-300',
    high:   'bg-red-600/20 border-red-500 text-red-300',
  }

  return (
    <GameLayout title="Plinko">
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-120px)] bg-[#0d1117]">

        {/* ── Sidebar ── */}
        <div className="w-full lg:w-64 xl:w-72 shrink-0 bg-[#0d1117] border-b lg:border-b-0 lg:border-r border-white/5 p-5 flex flex-col gap-5">

          {/* Risk */}
          <div>
            <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Risk</p>
            <div className="flex gap-1.5">
              {(['low', 'medium', 'high'] as Risk[]).map(r => (
                <button
                  key={r}
                  disabled={isAnimating || loading}
                  onClick={() => { setRisk(r); setFinalSlot(null); setPayout(null); setResultMultiplier(null) }}
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs font-mono">pts</span>
              <Input
                type="number" min={1}
                value={wager}
                onChange={e => setWager(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={isAnimating || loading}
                className="pl-10 bg-[#161b22] border-white/10 text-white h-10 text-sm"
              />
            </div>
            <div className="flex gap-1.5">
              {CHIPS.map(chip => (
                <button
                  key={chip.value}
                  disabled={isAnimating || loading}
                  onClick={() => setWager(chip.value)}
                  className={cn(
                    'flex-1 h-8 rounded-lg border text-xs font-bold text-white transition-all',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    chip.cls,
                    wager === chip.value && 'ring-2 ring-white/30 scale-105'
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div>
            <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Rows</p>
            <div className="h-10 px-3 flex items-center rounded-lg bg-[#161b22] border border-white/10 text-white text-sm">
              16
            </div>
          </div>

          {/* Drop Ball */}
          <button
            onClick={placeBet}
            disabled={loading || isAnimating || wager < 1}
            className={cn(
              'w-full h-12 rounded-xl font-bold text-sm mt-auto',
              'bg-blue-600 hover:bg-blue-500 text-white transition-all',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2'
            )}
          >
            {loading || isAnimating
              ? <Loader2 className="h-5 w-5 animate-spin" />
              : 'Drop Ball'}
          </button>

          {/* Result */}
          {finalSlot !== null && resultMultiplier !== null && (
            <div className={cn(
              'rounded-xl border p-4 text-center',
              (payout ?? 0) >= wager
                ? 'border-blue-500/40 bg-blue-600/10'
                : 'border-red-500/30 bg-red-500/10'
            )}>
              <p className="text-lg font-black text-white/70 mb-1">{resultMultiplier}x</p>
              <p className={cn(
                'text-2xl font-extrabold',
                (payout ?? 0) >= wager ? 'text-blue-400' : 'text-red-400'
              )}>
                {(payout ?? 0) >= wager
                  ? `+${((payout ?? 0) - wager).toLocaleString()} pts`
                  : `-${(wager - (payout ?? 0)).toLocaleString()} pts`
                }
              </p>
            </div>
          )}
        </div>

        {/* ── Board ── */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8">
          <svg
            viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
            className="w-full max-w-xl"
            style={{ maxHeight: '75vh' }}
          >
            <rect width={BOARD_W} height={BOARD_H} fill="#0d1117" />

            {/* Pegs */}
            {pegRows.map((pegs, row) =>
              pegs.map((peg, col) => (
                <circle
                  key={`${row}-${col}`}
                  cx={peg.x} cy={peg.y} r="0.9"
                  fill="#c9d1d9" opacity="0.8"
                />
              ))
            )}

            {/* Ball */}
            {(isAnimating || finalSlot !== null) && (
              <circle
                cx={finalSlot !== null ? getBucketCenterX(finalSlot) : ballX}
                cy={finalSlot !== null ? BOARD_H - 4 : ballY}
                r="2"
                fill="#3b82f6"
                style={{ filter: 'drop-shadow(0 0 4px #3b82f6)' }}
              />
            )}

            {/* Buckets */}
            {mults.map((m, i) => {
              const cx = getBucketCenterX(i)
              const bw = PEG_SPACING - 0.4
              const x = cx - bw / 2
              const isLit = finalSlot === i
              const col = bucketColor(m)
              return (
                <g key={i}>
                  <rect
                    x={x} y={bucketY}
                    width={bw} height={6}
                    rx="0.8"
                    fill={isLit ? col : col + '44'}
                    stroke={isLit ? '#fff' : col + '88'}
                    strokeWidth={isLit ? 0.3 : 0.15}
                  />
                  <text
                    x={cx} y={bucketY + 3.8}
                    textAnchor="middle"
                    fontSize="1.55"
                    fontWeight="bold"
                    fill={isLit ? '#fff' : '#94a3b8'}
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
