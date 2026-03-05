'use client'

import { useState, useCallback, useRef } from 'react'
import { mutate } from 'swr'
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

// ── Playing Card ──────────────────────────────────────────────────────────────
function PlayingCard({ card, hidden = false, animIn = false }: {
  card: Card; hidden?: boolean; animIn?: boolean
}) {
  const red = RED_SUITS.has(card.suit)
  const sym = SUIT_SYMBOLS[card.suit]

  if (hidden) {
    return (
      <div className={cn(
        'w-[84px] h-[116px] rounded-xl select-none flex-shrink-0 relative shadow-2xl',
        'border-2 border-[#1e3a6e] bg-[#0e1f3d]',
        animIn && 'animate-deal',
      )}>
        <div className="absolute inset-[5px] rounded-lg border border-[#1e3a6e]/60 bg-[#0a1628]" />
        <div className="absolute inset-0 flex items-center justify-center opacity-25">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <path d="M22 2L42 22L22 42L2 22Z" stroke="#4a7abf" strokeWidth="1.5" fill="none"/>
            <path d="M22 10L34 22L22 34L10 22Z" stroke="#4a7abf" strokeWidth="1" fill="none"/>
          </svg>
        </div>
        <div className="absolute top-2 left-3 text-[#2a5080] text-[12px] font-bold opacity-50">A</div>
      </div>
    )
  }

  return (
    <div className={cn(
      'w-[84px] h-[116px] rounded-xl select-none flex-shrink-0 relative shadow-2xl',
      'bg-white border border-gray-200',
      animIn && 'animate-deal',
    )}>
      {/* Top-left */}
      <div className={cn(
        'absolute top-2 left-2.5 flex flex-col items-center leading-none',
        red ? 'text-red-600' : 'text-[#1a1a2e]'
      )}>
        <span className="text-[14px] font-extrabold leading-none">{card.rank}</span>
        <span className="text-[11px] leading-none mt-0.5">{sym}</span>
      </div>
      {/* Center large suit */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('text-[38px]', red ? 'text-red-500' : 'text-[#1a1a2e]')}>{sym}</span>
      </div>
      {/* Bottom-right rotated */}
      <div className={cn(
        'absolute bottom-2 right-2.5 flex flex-col items-center leading-none rotate-180',
        red ? 'text-red-600' : 'text-[#1a1a2e]'
      )}>
        <span className="text-[14px] font-extrabold leading-none">{card.rank}</span>
        <span className="text-[11px] leading-none mt-0.5">{sym}</span>
      </div>
    </div>
  )
}

// ── Empty card placeholder ────────────────────────────────────────────────────
function EmptyCard() {
  return (
    <div className="w-[84px] h-[116px] rounded-xl border-2 border-dashed border-white/10 flex-shrink-0" />
  )
}

// ── Value badge ───────────────────────────────────────────────────────────────
function ValueBadge({ cards, hide2nd, bust, bj }: {
  cards: Card[]; hide2nd?: boolean; bust?: boolean; bj?: boolean
}) {
  const visible = hide2nd ? [cards[0]] : cards
  const { total } = handTotal(visible)
  return (
    <span className={cn(
      'text-[12px] font-bold px-2.5 py-0.5 rounded-md',
      bust ? 'bg-red-900/70 text-red-300' :
      bj   ? 'bg-yellow-800/70 text-yellow-200' :
             'bg-black/40 text-white/80'
    )}>
      {hide2nd ? `${total}+?` : total}
    </span>
  )
}

// ── Outcome config ────────────────────────────────────────────────────────────
type OcConfig = { label: string; color: string; bg: string; sub: (w: number, p: number) => string }
const OC_CFG: Record<Outcome, OcConfig> = {
  blackjack:        { label: 'Blackjack!',      color: 'text-yellow-300', bg: 'from-yellow-950/80 to-yellow-900/60 border-yellow-500/50', sub: (_, p) => `+${p.toLocaleString()} pts` },
  win:              { label: 'You Win!',         color: 'text-emerald-300',  bg: 'from-emerald-950/80 to-emerald-900/60 border-emerald-500/50',  sub: (w, p) => `+${(p - w).toLocaleString()} pts` },
  dealer_bust:      { label: 'Dealer Busts!',   color: 'text-emerald-300',  bg: 'from-emerald-950/80 to-emerald-900/60 border-emerald-500/50',  sub: (w, p) => `+${(p - w).toLocaleString()} pts` },
  push:             { label: 'Push',             color: 'text-slate-300',  bg: 'from-slate-900/80 to-slate-800/60 border-slate-500/40',  sub: () => 'Wager returned' },
  bust:             { label: 'Bust!',            color: 'text-red-400',    bg: 'from-red-950/80 to-red-900/60 border-red-500/50',    sub: (w) => `-${w.toLocaleString()} pts` },
  lose:             { label: 'Dealer Wins',      color: 'text-red-400',    bg: 'from-red-950/80 to-red-900/60 border-red-500/50',    sub: (w) => `-${w.toLocaleString()} pts` },
  dealer_blackjack: { label: 'Dealer Blackjack', color: 'text-red-400',    bg: 'from-red-950/80 to-red-900/60 border-red-500/50',    sub: (w) => `-${w.toLocaleString()} pts` },
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BlackjackPage() {
  const [wager, setWager]           = useState(100)
  const [wagerInput, setWagerInput] = useState('100')
  const [phase, setPhase]           = useState<Phase>('BETTING')
  const shoeRef                     = useRef<Card[]>([])
  const [playerCards, setPlayer]    = useState<Card[]>([])
  const [dealerCards, setDealer]    = useState<Card[]>([])
  const [holeHidden, setHoleHidden] = useState(true)
  const [doubled, setDoubled]       = useState(false)
  const [outcome, setOutcome]       = useState<Outcome | null>(null)
  const [payout, setPayout]         = useState(0)
  const [settling, setSettling]     = useState(false)
  const [newPlayerIdx, setNewPlayerIdx] = useState<number | null>(null)
  const [newDealerIdx, setNewDealerIdx] = useState<number | null>(null)
  const wagerRef = useRef(wager)
  wagerRef.current = wager

  const draw = (): Card => shoeRef.current.shift()!

  const adjustWager = (factor: number) => {
    const next = Math.max(1, Math.min(20000, factor < 1 ? Math.floor(wager * factor) : Math.min(20000, wager * factor)))
    setWager(next); setWagerInput(String(next))
  }
  const setMax = () => { setWager(20000); setWagerInput('20000') }

  // ── SETTLE ───────────────────────────────────────────────────────────────────
  const settle = useCallback(async (
    pHand: Card[], dHand: Card[], oc: Outcome, po: number, isDoubled: boolean, w: number
  ) => {
    setOutcome(oc); setPayout(po); setPhase('RESOLUTION'); setSettling(true)
    const effectiveW = isDoubled ? w * 2 : w
    try {
      await fetch('/api/games/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: 'blackjack', wager: effectiveW, outcome: oc, payout: po,
          playerHand: cardsToWire(pHand), dealerHand: cardsToWire(dHand), doubled: isDoubled,
        }),
      })
      mutate('/api/games/profile')
      mutate('/api/games/history')
    } finally { setSettling(false) }
  }, [])

  // ── DEALER TURN ───────────────────────────────────────────────────────────────
  const runDealer = useCallback((pHand: Card[], dHand: Card[], isDoubled: boolean, w: number) => {
    setPhase('DEALER_TURN')
    setHoleHidden(false)
    const loop = (current: Card[], delay: number) => {
      setTimeout(() => {
        if (dealerShouldHit(current)) {
          const card = draw()
          const next = [...current, card]
          setDealer(next); setNewDealerIdx(next.length - 1)
          loop(next, 780)
        } else {
          const { outcome: oc, payout: po } = resolveOutcome(pHand, current, w, isDoubled)
          settle(pHand, current, oc, po, isDoubled, w)
        }
      }, delay)
    }
    loop(dHand, 650)
  }, [settle])

  // ── DEAL ──────────────────────────────────────────────────────────────────────
  const deal = useCallback(() => {
    const w = wagerRef.current
    shoeRef.current = shuffleDeck(buildDeck())
    const p1 = draw(), d1 = draw(), p2 = draw(), d2 = draw()
    const pFinal = [p1, p2], dFinal = [d1, d2]
    setPlayer([]); setDealer([])
    setHoleHidden(true); setDoubled(false)
    setOutcome(null); setPayout(0)
    setNewPlayerIdx(null); setNewDealerIdx(null)
    setPhase('PLAYER_TURN')

    // Sequential deal: p1 → d1 → p2 → d2 with 450ms between each
    setTimeout(() => { setPlayer([p1]);         setNewPlayerIdx(0) }, 100)
    setTimeout(() => { setDealer([d1]);          setNewDealerIdx(0) }, 550)
    setTimeout(() => { setPlayer([p1, p2]);      setNewPlayerIdx(1) }, 1000)
    setTimeout(() => { setDealer([d1, d2]);      setNewDealerIdx(1) }, 1450)
    setTimeout(() => {
      setNewPlayerIdx(null); setNewDealerIdx(null)
      if (isBlackjack(pFinal) || isBlackjack(dFinal)) {
        setHoleHidden(false)
        const { outcome: oc, payout: po } = resolveOutcome(pFinal, dFinal, w, false)
        settle(pFinal, dFinal, oc, po, false, w)
      }
    }, 1900)
  }, [settle])

  // ── HIT ───────────────────────────────────────────────────────────────────────
  const hit = useCallback((pHand: Card[], dHand: Card[], isDoubled: boolean, w: number) => {
    const card = draw()
    const next = [...pHand, card]
    setPlayer(next); setNewPlayerIdx(next.length - 1)
    const bust = isBust(next)
    const is21 = handTotal(next).total === 21
    if (bust || is21 || isDoubled) setTimeout(() => runDealer(next, dHand, isDoubled, w), 650)
  }, [runDealer])

  // ── STAND ─────────────────────────────────────────────────────────────────────
  const stand = useCallback((pHand: Card[], dHand: Card[], w: number) => {
    runDealer(pHand, dHand, false, w)
  }, [runDealer])

  // ── DOUBLE ────────────────────────────────────────────────────────────────────
  const doubleDown = useCallback((pHand: Card[], dHand: Card[], w: number) => {
    setDoubled(true); setPhase('DEALER_TURN')
    hit(pHand, dHand, true, w)
  }, [hit])

  const reset = () => {
    setPhase('BETTING'); setPlayer([]); setDealer([])
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
  const inPlay    = phase !== 'BETTING' && phase !== 'RESOLUTION'

  return (
    <GameLayout title="Blackjack">
      <style>{`
        @keyframes deal {
          from { opacity: 0; transform: translateY(-40px) rotate(-6deg) scale(0.8); }
          to   { opacity: 1; transform: translateY(0)     rotate(0deg)  scale(1);   }
        }
        .animate-deal { animation: deal 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }

        @keyframes result-pop {
          0%   { opacity: 0; transform: scale(0.75) translateY(20px); }
          70%  { opacity: 1; transform: scale(1.04) translateY(-4px); }
          100% { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        .animate-result { animation: result-pop 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
      `}</style>

      <div className="flex flex-col min-h-[calc(100vh-56px)] bg-[#080e1a]">

        {/* ── FELT TABLE ─────────────────────────────────────────────────────────── */}
        <div className="relative flex-1 flex flex-col items-center justify-between py-8 px-4 overflow-hidden">

          {/* Felt background */}
          <div className="absolute inset-4 rounded-[3rem] bg-[#0f5132] shadow-inner pointer-events-none"
               style={{ boxShadow: 'inset 0 0 80px rgba(0,0,0,0.6), 0 0 0 6px #0a3d26, 0 0 0 10px #082e1c' }} />

          {/* Subtle felt texture overlay */}
          <div className="absolute inset-4 rounded-[3rem] opacity-[0.04] pointer-events-none"
               style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '8px 8px' }} />

          {/* Oval arc decoration */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[55%] h-[60%] rounded-full border border-[#1a7a4a]/40 pointer-events-none" />

          {/* ── DEALER HAND ────────────────────────────────────────────────────── */}
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.25em] text-white/40 font-semibold">Dealer</span>
              {dealerCards.length > 0 && (
                <ValueBadge cards={dealerCards} hide2nd={holeHidden} bust={dBust} />
              )}
            </div>
            <div className="flex items-end justify-center">
              {dealerCards.length === 0 ? (
                <EmptyCard />
              ) : (
                <div className="flex items-end">
                  {dealerCards.map((c, i) => (
                    <div key={`d-${i}-${c.rank}${c.suit}`}
                         style={{ marginLeft: i > 0 ? '-24px' : 0, zIndex: i }}>
                      <PlayingCard
                        card={c}
                        hidden={holeHidden && i === dealerCards.length - 1}
                        animIn={newDealerIdx === i}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── OUTCOME BANNER (in the center of the table) ─────────────────────── */}
          {oc && phase === 'RESOLUTION' && (
            <div className={cn(
              'relative z-30 animate-result rounded-2xl border-2 bg-gradient-to-b px-10 py-6 text-center shadow-2xl backdrop-blur-sm',
              oc.bg
            )}>
              <p className={cn('text-5xl md:text-6xl font-black tracking-tight mb-1', oc.color)}>
                {oc.label}
              </p>
              {doubled && (
                <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">Doubled</p>
              )}
              <p className="text-white/60 text-xl font-semibold mb-5">
                {oc.sub(effWager, payout)}
              </p>
              <button
                onClick={reset}
                disabled={settling}
                className="px-10 h-12 rounded-full font-bold text-sm bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all"
              >
                {settling ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Deal Again'}
              </button>
            </div>
          )}

          {/* ── PLAYER HAND ────────────────────────────────────────────────────── */}
          <div className="relative z-10 flex flex-col items-center gap-3">
            {phase !== 'BETTING' && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-black/40 text-blue-300 font-bold px-2 py-0.5 rounded">
                  {effWager.toLocaleString()} pts
                </span>
                <span className="text-[11px] uppercase tracking-[0.25em] text-white/40 font-semibold">Your Hand</span>
                {playerCards.length > 0 && (
                  <ValueBadge cards={playerCards} bust={pBust} bj={pBJ} />
                )}
                {doubled && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-700/40 px-1.5 py-0.5 rounded">
                    Doubled
                  </span>
                )}
              </div>
            )}

            {/* Player cards with green glow ring during player turn */}
            <div className={cn(
              'flex items-end justify-center rounded-2xl px-4 py-3 transition-all duration-300',
              canAct && 'ring-2 ring-emerald-400/70 shadow-[0_0_30px_rgba(52,211,153,0.15)]',
            )}>
              {playerCards.length === 0 ? (
                <EmptyCard />
              ) : (
                <div className="flex items-end">
                  {playerCards.map((c, i) => (
                    <div key={`p-${i}-${c.rank}${c.suit}`}
                         style={{ marginLeft: i > 0 ? '-24px' : 0, zIndex: i }}>
                      <PlayingCard card={c} animIn={newPlayerIdx === i} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── ACTION BUTTONS (above bottom bar, inside the table) ──────────────── */}
          {canAct && (
            <div className="relative z-10 flex items-center gap-3 mt-1">
              <button
                onClick={() => hit(playerCards, dealerCards, false, wager)}
                className="h-12 px-8 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 transition-all active:scale-95 border border-emerald-400/30"
              >
                Hit
              </button>
              <button
                onClick={() => stand(playerCards, dealerCards, wager)}
                className="h-12 px-8 rounded-xl font-bold text-sm bg-red-700 hover:bg-red-600 text-white shadow-lg shadow-red-900/40 transition-all active:scale-95 border border-red-500/30"
              >
                Stand
              </button>
              {canDouble && (
                <button
                  onClick={() => doubleDown(playerCards, dealerCards, wager)}
                  className="h-12 px-8 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/40 transition-all active:scale-95 border border-amber-400/30"
                >
                  Double
                </button>
              )}
            </div>
          )}

          {/* Placeholder spacer when not in player turn (keeps layout stable) */}
          {!canAct && phase !== 'BETTING' && <div className="h-12" />}
        </div>

        {/* ── BOTTOM BAR — always visible wager area ─────────────────────────────── */}
        <div className="border-t border-white/8 bg-[#060b14] px-4 py-4">
          <div className="max-w-md mx-auto flex items-center gap-2">
            <div className="flex-1 flex items-center bg-[#0d1829] border border-white/10 rounded-lg overflow-hidden h-11">
              <span className="text-white/30 text-xs px-3 font-mono shrink-0">pts</span>
              <Input
                type="number" min={1} max={20000}
                value={wagerInput}
                onChange={e => {
                  setWagerInput(e.target.value)
                  const v = parseInt(e.target.value)
                  if (!isNaN(v)) setWager(Math.max(1, Math.min(20000, v)))
                }}
                disabled={inPlay}
                className="flex-1 h-full bg-transparent border-0 text-white text-sm focus-visible:ring-0 p-0 disabled:opacity-40"
              />
            </div>
            <button
              onClick={() => adjustWager(0.5)}
              disabled={inPlay}
              className="h-11 px-3 text-xs font-semibold bg-[#1a2840] hover:bg-[#1e3050] border border-white/10 text-white/60 rounded-lg transition-colors disabled:opacity-30"
            >1/2</button>
            <button
              onClick={() => adjustWager(2)}
              disabled={inPlay}
              className="h-11 px-3 text-xs font-semibold bg-[#1a2840] hover:bg-[#1e3050] border border-white/10 text-white/60 rounded-lg transition-colors disabled:opacity-30"
            >x2</button>
            <button
              onClick={setMax}
              disabled={inPlay}
              className="h-11 px-3 text-xs font-bold bg-blue-600 hover:bg-blue-500 border border-blue-400 text-white rounded-lg transition-colors disabled:opacity-30"
            >Max</button>
            {phase === 'BETTING' && (
              <button
                onClick={deal}
                className="h-11 px-6 rounded-lg font-bold text-sm bg-blue-600 hover:bg-blue-500 border border-blue-400 text-white transition-all active:scale-[0.98] whitespace-nowrap"
              >
                Place Bet
              </button>
            )}
          </div>
        </div>
      </div>
    </GameLayout>
  )
}
