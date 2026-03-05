'use client'

import { useState, useEffect } from 'react'
import { mutate } from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { GameLayout } from '@/components/games/game-layout'
import { cn } from '@/lib/utils'

// ── Card helpers ─────────────────────────────────────────────────────────────
const SUIT_SYMBOLS: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' }
const RED_SUITS = new Set(['H', 'D'])
function rank(card: string) { return card.slice(0, -1) }
function suit(card: string) { return card.slice(-1) }
function isRed(card: string) { return RED_SUITS.has(suit(card)) }

function handTotal(cards: string[]) {
  let total = 0; let aces = 0
  for (const c of cards) {
    const r = rank(c)
    if (['J', 'Q', 'K'].includes(r)) total += 10
    else if (r === 'A') { total += 11; aces++ }
    else total += parseInt(r)
  }
  while (total > 21 && aces > 0) { total -= 10; aces-- }
  return total
}

// ── Playing Card component ────────────────────────────────────────────────────
function PlayingCard({ card, hidden = false, delay = 0 }: { card: string; hidden?: boolean; delay?: number }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  if (!visible) return (
    <div className="w-16 h-24 md:w-20 md:h-28 rounded-xl border-2 border-border/20 bg-[#1a2744] opacity-0" />
  )

  if (hidden) {
    return (
      <div className={cn(
        'w-16 h-24 md:w-20 md:h-28 rounded-xl border-2 border-[#2a3f6a] bg-[#1a2744]',
        'flex items-center justify-center shadow-lg',
        'transition-all duration-300 opacity-100 translate-y-0',
      )}>
        <div className="w-10 h-14 md:w-12 md:h-18 rounded-lg border border-[#3a5080]/50 bg-[#162040] flex items-center justify-center">
          <span className="text-[#3a5080] text-2xl font-bold select-none">A</span>
        </div>
      </div>
    )
  }

  const r = rank(card)
  const s = suit(card)
  const red = isRed(card)

  return (
    <div className={cn(
      'w-16 h-24 md:w-20 md:h-28 rounded-xl border-2 bg-white shadow-lg',
      'flex flex-col p-1.5 select-none relative',
      'transition-all duration-300 opacity-100',
      red ? 'border-red-200 text-red-500' : 'border-slate-200 text-slate-800',
    )}>
      {/* Top-left rank+suit */}
      <div className="flex flex-col items-start leading-none">
        <span className="text-sm md:text-base font-extrabold leading-none">{r}</span>
        <span className="text-xs md:text-sm leading-none">{SUIT_SYMBOLS[s]}</span>
      </div>
      {/* Center suit */}
      <div className="flex-1 flex items-center justify-center">
        <span className="text-2xl md:text-3xl">{SUIT_SYMBOLS[s]}</span>
      </div>
      {/* Bottom-right (rotated) */}
      <div className="flex flex-col items-end leading-none rotate-180">
        <span className="text-sm md:text-base font-extrabold leading-none">{r}</span>
        <span className="text-xs md:text-sm leading-none">{SUIT_SYMBOLS[s]}</span>
      </div>
    </div>
  )
}

// ── Chip button ───────────────────────────────────────────────────────────────
const CHIPS = [
  { value: 50,   label: '50',   bg: 'bg-red-600 hover:bg-red-500 border-red-400 text-white' },
  { value: 100,  label: '100',  bg: 'bg-green-600 hover:bg-green-500 border-green-400 text-white' },
  { value: 500,  label: '500',  bg: 'bg-slate-800 hover:bg-slate-700 border-slate-500 text-white' },
  { value: 1000, label: '1K',   bg: 'bg-purple-700 hover:bg-purple-600 border-purple-400 text-white' },
]

// ── Outcome config ────────────────────────────────────────────────────────────
const OUTCOMES: Record<string, { label: string; sub: (pts: number, w: number) => string; color: string; bg: string }> = {
  blackjack:        { label: 'Blackjack!', sub: (p) => `+${p.toLocaleString()} pts`, color: 'text-yellow-300', bg: 'from-yellow-950/90 to-yellow-900/80 border-yellow-500/40' },
  win:              { label: 'You Win!', sub: (p, w) => `+${(p - w).toLocaleString()} pts`, color: 'text-green-300', bg: 'from-green-950/90 to-green-900/80 border-green-500/40' },
  dealer_bust:      { label: 'Dealer Bust!', sub: (p, w) => `+${(p - w).toLocaleString()} pts`, color: 'text-green-300', bg: 'from-green-950/90 to-green-900/80 border-green-500/40' },
  push:             { label: 'Push', sub: () => 'Wager returned', color: 'text-blue-300', bg: 'from-blue-950/90 to-blue-900/80 border-blue-500/40' },
  bust:             { label: 'Bust!', sub: (_, w) => `-${w.toLocaleString()} pts`, color: 'text-red-300', bg: 'from-red-950/90 to-red-900/80 border-red-500/40' },
  lose:             { label: 'Dealer Wins', sub: (_, w) => `-${w.toLocaleString()} pts`, color: 'text-red-300', bg: 'from-red-950/90 to-red-900/80 border-red-500/40' },
  dealer_blackjack: { label: 'Dealer Blackjack', sub: (_, w) => `-${w.toLocaleString()} pts`, color: 'text-red-300', bg: 'from-red-950/90 to-red-900/80 border-red-500/40' },
}

type GameState = 'idle' | 'done'

export default function BlackjackPage() {
  const [wager, setWager] = useState(100)
  const [state, setState] = useState<GameState>('idle')
  const [playerCards, setPlayerCards] = useState<string[]>([])
  const [dealerCards, setDealerCards] = useState<string[]>([])
  const [dealerHideSecond, setDealerHideSecond] = useState(false)
  const [outcome, setOutcome] = useState<string | null>(null)
  const [payout, setPayout] = useState(0)
  const [loading, setLoading] = useState(false)
  const [cardKey, setCardKey] = useState(0)

  const bet = async (action: 'stand' | 'hit' | 'double') => {
    setLoading(true)
    try {
      const res = await fetch('/api/games/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game: 'blackjack', wager, gameData: { action } }),
      })
      const data = await res.json()
      if (data.error) return

      setCardKey(k => k + 1)
      setPlayerCards(data.result.playerHand)
      setDealerCards(data.result.dealerHand)
      setDealerHideSecond(false)
      setOutcome(data.result.outcome)
      setPayout(data.payout)
      setState('done')
      mutate('/api/games/profile')
      mutate('/api/games/history')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setState('idle')
    setPlayerCards([])
    setDealerCards([])
    setOutcome(null)
    setPayout(0)
    setDealerHideSecond(false)
  }

  // Show a preview deal when user picks action — show 2 cards for player, 1+hidden for dealer
  const showPreview = (action: 'stand' | 'hit' | 'double') => {
    setDealerHideSecond(true)
    bet(action)
  }

  const oc = outcome ? OUTCOMES[outcome] : null
  const playerTotal = playerCards.length ? handTotal(playerCards) : null
  const dealerTotal = dealerCards.length && !dealerHideSecond ? handTotal(dealerCards) : null

  return (
    <GameLayout title="Blackjack">
      {/* Full dark table */}
      <div className="relative flex flex-col min-h-[calc(100vh-120px)] bg-[#0d1f0f]">

        {/* Felt texture overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 0px, transparent 50%)' ,backgroundSize:'4px 4px'}} />

        {/* Table oval border */}
        <div className="absolute inset-4 rounded-[50%/20%] border-2 border-[#1a4020]/60 pointer-events-none" />

        <div className="relative flex flex-col flex-1 px-6 pt-6 pb-0">

          {/* ── Dealer hand ── */}
          <div className="flex flex-col items-center gap-3 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-white/40 font-semibold">Dealer</span>
              {dealerTotal !== null && (
                <span className="bg-black/40 text-white/80 text-xs font-bold px-2 py-0.5 rounded-full border border-white/10">
                  {dealerTotal}
                </span>
              )}
            </div>
            <div className="flex gap-2 min-h-28 items-center">
              {dealerCards.length === 0 ? (
                <div className="w-16 h-24 md:w-20 md:h-28 rounded-xl border border-white/10 border-dashed flex items-center justify-center">
                  <span className="text-white/20 text-xs">Dealer</span>
                </div>
              ) : dealerCards.map((c, i) => (
                <PlayingCard key={`${cardKey}-d-${i}`} card={c} hidden={dealerHideSecond && i === 1} delay={i * 120} />
              ))}
            </div>
          </div>

          {/* ── Center info ── */}
          <div className="flex flex-col items-center gap-1 my-4">
            <p className="text-white/20 text-[10px] uppercase tracking-widest">Insurance pays 2 to 1</p>
            <p className="text-white/30 text-[11px] uppercase tracking-widest font-semibold">Blackjack pays 3 to 2</p>
          </div>

          {/* ── Outcome overlay ── */}
          {oc && state === 'done' && (
            <div className={cn(
              'absolute inset-x-6 top-1/2 -translate-y-1/2 z-10',
              'rounded-2xl border bg-gradient-to-br p-6 text-center',
              'shadow-2xl backdrop-blur-sm',
              oc.bg
            )}>
              <p className={cn('text-4xl font-extrabold mb-1', oc.color)}>{oc.label}</p>
              <p className="text-white/60 text-lg font-semibold">{oc.sub(payout, wager)}</p>
              <Button
                onClick={reset}
                className="mt-5 px-8 h-11 text-base font-bold bg-white text-black hover:bg-white/90 rounded-full"
              >
                Deal Again
              </Button>
            </div>
          )}

          {/* ── Player hand ── */}
          <div className="flex flex-col items-center gap-3 mt-auto mb-4">
            <div className="flex items-center gap-2">
              {payout > 0 && state === 'done' && (
                <span className="bg-black/50 text-white/50 text-xs font-mono px-2 py-0.5 rounded-full border border-white/10">
                  {wager.toLocaleString()} pts
                </span>
              )}
              <span className="text-xs uppercase tracking-widest text-white/40 font-semibold">Your Hand</span>
              {playerTotal !== null && (
                <span className={cn(
                  'text-xs font-bold px-2 py-0.5 rounded-full border',
                  playerTotal > 21 ? 'bg-red-900/60 text-red-300 border-red-500/40' :
                  playerTotal === 21 ? 'bg-yellow-900/60 text-yellow-300 border-yellow-500/40' :
                  'bg-black/40 text-white/80 border-white/10'
                )}>
                  {playerTotal}
                </span>
              )}
            </div>
            <div className={cn(
              'flex gap-2 min-h-28 items-center p-3 rounded-2xl transition-all',
              state === 'idle' && 'border-2 border-green-500/30'
            )}>
              {playerCards.length === 0 ? (
                <div className="w-16 h-24 md:w-20 md:h-28 rounded-xl border border-white/10 border-dashed flex items-center justify-center">
                  <span className="text-white/20 text-xs">Player</span>
                </div>
              ) : playerCards.map((c, i) => (
                <PlayingCard key={`${cardKey}-p-${i}`} card={c} delay={i * 150 + 80} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom controls bar ── */}
        <div className="bg-[#0a1a0c]/95 border-t border-[#1a3a1e] px-4 py-4 space-y-3">

          {/* Wager row */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-white/40 text-xs font-semibold uppercase tracking-widest mr-1">Wager</span>
            <Input
              type="number" min={1}
              value={wager}
              onChange={e => setWager(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={state !== 'idle' || loading}
              className="w-24 h-8 text-sm text-center bg-black/30 border-white/10 text-white"
            />
            {CHIPS.map(chip => (
              <button
                key={chip.value}
                disabled={state !== 'idle' || loading}
                onClick={() => setWager(chip.value)}
                className={cn(
                  'w-10 h-10 rounded-full font-bold text-xs border-2 transition-all shadow-md',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  chip.bg,
                  wager === chip.value && 'ring-2 ring-white/40 ring-offset-1 ring-offset-black scale-110'
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          {state === 'idle' && (
            <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
              <button
                onClick={() => showPreview('hit')}
                disabled={loading || wager < 1}
                className={cn(
                  'h-12 rounded-xl font-bold text-sm border-2 transition-all',
                  'bg-green-700 hover:bg-green-600 border-green-500 text-white',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  'flex items-center justify-center gap-1.5'
                )}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Hit <span className="opacity-60 text-lg">↗</span></>}
              </button>
              <button
                onClick={() => showPreview('stand')}
                disabled={loading || wager < 1}
                className={cn(
                  'h-12 rounded-xl font-bold text-sm border-2 transition-all',
                  'bg-red-700 hover:bg-red-600 border-red-500 text-white',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  'flex items-center justify-center gap-1.5'
                )}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Stand <span className="opacity-60 text-lg">✋</span></>}
              </button>
              <button
                onClick={() => showPreview('double')}
                disabled={loading || wager < 1}
                className={cn(
                  'h-12 rounded-xl font-bold text-sm border-2 transition-all',
                  'bg-amber-600 hover:bg-amber-500 border-amber-400 text-white',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  'flex items-center justify-center gap-1.5'
                )}
              >
                Double <span className="text-xs font-normal opacity-70">2x</span>
              </button>
            </div>
          )}

          {/* Rules */}
          <p className="text-center text-white/20 text-[10px] uppercase tracking-widest">
            Dealer stands soft 17 · Blackjack pays 1.5x · Max 20,000 pts
          </p>
        </div>
      </div>
    </GameLayout>
  )
}
