'use client'

import { useState, useEffect, useRef } from 'react'
import { mutate } from 'swr'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { GameLayout } from '@/components/games/game-layout'
import { cn } from '@/lib/utils'

type Risk = 'low' | 'medium' | 'high'

const ROWS = 16

// Exact multipliers — must match server PLINKO_MULTIPLIERS
const PLINKO_MULTIPLIERS: Record<Risk, number[]> = {
  low:    [15.5, 8.73, 1.94, 1.35, 1.35, 1.16, 1.07, 0.97, 0.49, 0.97, 1.07, 1.16, 1.35, 1.35, 1.94, 8.73, 15.5],
  medium: [106,  39.7, 9.68, 4.84, 2.9,  1.46, 0.97, 0.49, 0.29, 0.49, 0.97, 1.46, 2.9,  4.84, 9.68, 39.7, 106],
  high:   [968,  126,  25.2, 8.71, 3.87, 1.93, 0.2,  0.2,  0.2,  0.2,  0.2,  1.93, 3.87, 8.71, 25.2, 126,  968],
}

// Color each bucket by its multiplier value — blue gradient scheme
function bucketColor(mult: number, isLit: boolean): { fill: string; text: string } {
  if (isLit) return { fill: '#ffffff', text: '#0d1117' }
  if (mult >= 100)  return { fill: '#1d4ed8', text: '#93c5fd' }  // deep blue
  if (mult >= 20)   return { fill: '#1e40af', text: '#93c5fd' }  // dark blue
  if (mult >= 5)    return { fill: '#1e3a8a', text: '#7dd3fc' }  // navy
  if (mult >= 1.5)  return { fill: '#172554', text: '#60a5fa' }  // deeper navy
  if (mult >= 1)    return { fill: '#1e293b', text: '#94a3b8' }  // slate
  return { fill: '#0f172a', text: '#475569' }                    // dark (losers)
}

// Build a deterministic ball path that ends exactly at targetSlot
function buildPath(targetSlot: number): boolean[] {
  const path: boolean[] = []
  let rightMoves = 0
  for (let row = 0; row < ROWS; row++) {
    const rowsLeft = ROWS - row - 1
    const rightNeeded = targetSlot - rightMoves
    const leftNeeded = rowsLeft - rightNeeded
    let goRight: boolean
    if (rightNeeded <= 0)   goRight = false
    else if (leftNeeded <= 0) goRight = true
    else goRight = (row + rightMoves) % 2 === 0
      ? rightNeeded > rowsLeft / 2
      : rightNeeded >= rowsLeft / 2
    path.push(goRight)
    if (goRight) rightMoves++
  }
  return path
}

const HALF_BET_BTNS = [
  { label: '1/2', action: (w: number) => Math.max(1, Math.floor(w / 2)) },
  { label: 'x2',  action: (w: number) => w * 2 },
]

export default function PlinkoPage() {
  const [wager, setWager]                   = useState(100)
  const [risk, setRisk]                     = useState<Risk>('high')
  const [loading, setLoading]               = useState(false)
  const [animStep, setAnimStep]             = useState(-1)
  const [ballX, setBallX]                   = useState(0)
  const [ballY, setBallY]                   = useState(0)
  const [trailPoints, setTrailPoints]       = useState<{x:number,y:number}[]>([])
  const [finalSlot, setFinalSlot]           = useState<number | null>(null)
  const [landFlash, setLandFlash]           = useState(false)
  const [payout, setPayout]                 = useState<number | null>(null)
  const [resultMultiplier, setResultMult]   = useState<number | null>(null)
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isAnimating = animStep >= 0 && finalSlot === null
  const mults = PLINKO_MULTIPLIERS[risk]

  // ── SVG geometry ──────────────────────────────────────────────────────────
  const BOARD_W  = 100
  const ROW_H    = 5.2
  const PEG_R    = 0.85
  const PEG_SPACING = 4.4
  const BOARD_H  = ROWS * ROW_H + 12

  // Row r has (r + 3) pegs, centred at x = 50
  const pegRows = Array.from({ length: ROWS }, (_, row) => {
    const n = row + 3
    const totalW = (n - 1) * PEG_SPACING
    const startX = (BOARD_W - totalW) / 2
    return Array.from({ length: n }, (_, col) => ({
      x: startX + col * PEG_SPACING,
      y: ROW_H * (row + 1),
    }))
  })

  // Bottom row has (ROWS + 2) pegs → (ROWS + 1) = 17 gap centres
  const bottomPegs = ROWS + 2
  const bottomTotalW = (bottomPegs - 1) * PEG_SPACING
  const bottomStartX = (BOARD_W - bottomTotalW) / 2
  const getBucketCX = (i: number) => bottomStartX + i * PEG_SPACING + PEG_SPACING / 2 - PEG_SPACING / 2
  // Correct: bucket i sits between peg i and peg i+1 of the bottom row
  // peg i x = bottomStartX + i * PEG_SPACING
  // gap centre = bottomStartX + (i + 0.5) * PEG_SPACING
  const getBucketCentre = (i: number) => bottomStartX + (i + 0.5) * PEG_SPACING

  const BUCKET_Y = BOARD_H - 8
  const BUCKET_H = 6.5
  const BUCKET_W = PEG_SPACING - 0.5

  // Ball position at a given step along the path
  function getBallPos(step: number, path: boolean[]): { x: number; y: number } {
    let col = 0
    for (let r = 0; r < step && r < ROWS; r++) {
      if (path[r]) col++
    }
    if (step >= ROWS) {
      // Final slot
      const finalCol = col
      return { x: getBucketCentre(finalCol), y: BUCKET_Y + BUCKET_H / 2 }
    }
    const row = step
    const n = row + 3
    const totalW = (n - 1) * PEG_SPACING
    const startX = (BOARD_W - totalW) / 2
    // Ball hovers between peg col and col+1 (where it'll bounce from)
    const pegX = startX + col * PEG_SPACING
    // midpoint between two pegs it is falling between
    const nextPegX = col < n - 1 ? startX + (col + 1) * PEG_SPACING : pegX
    return {
      x: (pegX + nextPegX) / 2,
      y: ROW_H * (row + 1) - ROW_H * 0.3,
    }
  }

  const placeBet = async () => {
    if (loading || isAnimating) return
    setLoading(true)
    setFinalSlot(null)
    setPayout(null)
    setResultMult(null)
    setAnimStep(-1)
    setTrailPoints([])
    setLandFlash(false)

    const res = await fetch('/api/games/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: 'plinko', wager, gameData: { risk } }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.error) return

    const slot: number  = data.result.slot
    const serverMult: number = data.result.multiplier
    const path = buildPath(slot)

    const initPos = { x: BOARD_W / 2, y: ROW_H * 0.4 }
    setBallX(initPos.x)
    setBallY(initPos.y)
    setAnimStep(0)

    const trail: {x:number,y:number}[] = []

    let step = 0
    const tick = () => {
      if (step > ROWS) {
        // Done
        setFinalSlot(slot)
        setAnimStep(-1)
        setLandFlash(true)
        setTimeout(() => setLandFlash(false), 600)
        setPayout(data.payout)
        setResultMult(serverMult)
        mutate('/api/games/profile')
        mutate('/api/games/history')
        return
      }

      const pos = getBallPos(step, path)
      setBallX(pos.x)
      setBallY(pos.y)

      // Keep last 6 positions as trail
      trail.push({ x: pos.x, y: pos.y })
      if (trail.length > 6) trail.shift()
      setTrailPoints([...trail])

      setAnimStep(step)
      step++
      animRef.current = setTimeout(tick, step === 1 ? 120 : 70)
    }
    animRef.current = setTimeout(tick, 80)
  }

  useEffect(() => () => { if (animRef.current) clearTimeout(animRef.current) }, [])

  const profit = payout !== null ? payout - wager : null
  const isWin  = profit !== null && profit > 0

  return (
    <GameLayout title="Plinko">
      <style>{`
        @keyframes land-flash { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .land-flash { animation: land-flash 0.15s ease 3; }
      `}</style>

      <div className="flex min-h-[calc(100vh-120px)] bg-[#0d1117]">

        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <div className="w-60 xl:w-64 shrink-0 border-r border-white/5 p-5 flex flex-col gap-5">

          {/* Risk */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-semibold">Risk</p>
            <div className="flex gap-1">
              {(['low','medium','high'] as Risk[]).map(r => (
                <button
                  key={r}
                  disabled={isAnimating || loading}
                  onClick={() => { setRisk(r); setFinalSlot(null); setPayout(null); setResultMult(null) }}
                  className={cn(
                    'flex-1 h-8 rounded-lg border text-[11px] font-semibold capitalize transition-all',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    risk === r
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                  )}
                >{r}</button>
              ))}
            </div>
          </div>

          {/* Bet Amount */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-semibold">Bet Amount</p>
            <div className="relative mb-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs font-mono">pts</span>
              <Input
                type="number" min={1}
                value={wager}
                onChange={e => setWager(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={isAnimating || loading}
                className="pl-9 bg-[#161b22] border-white/10 text-white h-9 text-sm"
              />
            </div>
            <div className="flex gap-1.5">
              {HALF_BET_BTNS.map(btn => (
                <button
                  key={btn.label}
                  disabled={isAnimating || loading}
                  onClick={() => setWager(btn.action(wager))}
                  className="flex-1 h-8 rounded-lg bg-[#1c2333] border border-white/10 text-white/60 text-xs font-semibold hover:bg-[#232d3f] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >{btn.label}</button>
              ))}
              <button
                disabled={isAnimating || loading}
                onClick={() => setWager(20000)}
                className="flex-1 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 text-xs font-semibold hover:bg-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >Max</button>
            </div>
          </div>

          {/* Drop Ball */}
          <button
            onClick={placeBet}
            disabled={loading || isAnimating || wager < 1}
            className="w-full h-11 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-auto"
          >
            {loading || isAnimating
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : 'Drop Ball'}
          </button>


        </div>

        {/* ── Board ──────────────────────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-6 relative">
          {/* Result — overlaid on the board so the sidebar never shifts */}
          {finalSlot !== null && resultMultiplier !== null && profit !== null && (
            <div className={cn(
              'absolute top-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3',
              'px-6 py-3 rounded-2xl border backdrop-blur-sm pointer-events-none',
              'animate-in fade-in slide-in-from-top-2 duration-300',
              isWin
                ? 'border-blue-500/50 bg-blue-950/80 shadow-lg shadow-blue-500/20'
                : 'border-red-500/40 bg-red-950/80 shadow-lg shadow-red-500/10'
            )}>
              <span className="text-lg font-black text-white/50">{resultMultiplier}x</span>
              <span className={cn('text-xl font-extrabold', isWin ? 'text-blue-400' : 'text-red-400')}>
                {isWin ? `+${profit.toLocaleString()}` : profit.toLocaleString()} pts
              </span>
            </div>
          )}

          <svg
            viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
            className="w-full max-w-2xl"
            style={{ maxHeight: '82vh' }}
          >
            <rect width={BOARD_W} height={BOARD_H} fill="#0d1117" />

            {/* Pegs */}
            {pegRows.map((pegs, row) =>
              pegs.map((peg, col) => (
                <circle
                  key={`${row}-${col}`}
                  cx={peg.x} cy={peg.y}
                  r={PEG_R}
                  fill="#c9d1d9"
                  opacity="0.85"
                />
              ))
            )}

            {/* Ball trail */}
            {isAnimating && trailPoints.map((pt, i) => (
              <circle
                key={i}
                cx={pt.x} cy={pt.y}
                r={1.2 * ((i + 1) / trailPoints.length)}
                fill="#3b82f6"
                opacity={(i + 1) / trailPoints.length * 0.4}
              />
            ))}

            {/* Ball */}
            {(isAnimating) && (
              <circle
                cx={ballX} cy={ballY}
                r="1.8"
                fill="#e0f2fe"
                style={{ filter: 'drop-shadow(0 0 3px #3b82f6) drop-shadow(0 0 6px #3b82f6)' }}
              />
            )}

            {/* Buckets */}
            {mults.map((m, i) => {
              const cx  = getBucketCentre(i)
              const x   = cx - BUCKET_W / 2
              const isLit = finalSlot === i
              const { fill, text } = bucketColor(m, isLit)
              return (
                <g key={i}>
                  <rect
                    x={x} y={BUCKET_Y}
                    width={BUCKET_W} height={BUCKET_H}
                    rx="1"
                    fill={fill}
                    className={isLit && landFlash ? 'land-flash' : ''}
                    style={isLit ? { filter: 'drop-shadow(0 0 4px #ffffff99)' } : undefined}
                  />
                  <text
                    x={cx} y={BUCKET_Y + BUCKET_H * 0.62}
                    textAnchor="middle"
                    fontSize="1.4"
                    fontWeight={isLit ? '900' : '600'}
                    fill={text}
                  >
                    {m >= 10 ? `${m}x` : `${m}x`}
                  </text>
                </g>
              )
            })}

            {/* Ball resting in winning bucket */}
            {finalSlot !== null && (
              <circle
                cx={getBucketCentre(finalSlot)}
                cy={BUCKET_Y + BUCKET_H / 2}
                r="1.8"
                fill="#e0f2fe"
                style={{ filter: 'drop-shadow(0 0 3px #3b82f6) drop-shadow(0 0 6px #3b82f6)' }}
              />
            )}
          </svg>
        </div>
      </div>
    </GameLayout>
  )
}
