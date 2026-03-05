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
function PlayingCard({ card, hidden = false, animIn = false, glowGreen = false }: {
  card: Card; hidden?: boolean; animIn?: boolean; glowGreen?: boolean
}) {
  const red = RED_SUITS.has(card.suit)
  const sym = SUIT_SYMBOLS[card.suit]

  const base = cn(
    'w-[64px] h-[90px] md:w-[74px] md:h-[104px] rounded-xl select-none flex-shrink-0 relative shadow-2xl',
    animIn && 'animate-deal',
    glowGreen && 'ring-2 ring-[#39d353] shadow-[0_0_18px_rgba(57,211,83,0.35)]',
  )

  if (hidden) {
    return (
      <div className={cn(base, 'border-2 border-[#1e3a6e] bg-[#0e1f3d]')}>
        <div className="absolute inset-[5px] rounded-lg border border-[#1e3a6e]/60 bg-[#0a1628]" />
        {/* Diamond pattern on back */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M18 2L34 18L18 34L2 18Z" stroke="#4a7abf" strokeWidth="1.5" fill="none"/>
            <path d="M18 8L28 18L18 28L8 18Z" stroke="#4a7abf" strokeWidth="1" fill="none"/>
          </svg>
        </div>
        <div className="absolute top-2 left-2.5 text-[#2a5080] text-[11px] font-bold opacity-60">A</div>
      </div>
    )
  }

  return (
    <div className={cn(base, 'bg-[#f0f4f8] border-2', red ? 'border-[#e8c0c0]' : 'border-[#c8d4e0]')}>
      {/* Top-left */}
      <div className={cn('absolute top-1.5 left-2 flex flex-col items-center leading-none', red ? 'text-red-600' : 'text-[#1a2840]')}>
        <span className="text-[13px] font-extrabold leading-none">{card.rank}</span>
        <span className="text-[10px] leading-none mt-0.5">{sym}</span>
      </div>
      {/* Center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('text-[30px] md:text-[34px]', red ? 'text-red-500' : 'text-[#1a2840]')}>{sym}</span>
      </div>
      {/* Bottom-right rotated */}
      <div className={cn('absolute bottom-1.5 right-2 flex flex-col items-center leading-none rotate-180', red ? 'text-red-600' : 'text-[#1a2840]')}>
        <span className="text-[13px] font-extrabold leading-none">{card.rank}</span>
        <span className="text-[10px] leading-none mt-0.5">{sym}</span>
      </div>
    </div>
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
      'text-[11px] font-bold px-2 py-0.5 rounded-md',
      bust ? 'bg-red-900/70 text-red-300' :
      bj   ? 'bg-yellow-800/70 text-yellow-200' :
             'bg-[#1a2840] text-white/80'
    )}>
      {hide2nd ? `${total}+?` : total}
    </span>
  )
}

// ── Outcome config ────────────────────────────────────────────────────────────
type OcConfig = { label: string; color: string; border: string; sub: (w: number, p: number) => string }
const OC_CFG: Record<Outcome, OcConfig> = {
  blackjack:        { label: 'Blackjack!',      color: 'text-yellow-300', border: 'border-yellow-500/50', sub: (_, p) => `+${p.toLocaleString()} pts` },
  win:              { label: 'You Win!',         color: 'text-[#39d353]',  border: 'border-[#39d353]/50',  sub: (w, p) => `+${(p - w).toLocaleString()} pts` },
  dealer_bust:      { label: 'Dealer Busts!',   color: 'text-[#39d353]',  border: 'border-[#39d353]/50',  sub: (w, p) => `+${(p - w).toLocaleString()} pts` },
  push:             { label: 'Push',             color: 'text-slate-300',  border: 'border-slate-500/40',  sub: () => 'Wager returned' },
  bust:             { label: 'Bust!',            color: 'text-red-400',    border: 'border-red-500/50',    sub: (w) => `-${w.toLocaleString()} pts` },
  lose:             { label: 'Dealer Wins',      color: 'text-red-400',    border: 'border-red-500/50',    sub: (w) => `-${w.toLocaleString()} pts` },
  dealer_blackjack: { label: 'Dealer Blackjack', color: 'text-red-400',    border: 'border-red-500/50',    sub: (w) => `-${w.toLocaleString()} pts` },
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
    setWager(next)
    setWagerInput(String(next))
  }
  const setMax = () => { setWager(20000); setWagerInput('20000') }

  // ── SETTLE ───────────────────────────────────────────────────────────────────
  const settle = useCallback(async (
    pHand: Card[], dHand: Card[], oc: Outcome, po: number, isDoubled: boolean, w: number
  ) => {
    setOutcome(oc); setPayout(po); setPhase('RESOLUTION'); setSettling(true)
    // Send the effective wager (already doubled if applicable) — server does NOT multiply again
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
    setNewDealerIdx(dHand.length - 1)
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
    setTimeout(() => { setPlayer([p1]);         setNewPlayerIdx(0) }, 65)
    setTimeout(() => { setDealer([d1]);          setNewDealerIdx(0) }, 351)
    setTimeout(() => { setPlayer([p1, p2]);      setNewPlayerIdx(1) }, 637)
    setTimeout(() => { setDealer([d1, d2]);      setNewDealerIdx(1) }, 923)
    setTimeout(() => {
      setNewPlayerIdx(null); setNewDealerIdx(null)
      if (isBlackjack(pFinal) || isBlackjack(dFinal)) {
        setHoleHidden(false)
        const { outcome: oc, payout: po } = resolveOutcome(pFinal, dFinal, w, false)
        settle(pFinal, dFinal, oc, po, false, w)
      }
    }, 1170)
  }, [settle])

  // ── HIT ───────────────────────────────────────────────────────────────────────
  const hit = useCallback((pHand: Card[], dHand: Card[], isDoubled: boolean, w: number) => {
    const card = draw()
    const next = [...pHand, card]
    setPlayer(next); setNewPlayerIdx(next.length - 1)
    const bust = isBust(next)
    const is21 = handTotal(next).total === 21
    if (bust || is21 || isDoubled) setTimeout(() => runDealer(next, dHand, isDoubled, w), 585)
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
  const isActive  = canAct || phase === 'DEALER_TURN'

  return (
    <GameLayout title="Blackjack">
      <style>{`
        @keyframes deal {
          from { opacity:0; transform:translateY(-28px) scale(0.85) rotate(-5deg); }
          to   { opacity:1; transform:translateY(0)     scale(1)    rotate(0deg);  }
        }
        .animate-deal { animation: deal 0.34s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes result-in {
          from { opacity:0; transform:translateY(10px) scale(0.95); }
          to   { opacity:1; transform:translateY(0)    scale(1);    }
        }
        .animate-result { animation: result-in 0.3s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      {/* Full-bleed dark navy table — no green felt */}
      <div className="relative flex flex-col bg-[#0d1117] min-h-[calc(100vh-56px)]">

        {/* Very subtle center vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_45%,#111827_0%,#0d1117_100%)] pointer-events-none" />

        {/* Rules text — center of table, always visible */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-8 flex flex-col items-center gap-1 pointer-events-none select-none">
          <p className="text-white/10 text-[9px] uppercase tracking-[0.25em] font-medium">Insurance pays 2 to 1</p>
          <p className="text-white/14 text-[10px] uppercase tracking-[0.2em] font-semibold">Blackjack pays 3 to 2</p>
        </div>

        <div className="relative flex flex-col flex-1 px-6 md:px-16 pt-6 pb-2 overflow-hidden">

          {/* ── DEALER HAND ──────────────────────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-2 min-h-[120px]">
            <div className="flex items-center gap-2 h-5">
              <span className="text-[10px] uppercase tracking-[0.22em] text-white/30 font-semibold">Dealer</span>
              {dealerCards.length > 0 && (
                <ValueBadge cards={dealerCards} hide2nd={holeHidden} bust={dBust} />
              )}
            </div>
            <div className="flex items-end justify-center" style={{ gap: '-12px' }}>
              {dealerCards.length === 0 ? (
                <div className="w-[64px] h-[90px] rounded-xl border border-dashed border-white/6" />
              ) : (
                <div className="flex items-end" style={{ gap: '-10px' }}>
                  {dealerCards.map((c, i) => (
                    <div key={`d-${i}-${c.rank}${c.suit}`} style={{ marginLeft: i > 0 ? '-18px' : 0, zIndex: i }}>
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

          {/* ── PLAYER HAND ──────────────────────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-2 mt-auto mb-4">
            {/* Wager badge above player hand */}
            {phase !== 'BETTING' && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-[#1a2840] text-blue-300 font-bold px-2 py-0.5 rounded">
                  {effWager.toLocaleString()} pts
                </span>
                <span className="text-[10px] uppercase tracking-[0.22em] text-white/30 font-semibold">Your Hand</span>
                {playerCards.length > 0 && (
                  <ValueBadge cards={playerCards} bust={pBust} bj={pBJ} />
                )}
                {doubled && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-950/50 border border-amber-700/40 px-1.5 py-0.5 rounded">
                    Doubled
                  </span>
                )}
              </div>
            )}

            {/* Player card group — green glow ring when it's player's turn */}
            <div className={cn(
              'flex items-end justify-center rounded-2xl px-5 py-3 transition-all duration-300',
              canAct && 'ring-2 ring-[#39d353]/60 shadow-[0_0_24px_rgba(57,211,83,0.12)]',
            )}>
              {playerCards.length === 0 ? (
                <div className="w-[64px] h-[90px] rounded-xl border border-dashed border-white/6" />
              ) : (
                <div className="flex items-end">
                  {playerCards.map((c, i) => (
                    <div key={`p-${i}-${c.rank}${c.suit}`} style={{ marginLeft: i > 0 ? '-18px' : 0, zIndex: i }}>
                      <PlayingCard
                        card={c}
                        animIn={newPlayerIdx === i}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── OUTCOME overlay ────────────────────────────────────────────────────── */}
        {oc && phase === 'RESOLUTION' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className={cn(
              'animate-result pointer-events-auto',
              'mx-6 md:mx-24 rounded-2xl border-2 bg-[#0d1117]/95 backdrop-blur p-8 text-center shadow-2xl',
              oc.border
            )}>
              <p className={cn('text-5xl font-black mb-1 tracking-tight', oc.color)}>
                {oc.label}
              </p>
              {doubled && (
                <span className="inline-block text-[10px] font-bold tracking-widest uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full px-2 py-0.5 mb-2">
                  Doubled
                </span>
              )}
              <p className="text-white/50 text-lg font-semibold mt-1 mb-5">
                {oc.sub(effWager, payout)}
              </p>
              <button
                onClick={reset}
                disabled={settling}
                className="px-8 h-11 rounded-full font-bold text-sm bg-[#1a2840] hover:bg-[#1e3050] border border-white/15 text-white transition-all"
              >
                {settling ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Deal Again'}
              </button>
            </div>
          </div>
        )}

        {/* ── BOTTOM BAR ────────────────────────────────────────────────────────── */}
        <div className="relative border-t border-white/6 bg-[#0a0e18]">

          {/* BETTING state — wager input + Place Bet */}
          {phase === 'BETTING' && (
            <div className="flex flex-col gap-3 px-4 py-4 max-w-sm mx-auto w-full">
              {/* Bet input row */}
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-[#111827] border border-white/10 rounded-lg overflow-hidden h-10">
                  <span className="text-white/30 text-xs px-3 font-mono shrink-0">pts</span>
                  <Input
                    type="number" min={1} max={20000}
                    value={wagerInput}
                    onChange={e => {
                      setWagerInput(e.target.value)
                      const v = parseInt(e.target.value)
                      if (!isNaN(v)) setWager(Math.max(1, Math.min(20000, v)))
                    }}
                    className="flex-1 h-full bg-transparent border-0 text-white text-sm focus-visible:ring-0 p-0"
                  />
                </div>
                <button
                  onClick={() => adjustWager(0.5)}
                  className="h-10 px-3 text-xs font-semibold bg-[#1a2840] hover:bg-[#1e3050] border border-white/10 text-white/60 rounded-lg transition-colors"
                >1/2</button>
                <button
                  onClick={() => adjustWager(2)}
                  className="h-10 px-3 text-xs font-semibold bg-[#1a2840] hover:bg-[#1e3050] border border-white/10 text-white/60 rounded-lg transition-colors"
                >x2</button>
                <button
                  onClick={setMax}
                  className="h-10 px-3 text-xs font-bold bg-blue-600 hover:bg-blue-500 border border-blue-400 text-white rounded-lg transition-colors"
                >Max</button>
              </div>
              {/* Deal button */}
              <button
                onClick={deal}
                className="w-full h-12 rounded-xl font-bold text-base bg-blue-600 hover:bg-blue-500 border border-blue-400 text-white transition-all active:scale-[0.98]"
              >
                Place Bet
              </button>
            </div>
          )}

          {/* ACTIVE / DEALER_TURN — action buttons in a bar */}
          {(canAct || phase === 'DEALER_TURN') && (
            <div className="flex items-stretch justify-center divide-x divide-white/6 h-14">
              <ActionBtn
                label="Hit"
                icon="◎"
                active={canAct}
                color="text-white"
                onClick={() => canAct && hit(playerCards, dealerCards, false, wager)}
              />
              <ActionBtn
                label="Stand"
                icon="⊘"
                active={canAct}
                color="text-white"
                onClick={() => canAct && stand(playerCards, dealerCards, wager)}
              />
              <ActionBtn
                label="Split"
                icon="⇔"
                active={false}
                color="text-white/30"
                onClick={() => {}}
              />
              <ActionBtn
                label="Double"
                badge="2x"
                icon="×"
                active={canDouble}
                color="text-white"
                onClick={() => canDouble && doubleDown(playerCards, dealerCards, wager)}
              />
            </div>
          )}

          {/* RESOLUTION — minimal */}
          {phase === 'RESOLUTION' && (
            <div className="h-14 flex items-center justify-center">
              <span className="text-white/20 text-xs">Settle complete</span>
            </div>
          )}
        </div>
      </div>
    </GameLayout>
  )
}

// ── Action button ─────────────────────────────────────────────────────────────
function ActionBtn({ label, icon, badge, active, color, onClick }: {
  label: string; icon: string; badge?: string; active: boolean; color: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={!active}
      className={cn(
        'flex-1 flex flex-col items-center justify-center gap-0.5 px-2 transition-all',
        'text-center select-none',
        active ? 'hover:bg-white/5 active:bg-white/10 cursor-pointer' : 'cursor-not-allowed opacity-30',
      )}
    >
      <span className="text-base">{icon}</span>
      <span className={cn('text-[11px] font-semibold tracking-wide', color)}>
        {label}{badge && <span className="text-[10px] text-white/40 ml-1">{badge}</span>}
      </span>
    </button>
  )
}
