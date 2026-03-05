'use client'

import { useState, useCallback, useRef } from 'react'
import { mutate } from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { GameLayout } from '@/components/games/game-layout'
import { cn } from '@/lib/utils'
import {
  buildDeck, shuffleDeck, handTotal, isBust, isBlackjack,
  dealerShouldHit, resolveOutcome, cardsToWire,
  type Card, type Phase, type Outcome,
} from '@/lib/games/blackjack-engine'

// ── Suit helpers ──────────────────────────────────────────────────────────────
const SUIT_SYMBOLS: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' }
const RED_SUITS = new Set(['H', 'D'])

// ── Playing Card visual ───────────────────────────────────────────────────────
function PlayingCard({ card, hidden = false, animIn = false, delay = 0 }: {
  card: Card; hidden?: boolean; animIn?: boolean; delay?: number
}) {
  const red = RED_SUITS.has(card.suit)
  const sym = SUIT_SYMBOLS[card.suit]

  const baseClass = cn(
    'w-[58px] h-[82px] md:w-[68px] md:h-[96px] rounded-xl border-2 shadow-2xl select-none flex-shrink-0 relative',
    animIn && 'animate-deal',
  )

  if (hidden) {
    return (
      <div
        className={cn(baseClass, 'border-[#2a4070] bg-[#0f1e3a]')}
        style={{ animationDelay: `${delay}ms` }}
      >
        {/* Card back pattern */}
        <div className="absolute inset-[6px] rounded-lg border border-[#1e3060]/70 bg-[#0a1628]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[#1e3060] text-2xl font-black select-none">✦</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(baseClass, 'bg-white', red ? 'border-red-200' : 'border-slate-200')}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top-left rank + suit */}
      <div className={cn('absolute top-1.5 left-1.5 flex flex-col items-center leading-none', red ? 'text-red-600' : 'text-slate-900')}>
        <span className="text-[13px] font-extrabold leading-none">{card.rank}</span>
        <span className="text-[11px] leading-none">{sym}</span>
      </div>
      {/* Center suit */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('text-[28px] md:text-[32px]', red ? 'text-red-500' : 'text-slate-700')}>{sym}</span>
      </div>
      {/* Bottom-right rank + suit (rotated) */}
      <div className={cn('absolute bottom-1.5 right-1.5 flex flex-col items-center leading-none rotate-180', red ? 'text-red-600' : 'text-slate-900')}>
        <span className="text-[13px] font-extrabold leading-none">{card.rank}</span>
        <span className="text-[11px] leading-none">{sym}</span>
      </div>
    </div>
  )
}

// ── Hand badge ────────────────────────────────────────────────────────────────
function HandBadge({ cards, hide2nd = false, bust, bj }: {
  cards: Card[]; hide2nd?: boolean; bust?: boolean; bj?: boolean
}) {
  const visible = hide2nd ? [cards[0]] : cards
  const { total } = handTotal(visible)
  return (
    <span className={cn(
      'text-[11px] font-bold px-2.5 py-0.5 rounded-full border',
      bust  ? 'bg-red-900/60 text-red-300 border-red-500/50' :
      bj    ? 'bg-yellow-900/60 text-yellow-300 border-yellow-500/50' :
              'bg-black/50 text-white/80 border-white/10'
    )}>
      {hide2nd ? `${total}+?` : total}
    </span>
  )
}

// ── Chips ─────────────────────────────────────────────────────────────────────
const CHIPS = [
  { value: 50,   label: '50',  cls: 'bg-red-600 hover:bg-red-500 border-red-400' },
  { value: 100,  label: '100', cls: 'bg-blue-600 hover:bg-blue-500 border-blue-400' },
  { value: 500,  label: '500', cls: 'bg-slate-600 hover:bg-slate-500 border-slate-400' },
  { value: 1000, label: '1K',  cls: 'bg-purple-700 hover:bg-purple-600 border-purple-400' },
]

// ── Outcome config ────────────────────────────────────────────────────────────
type OcConfig = { label: string; color: string; borderColor: string; sub: (w: number, p: number) => string }
const OC_CFG: Record<Outcome, OcConfig> = {
  blackjack:        { label: 'Blackjack!',       color: 'text-yellow-300', borderColor: 'border-yellow-500/60', sub: (_, p) => `+${p.toLocaleString()} pts` },
  win:              { label: 'You Win!',          color: 'text-blue-300',   borderColor: 'border-blue-500/60',   sub: (w, p) => `+${(p - w).toLocaleString()} pts` },
  dealer_bust:      { label: 'Dealer Busts!',    color: 'text-blue-300',   borderColor: 'border-blue-500/60',   sub: (w, p) => `+${(p - w).toLocaleString()} pts` },
  push:             { label: 'Push',              color: 'text-slate-300',  borderColor: 'border-slate-500/60',  sub: () => 'Wager returned' },
  bust:             { label: 'Bust!',             color: 'text-red-400',    borderColor: 'border-red-500/60',    sub: (w) => `-${w.toLocaleString()} pts` },
  lose:             { label: 'Dealer Wins',       color: 'text-red-400',    borderColor: 'border-red-500/60',    sub: (w) => `-${w.toLocaleString()} pts` },
  dealer_blackjack: { label: 'Dealer Blackjack',  color: 'text-red-400',    borderColor: 'border-red-500/60',    sub: (w) => `-${w.toLocaleString()} pts` },
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BlackjackPage() {
  const [wager, setWager]           = useState(100)
  const [phase, setPhase]           = useState<Phase>('BETTING')
  const shoeRef                     = useRef<Card[]>([])
  const [playerCards, setPlayer]    = useState<Card[]>([])
  const [dealerCards, setDealer]    = useState<Card[]>([])
  const [holeHidden, setHoleHidden] = useState(true)
  const [doubled, setDoubled]       = useState(false)
  const [outcome, setOutcome]       = useState<Outcome | null>(null)
  const [payout, setPayout]         = useState(0)
  const [settling, setSettling]     = useState(false)
  // track index of newest card per hand for animation
  const [newPlayerIdx, setNewPlayerIdx] = useState<number | null>(null)
  const [newDealerIdx, setNewDealerIdx] = useState<number | null>(null)
  const wagerRef = useRef(wager)
  wagerRef.current = wager

  const draw = (): Card => shoeRef.current.shift()!

  // ── SETTLE ───────────────────────────────────────────────────────────────────
  const settle = useCallback(async (
    pHand: Card[], dHand: Card[], oc: Outcome, po: number, isDoubled: boolean, w: number
  ) => {
    setOutcome(oc)
    setPayout(po)
    setPhase('RESOLUTION')
    setSettling(true)
    try {
      await fetch('/api/games/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: 'blackjack', wager: w, outcome: oc, payout: po,
          playerHand: cardsToWire(pHand), dealerHand: cardsToWire(dHand), doubled: isDoubled,
        }),
      })
      mutate('/api/games/profile')
      mutate('/api/games/history')
    } finally {
      setSettling(false)
    }
  }, [])

  // ── DEALER TURN (recursive with animation delay) ───────────────────────────
  const runDealer = useCallback((
    pHand: Card[], dHand: Card[], isDoubled: boolean, w: number
  ) => {
    setPhase('DEALER_TURN')
    setHoleHidden(false)
    setNewDealerIdx(dHand.length - 1) // reveal hole card animation

    const loop = (current: Card[], delay: number) => {
      setTimeout(() => {
        if (dealerShouldHit(current)) {
          const card = draw()
          const next = [...current, card]
          setDealer(next)
          setNewDealerIdx(next.length - 1)
          loop(next, 600)
        } else {
          const { outcome: oc, payout: po } = resolveOutcome(pHand, current, w, isDoubled)
          settle(pHand, current, oc, po, isDoubled, w)
        }
      }, delay)
    }
    loop(dHand, 500)
  }, [settle])

  // ── DEAL (sequential animation: p1 → d1 → p2 → d2) ──────────────────────
  const deal = useCallback(() => {
    const w = wagerRef.current
    shoeRef.current = shuffleDeck(buildDeck())

    // Pre-draw all 4 cards
    const p1 = draw(), d1 = draw(), p2 = draw(), d2 = draw()
    const pFinal = [p1, p2]
    const dFinal = [d1, d2]

    setPlayer([]); setDealer([])
    setHoleHidden(true)
    setDoubled(false)
    setOutcome(null); setPayout(0)
    setNewPlayerIdx(null); setNewDealerIdx(null)
    setPhase('PLAYER_TURN')

    // Sequential deal with 220ms between each card
    setTimeout(() => { setPlayer([p1]);         setNewPlayerIdx(0) }, 50)
    setTimeout(() => { setDealer([d1]);          setNewDealerIdx(0) }, 270)
    setTimeout(() => { setPlayer([p1, p2]);      setNewPlayerIdx(1) }, 490)
    setTimeout(() => { setDealer([d1, d2]);      setNewDealerIdx(1) }, 710)

    // After deal, check for immediate blackjack
    setTimeout(() => {
      setNewPlayerIdx(null); setNewDealerIdx(null)
      const pBJ = isBlackjack(pFinal)
      const dBJ = isBlackjack(dFinal)
      if (pBJ || dBJ) {
        setHoleHidden(false)
        const { outcome: oc, payout: po } = resolveOutcome(pFinal, dFinal, w, false)
        settle(pFinal, dFinal, oc, po, false, w)
      }
    }, 900)
  }, [settle])

  // ── HIT ───────────────────────────────────────────────────────────────────
  const hit = useCallback((pHand: Card[], dHand: Card[], isDoubled: boolean, w: number) => {
    const card = draw()
    const next = [...pHand, card]
    setPlayer(next)
    setNewPlayerIdx(next.length - 1)

    const bust = isBust(next)
    const is21 = handTotal(next).total === 21

    if (bust || is21 || isDoubled) {
      setTimeout(() => runDealer(next, dHand, isDoubled, w), 450)
    }
    // else stay in PLAYER_TURN
  }, [runDealer])

  // ── STAND ─────────────────────────────────────────────────────────────────
  const stand = useCallback((pHand: Card[], dHand: Card[], w: number) => {
    runDealer(pHand, dHand, false, w)
  }, [runDealer])

  // ── DOUBLE ────────────────────────────────────────────────────────────────
  const doubleDown = useCallback((pHand: Card[], dHand: Card[], w: number) => {
    setDoubled(true)
    setPhase('DEALER_TURN') // lock buttons immediately
    hit(pHand, dHand, true, w)
  }, [hit])

  const reset = () => {
    setPhase('BETTING')
    setPlayer([]); setDealer([])
    setOutcome(null); setPayout(0)
    setDoubled(false); setHoleHidden(true)
    setNewPlayerIdx(null); setNewDealerIdx(null)
  }

  const canAct    = phase === 'PLAYER_TURN'
  const canDouble = canAct && playerCards.length === 2
  const effWager  = doubled ? wager * 2 : wager
  const oc        = outcome ? OC_CFG[outcome] : null
  const pBust     = isBust(playerCards)
  const pBJ       = isBlackjack(playerCards)
  const dBust     = !holeHidden && isBust(dealerCards)

  return (
    <GameLayout title="Blackjack">
      <style>{`
        @keyframes deal {
          from { opacity:0; transform:translateY(-24px) scale(0.88) rotate(-4deg); }
          to   { opacity:1; transform:translateY(0)    scale(1)    rotate(0deg); }
        }
        .animate-deal { animation: deal 0.28s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <div className="relative flex flex-col min-h-[calc(100vh-120px)] bg-[#071428] overflow-hidden">

        {/* Table felt — dark navy green tint center glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,#0a2218_0%,#071428_100%)] pointer-events-none" />

        {/* Subtle felt texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage:'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize:'4px 4px' }} />

        {/* Table oval */}
        <div className="absolute inset-4 rounded-[50%/20%] border border-[#1a3a50]/40 pointer-events-none" />

        <div className="relative flex flex-col flex-1 px-4 md:px-12 pt-8 pb-2">

          {/* ── DEALER HAND ─────────────────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/35 font-semibold">Dealer</span>
              {dealerCards.length > 0 && (
                <HandBadge cards={dealerCards} hide2nd={holeHidden} bust={dBust} />
              )}
            </div>
            <div className="flex items-end justify-center min-h-[96px]" style={{ gap: '8px' }}>
              {dealerCards.length === 0 ? (
                <div className="w-[58px] h-[82px] rounded-xl border border-dashed border-white/8" />
              ) : (
                dealerCards.map((c, i) => (
                  <PlayingCard
                    key={`d-${i}-${c.rank}${c.suit}`}
                    card={c}
                    hidden={holeHidden && i === dealerCards.length - 1}
                    animIn={newDealerIdx === i}
                  />
                ))
              )}
            </div>
          </div>

          {/* ── Center strip ──────────────────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-0.5 my-4">
            <p className="text-white/15 text-[9px] uppercase tracking-widest">Insurance pays 2 to 1</p>
            <p className="text-white/20 text-[10px] uppercase tracking-widest font-semibold">Blackjack pays 3 to 2</p>
          </div>

          {/* ── OUTCOME overlay ────────────────────────────────────────────────── */}
          {oc && phase === 'RESOLUTION' && (
            <div className={cn(
              'absolute left-6 right-6 md:left-24 md:right-24 top-1/2 -translate-y-1/2 z-20',
              'rounded-2xl border-2 bg-[#0a1628]/95 backdrop-blur-md p-6 text-center shadow-2xl',
              oc.borderColor
            )}>
              <p className={cn('text-4xl md:text-5xl font-black mb-1 tracking-tight', oc.color)}>
                {oc.label}
              </p>
              {doubled && (
                <span className="inline-block text-[10px] font-bold tracking-widest uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full px-2 py-0.5 mb-2">
                  Doubled
                </span>
              )}
              <p className="text-white/50 text-lg font-semibold mt-1">
                {oc.sub(effWager, payout)}
              </p>
              <Button
                onClick={reset}
                disabled={settling}
                className="mt-5 px-8 h-11 text-base font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full border border-blue-400"
              >
                {settling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Deal Again'}
              </Button>
            </div>
          )}

          {/* ── PLAYER HAND ─────────────────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-2 mt-auto mb-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/35 font-semibold">Your Hand</span>
              {playerCards.length > 0 && (
                <HandBadge cards={playerCards} bust={pBust} bj={pBJ} />
              )}
              {doubled && (
                <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">Doubled</span>
              )}
            </div>
            <div
              className={cn(
                'flex items-end justify-center min-h-[96px] rounded-2xl px-4 py-2 transition-all',
                canAct && 'ring-1 ring-blue-500/25 bg-blue-950/10',
              )}
              style={{ gap: '8px' }}
            >
              {playerCards.length === 0 ? (
                <div className="w-[58px] h-[82px] rounded-xl border border-dashed border-white/8" />
              ) : (
                playerCards.map((c, i) => (
                  <PlayingCard
                    key={`p-${i}-${c.rank}${c.suit}`}
                    card={c}
                    animIn={newPlayerIdx === i}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── BOTTOM CONTROLS ─────────────────────────────────────────────────── */}
        <div className="bg-[#060f1f]/95 border-t border-[#0f2040] px-4 py-4 space-y-3">

          {/* Wager row — BETTING phase */}
          {phase === 'BETTING' && (
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="text-white/30 text-[10px] font-semibold uppercase tracking-widest">Wager</span>
              <div className="flex items-center bg-[#0a1628] border border-white/10 rounded-lg overflow-hidden">
                <span className="text-white/30 text-xs px-2 font-mono">pts</span>
                <Input
                  type="number" min={1} max={20000}
                  value={wager}
                  onChange={e => setWager(Math.max(1, Math.min(20000, parseInt(e.target.value) || 1)))}
                  className="w-20 h-8 text-sm text-center bg-transparent border-0 text-white focus-visible:ring-0"
                />
              </div>
              {CHIPS.map(chip => (
                <button
                  key={chip.value}
                  onClick={() => setWager(chip.value)}
                  className={cn(
                    'w-12 h-12 rounded-full font-bold text-xs border-2 transition-all text-white shadow-lg',
                    chip.cls,
                    wager === chip.value && 'ring-2 ring-white/40 ring-offset-1 ring-offset-[#060f1f] scale-110'
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Wager display during hand */}
          {phase !== 'BETTING' && phase !== 'RESOLUTION' && (
            <div className="flex justify-center">
              <span className="text-white/30 text-[11px] font-mono">
                Wager: <span className="text-white/60 font-bold">{effWager.toLocaleString()} pts</span>
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-2 max-w-sm mx-auto">
            {phase === 'BETTING' && (
              <button
                onClick={deal}
                className="w-full h-12 rounded-xl font-bold text-base bg-blue-600 hover:bg-blue-500 border-2 border-blue-400 text-white transition-all active:scale-[0.97]"
              >
                Deal
              </button>
            )}

            {canAct && (
              <>
                <button
                  onClick={() => hit(playerCards, dealerCards, false, wager)}
                  className="flex-1 h-12 rounded-xl font-bold text-sm border-2 bg-emerald-700 hover:bg-emerald-600 border-emerald-500 text-white transition-all active:scale-[0.97] flex items-center justify-center gap-1"
                >
                  Hit <span className="opacity-50 text-xs">↗</span>
                </button>
                <button
                  onClick={() => stand(playerCards, dealerCards, wager)}
                  className="flex-1 h-12 rounded-xl font-bold text-sm border-2 bg-red-700 hover:bg-red-600 border-red-500 text-white transition-all active:scale-[0.97] flex items-center justify-center gap-1"
                >
                  Stand <span className="opacity-50 text-xs">✋</span>
                </button>
                {canDouble && (
                  <button
                    onClick={() => doubleDown(playerCards, dealerCards, wager)}
                    className="flex-1 h-12 rounded-xl font-bold text-sm border-2 bg-amber-600 hover:bg-amber-500 border-amber-400 text-white transition-all active:scale-[0.97] flex items-center justify-center gap-1"
                  >
                    Double <span className="text-xs font-normal opacity-60">2×</span>
                  </button>
                )}
              </>
            )}

            {phase === 'DEALER_TURN' && (
              <div className="flex items-center gap-2 text-white/30 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Dealer is playing…
              </div>
            )}
          </div>

          <p className="text-center text-white/10 text-[9px] uppercase tracking-widest">
            Dealer stands soft 17 · Blackjack pays 3:2 · Max 20,000 pts
          </p>
        </div>
      </div>
    </GameLayout>
  )
}
