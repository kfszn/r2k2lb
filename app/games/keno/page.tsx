'use client'

import { useState, useRef, useCallback } from 'react'
import { mutate } from 'swr'
import { Input } from '@/components/ui/input'
import { Loader2, ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import { GameLayout } from '@/components/games/game-layout'
import { cn } from '@/lib/utils'

type Risk = 'classic' | 'low' | 'high'

const TOTAL = 30
const COLS  = 6
const DRAWN = 10

const MULTIPLIERS: Record<Risk, Record<number, Record<number, number>>> = {
  classic: {
    1: { 1: 3 },
    2: { 2: 7,   1: 0 },
    3: { 3: 27,  2: 2,  1: 0 },
    4: { 4: 90,  3: 3,  2: 1 },
    5: { 5: 250, 4: 7,  3: 2,  2: 0 },
    6: { 6: 750, 5: 18, 4: 4,  3: 1 },
  },
  low: {
    1: { 1: 2 },
    2: { 2: 4,   1: 1 },
    3: { 3: 8,   2: 2,  1: 0.5 },
    4: { 4: 15,  3: 3,  2: 1 },
    5: { 5: 30,  4: 6,  3: 2,  2: 0.5 },
    6: { 6: 60,  5: 12, 4: 4,  3: 1 },
  },
  high: {
    1: { 1: 3 },
    2: { 2: 10 },
    3: { 3: 30,  2: 1 },
    4: { 4: 100, 3: 5 },
    5: { 5: 300, 4: 15, 3: 2 },
    6: { 6: 1000,5: 50, 4: 8,  3: 2 },
  },
}

function DiamondIcon({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  return (
    <svg viewBox="0 0 32 32" className={cls} fill="none">
      <polygon points="16,2 30,11 16,30 2,11" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points="16,2 30,11 16,16"  fill="#60a5fa" opacity="0.7" />
      <polygon points="2,11 16,16 16,30"  fill="#1d4ed8" opacity="0.6" />
      <line x1="2" y1="11" x2="30" y2="11" stroke="#93c5fd" strokeWidth="0.8" opacity="0.5" />
      <circle cx="25" cy="7"  r="1"   fill="#bfdbfe" opacity="0.9" />
      <circle cx="7"  cy="8"  r="0.7" fill="#bfdbfe" opacity="0.7" />
    </svg>
  )
}

export default function KenoPage() {
  const [mode, setMode]             = useState<'manual' | 'auto'>('manual')
  const [wager, setWager]           = useState(100)
  const [risk, setRisk]             = useState<Risk>('classic')
  const [picks, setPicks]           = useState<Set<number>>(new Set())
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([])
  const [revealedDrawn, setRevealedDrawn] = useState<Set<number>>(new Set())
  const [matched, setMatched]       = useState(0)
  const [multiplier, setMultiplier] = useState(0)
  const [payout, setPayout]         = useState(0)
  const [isPlaying, setIsPlaying]   = useState(false)
  const [hasResult, setHasResult]   = useState(false)
  const [loading, setLoading]       = useState(false)
  const [showControls, setShowControls] = useState(false)

  // Auto mode
  const [autoBets, setAutoBets]         = useState(10)
  const [autoStopWin, setAutoStopWin]   = useState<number | ''>('')
  const [autoStopLoss, setAutoStopLoss] = useState<number | ''>('')
  const [autoRunning, setAutoRunning]   = useState(false)
  const [autoCount, setAutoCount]       = useState(0)
  const autoRef = useRef(false)
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const drawnSet       = new Set(drawnNumbers)
  const activeDrawnSet = isPlaying ? revealedDrawn : (hasResult ? drawnSet : new Set<number>())
  const profit         = payout - wager

  const togglePick = useCallback((n: number) => {
    if (isPlaying || loading || autoRunning) return
    setPicks(prev => {
      const next = new Set(prev)
      if (next.has(n)) { next.delete(n); return next }
      if (next.size >= 6) return prev
      next.add(n); return next
    })
  }, [isPlaying, loading, autoRunning])

  const autoPick = () => {
    const nums = Array.from({ length: TOTAL }, (_, i) => i + 1).sort(() => Math.random() - 0.5)
    setPicks(new Set(nums.slice(0, 6)))
  }

  const clearTable = () => {
    if (isPlaying || loading || autoRunning) return
    setPicks(new Set()); setHasResult(false)
    setDrawnNumbers([]); setRevealedDrawn(new Set())
  }

  const resetResult = () => {
    if (animRef.current) clearTimeout(animRef.current)
    setHasResult(false); setDrawnNumbers([]); setRevealedDrawn(new Set())
    setMatched(0); setMultiplier(0); setPayout(0); setIsPlaying(false)
  }

  const runBet = useCallback(async (currentWager: number): Promise<{ profit: number; payout: number } | null> => {
    setLoading(true); setHasResult(false)
    setRevealedDrawn(new Set()); setDrawnNumbers([])

    const res = await fetch('/api/games/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: 'keno', wager: currentWager, gameData: { picks: Array.from(picks), risk } }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.error) return null

    const drawn: number[] = data.result.drawn
    setDrawnNumbers(drawn); setMatched(data.result.matched)
    setMultiplier(data.result.multiplier); setPayout(data.payout)
    setIsPlaying(true)

    await new Promise<void>(resolve => {
      let i = 0
      const reveal = () => {
        if (i >= drawn.length) {
          setHasResult(true); setIsPlaying(false)
          mutate('/api/games/profile'); mutate('/api/games/history')
          resolve(); return
        }
        setRevealedDrawn(prev => new Set([...prev, drawn[i]])); i++
        animRef.current = setTimeout(reveal, 90)
      }
      animRef.current = setTimeout(reveal, 120)
    })
    return { profit: data.profit, payout: data.payout }
  }, [picks, risk])

  const placeBet = async () => {
    if (picks.size === 0 || loading || isPlaying) return
    resetResult(); await runBet(wager)
  }

  const startAuto = async () => {
    if (picks.size === 0 || autoRunning) return
    autoRef.current = true; setAutoRunning(true); setAutoCount(0)
    let totalProfit = 0; let count = 0
    while (autoRef.current && count < autoBets) {
      resetResult()
      const result = await runBet(wager)
      if (!result) break
      totalProfit += result.profit; count++; setAutoCount(count)
      if (autoStopWin !== '' && totalProfit >= Number(autoStopWin)) break
      if (autoStopLoss !== '' && totalProfit <= -Number(autoStopLoss)) break
      await new Promise(r => setTimeout(r, 600))
    }
    autoRef.current = false; setAutoRunning(false)
  }

  const stopAuto = () => { autoRef.current = false; setAutoRunning(false) }

  const payoutTable   = picks.size > 0 ? MULTIPLIERS[risk]?.[picks.size] : null
  const payoutEntries = payoutTable
    ? Object.entries(payoutTable).map(([h, m]) => ({ hits: parseInt(h), mult: m })).sort((a, b) => a.hits - b.hits)
    : []

  const isDisabled = isPlaying || loading || autoRunning

  // ── Controls Panel (shared between desktop sidebar + mobile drawer) ──────
  const ControlsPanel = () => (
    <div className="flex flex-col gap-3 p-4">
      {/* Manual / Auto tabs */}
      <div className="flex rounded-lg border border-border bg-muted p-1 gap-1">
        {(['manual', 'auto'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={cn('flex-1 h-8 rounded-md text-sm font-semibold capitalize transition-all',
              mode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* Bet Amount */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Bet Amount</p>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-mono">pts</span>
          <Input type="number" min={1} max={5000} value={wager}
            onChange={e => setWager(Math.max(1, Math.min(5000, parseInt(e.target.value) || 1)))}
            disabled={isDisabled} className="pl-10 h-10 text-sm font-mono" />
        </div>
        <div className="flex gap-1 mt-1.5">
          {[['1/2', () => setWager(v => Math.max(1, Math.floor(v / 2)))], ['x2', () => setWager(v => Math.min(5000, v * 2))], ['Max', () => setWager(5000)]].map(([label, fn]) => (
            <button key={label as string} onClick={fn as () => void} disabled={isDisabled}
              className="flex-1 h-9 rounded-md bg-muted border border-border text-muted-foreground text-xs hover:text-foreground transition-colors disabled:opacity-40">
              {label as string}
            </button>
          ))}
            <button onClick={() => setWager(5000)} disabled={isDisabled}
            className="flex-1 h-9 rounded-md bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 disabled:opacity-40">
            Max
          </button>
        </div>
      </div>

      {/* Risk */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Risk</p>
        <div className="relative">
          <select value={risk} onChange={e => setRisk(e.target.value as Risk)} disabled={isDisabled}
            className="w-full h-10 rounded-lg bg-input border border-border text-foreground text-sm px-3 appearance-none cursor-pointer disabled:opacity-40 focus:outline-none focus:border-primary/50">
            <option value="classic">Classic</option>
            <option value="low">Low</option>
            <option value="high">High</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Auto options */}
      {mode === 'auto' && (
        <div className="space-y-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Number of Bets</p>
            <Input type="number" min={1} max={500} value={autoBets}
              onChange={e => setAutoBets(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={autoRunning} className="h-10 text-sm font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Stop on Win</p>
              <Input type="number" min={0} placeholder="Off" value={autoStopWin}
                onChange={e => setAutoStopWin(e.target.value === '' ? '' : parseInt(e.target.value))}
                disabled={autoRunning} className="h-10 text-sm font-mono" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Stop on Loss</p>
              <Input type="number" min={0} placeholder="Off" value={autoStopLoss}
                onChange={e => setAutoStopLoss(e.target.value === '' ? '' : parseInt(e.target.value))}
                disabled={autoRunning} className="h-10 text-sm font-mono" />
            </div>
          </div>
          {autoRunning && (
            <p className="text-xs text-muted-foreground text-center">{autoCount} / {autoBets} bets</p>
          )}
        </div>
      )}

      {/* Auto Pick / Clear */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={autoPick} disabled={isDisabled}
          className="h-10 rounded-lg bg-muted border border-border text-muted-foreground text-sm hover:bg-secondary hover:text-foreground transition-all disabled:opacity-40">
          Auto Pick
        </button>
        <button onClick={clearTable} disabled={isDisabled}
          className="h-10 rounded-lg bg-muted border border-border text-muted-foreground text-sm hover:bg-secondary hover:text-foreground transition-all disabled:opacity-40">
          Clear
        </button>
      </div>
    </div>
  )

  return (
    <GameLayout title="Keno">
      <div className="flex flex-col md:flex-row h-full min-h-[calc(100vh-56px)] bg-background">

        {/* ── Desktop Sidebar ── */}
        <aside className="hidden md:flex w-[260px] shrink-0 bg-card border-r border-border flex-col">
          <ControlsPanel />

          {/* Result banner — desktop */}
          {hasResult && (
            <div className={cn('mx-4 mb-3 rounded-xl border p-3 text-center',
              multiplier > 0 ? 'border-primary/40 bg-primary/10' : 'border-destructive/30 bg-destructive/10')}>
              <p className="text-[11px] text-muted-foreground mb-0.5">{matched}/{picks.size} matched</p>
              <p className={cn('text-2xl font-extrabold tracking-tight', multiplier > 0 ? 'text-primary' : 'text-destructive')}>
                {multiplier > 0 ? `${multiplier}x` : 'No win'}
              </p>
              <p className={cn('text-sm font-mono font-semibold', profit > 0 ? 'text-primary' : 'text-destructive')}>
                {profit > 0 ? `+${profit.toLocaleString()}` : profit.toLocaleString()} pts
              </p>
            </div>
          )}

          {/* Bet button — desktop */}
          <div className="px-4 pb-4 mt-auto">
            {mode === 'manual' ? (
              <button onClick={hasResult ? resetResult : placeBet}
                disabled={loading || isPlaying || picks.size === 0}
                className={cn('w-full h-11 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed',
                  hasResult ? 'bg-secondary border border-border text-foreground hover:bg-muted' : 'bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25')}>
                {(loading || isPlaying) ? <Loader2 className="h-5 w-5 animate-spin" /> : hasResult ? 'Bet Again' : 'Place Bet'}
              </button>
            ) : autoRunning ? (
              <button onClick={stopAuto} className="w-full h-11 rounded-xl font-bold text-sm bg-destructive text-destructive-foreground hover:opacity-90 transition-all">
                Stop Auto ({autoCount}/{autoBets})
              </button>
            ) : (
              <button onClick={startAuto} disabled={picks.size === 0 || isPlaying || loading}
                className="w-full h-11 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                {(loading || isPlaying) ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Start Auto'}
              </button>
            )}
          </div>
        </aside>

        {/* ── Game Board ── */}
        <div className="flex-1 flex flex-col p-3 md:p-5 gap-3 pb-32 md:pb-5">

          {/* Result banner — mobile (inline above grid) */}
          {hasResult && (
            <div className={cn('md:hidden rounded-xl border p-3 flex items-center justify-between',
              multiplier > 0 ? 'border-primary/40 bg-primary/10' : 'border-destructive/30 bg-destructive/10')}>
              <div>
                <p className="text-[11px] text-muted-foreground">{matched}/{picks.size} matched</p>
                <p className={cn('text-xl font-extrabold', multiplier > 0 ? 'text-primary' : 'text-destructive')}>
                  {multiplier > 0 ? `${multiplier}x` : 'No win'}
                </p>
              </div>
              <p className={cn('text-lg font-mono font-bold', profit > 0 ? 'text-primary' : 'text-destructive')}>
                {profit > 0 ? `+${profit.toLocaleString()}` : profit.toLocaleString()} pts
              </p>
            </div>
          )}

          {/* 30-number grid — 6×5, scales on mobile */}
          <div className="grid gap-1.5 md:gap-2" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
            {Array.from({ length: TOTAL }, (_, i) => i + 1).map(n => {
              const isPicked        = picks.has(n)
              const isRevealedDrawn = activeDrawnSet.has(n)
              const isHit           = isPicked && isRevealedDrawn
              const isMiss          = isPicked && hasResult && !drawnSet.has(n)
              const isDrawnOnly     = !isPicked && isRevealedDrawn

              return (
                <button key={n} onClick={() => togglePick(n)} disabled={isDisabled}
                  // min 44px touch target via min-h
                  className={cn(
                    'min-h-[44px] md:min-h-[60px] lg:min-h-[72px] w-full rounded-xl font-bold text-sm md:text-base',
                    'flex items-center justify-center border relative select-none transition-all duration-150 disabled:cursor-default',
                    !isPicked && !isRevealedDrawn &&
                      'bg-card border-border text-muted-foreground hover:bg-secondary hover:border-primary/30 hover:text-foreground',
                    isPicked && !isHit && !isMiss &&
                      'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/20',
                    isDrawnOnly &&
                      'bg-card border-border text-destructive',
                    isHit &&
                      'bg-primary/25 border-primary text-primary shadow-xl shadow-primary/30 scale-[1.04] z-10 animate-pulse-once',
                    isMiss &&
                      'bg-primary/5 border-primary/20 text-primary/25',
                  )}>
                  {isHit ? <DiamondIcon size="sm" /> : <span className={cn('font-bold', isDrawnOnly && 'text-destructive')}>{n}</span>}
                </button>
              )
            })}
          </div>

          {/* Payout multiplier strip */}
          {payoutEntries.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {payoutEntries.map(({ hits, mult }) => {
                const isWin = hasResult && hits === matched && mult > 0
                return (
                  <div key={hits} className={cn(
                    'flex flex-col items-center min-w-[50px] px-2 py-1 rounded-xl border text-center transition-all',
                    isWin ? 'border-primary bg-primary/20 text-foreground shadow-md shadow-primary/20'
                      : mult > 0 ? 'border-dashed border-border bg-transparent text-muted-foreground'
                      : 'border-transparent bg-transparent text-muted-foreground/30'
                  )}>
                    <span className={cn('text-xs font-bold', isWin && 'text-primary')}>{mult > 0 ? `${mult}x` : '0x'}</span>
                    <span className="text-[10px] opacity-60">{hits} hit</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Mobile Bottom Bar ── */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border">
          {/* Drawer: controls panel */}
          {showControls && (
            <div className="max-h-[60vh] overflow-y-auto border-b border-border">
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <span className="text-sm font-bold">Settings</span>
                <button onClick={() => setShowControls(false)} className="p-1 rounded-md hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ControlsPanel />
            </div>
          )}

          {/* Bottom action row */}
          <div className="flex items-center gap-2 p-3">
            {/* Settings toggle */}
            <button onClick={() => setShowControls(v => !v)}
              className={cn('h-12 w-12 shrink-0 rounded-xl border flex items-center justify-center transition-all',
                showControls ? 'bg-primary/20 border-primary text-primary' : 'bg-muted border-border text-muted-foreground hover:text-foreground')}>
              <SlidersHorizontal className="h-5 w-5" />
            </button>

            {/* Wager quick-input */}
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-mono">pts</span>
              <Input type="number" min={1} value={wager}
                onChange={e => setWager(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={isDisabled} className="pl-10 h-12 text-sm font-mono" />
            </div>

            {/* Place Bet / Auto button */}
            {mode === 'manual' ? (
              <button onClick={hasResult ? resetResult : placeBet}
                disabled={loading || isPlaying || picks.size === 0}
                className={cn('h-12 px-5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 shrink-0',
                  hasResult ? 'bg-secondary border border-border text-foreground' : 'bg-primary text-primary-foreground shadow-lg shadow-primary/25')}>
                {(loading || isPlaying) ? <Loader2 className="h-5 w-5 animate-spin" /> : hasResult ? 'Again' : 'Bet'}
              </button>
            ) : autoRunning ? (
              <button onClick={stopAuto}
                className="h-12 px-5 rounded-xl font-bold text-sm bg-destructive text-destructive-foreground shrink-0">
                Stop
              </button>
            ) : (
              <button onClick={startAuto} disabled={picks.size === 0 || isPlaying || loading}
                className="h-12 px-5 rounded-xl font-bold text-sm bg-primary text-primary-foreground disabled:opacity-40 flex items-center justify-center shrink-0">
                {(loading || isPlaying) ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Auto'}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-once {
          0%   { transform: scale(1.04); box-shadow: 0 0 0 0 rgba(99,140,255,0.5); }
          50%  { transform: scale(1.10); box-shadow: 0 0 0 8px rgba(99,140,255,0); }
          100% { transform: scale(1.04); box-shadow: 0 0 0 0 rgba(99,140,255,0); }
        }
        .animate-pulse-once { animation: pulse-once 0.6s ease-out; }
      `}</style>
    </GameLayout>
  )
}
