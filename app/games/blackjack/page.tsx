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

// ── Playing Card ──────────────────────────────────────────────────────────────
function PlayingCard({ card, hidden = false, animIn = false }: {
  card: Card; hidden?: boolean; animIn?: boolean
}) {
  const red = RED_SUITS.has(card.suit)
  const sym = SUIT_SYMBOLS[card.suit]

  if (hidden) {
    return (
      <div className={cn(
        'w-[60px] h-[84px] md:w-[72px] md:h-[100px] rounded-xl border-2 border-[#2a3f6a]',
        'bg-[#1a2744] flex items-center justify-center shadow-xl select-none flex-shrink-0',
        animIn && 'animate-[dealIn_0.25s_ease-out]',
      )}>
        <div className="w-9 h-12 rounded-lg border border-[#3a5080]/50 bg-[#162040] flex items-center justify-center">
          <span className="text-[#3a5080] text-xl font-black select-none">✦</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'w-[60px] h-[84px] md:w-[72px] md:h-[100px] rounded-xl border-2 bg-white',
      'flex flex-col p-1.5 select-none shadow-xl relative flex-shrink-0',
      red ? 'border-red-200' : 'border-slate-200',
      animIn && 'animate-[dealIn_0.25s_ease-out]',
    )}>
      <div className={cn('flex flex-col items-start leading-none', red ? 'text-red-500' : 'text-slate-800')}>
        <span className="text-[13px] font-extrabold leading-none">{card.rank}</span>
        <span className="text-[11px] leading-none">{sym}</span>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <span className={cn('text-2xl', red ? 'text-red-500' : 'text-slate-800')}>{sym}</span>
      </div>
      <div className={cn('flex flex-col items-end leading-none rotate-180', red ? 'text-red-500' : 'text-slate-800')}>
        <span className="text-[13px] font-extrabold leading-none">{card.rank}</span>
        <span className="text-[11px] leading-none">{sym}</span>
      </div>
    </div>
  )
}

function HandBadge({ cards, hide2nd = false }: { cards: Card[]; hide2nd?: boolean }) {
  const visible = hide2nd ? [cards[0]] : cards
  const { total } = handTotal(visible)
  const bust = !hide2nd && isBust(cards)
  const bj = !hide2nd && isBlackjack(cards)
  return (
    <span className={cn(
      'text-[11px] font-bold px-2 py-0.5 rounded-full border',
      bust  ? 'bg-red-900/60 text-red-300 border-red-500/40' :
      bj    ? 'bg-yellow-900/60 text-yellow-300 border-yellow-500/40' :
              'bg-black/40 text-white/80 border-white/10'
    )}>
      {hide2nd ? `${total}+?` : total}
    </span>
  )
}

// ── Chips ─────────────────────────────────────────────────────────────────────
const CHIPS = [
  { value: 50,   label: '50',  cls: 'bg-red-600 hover:bg-red-500 border-red-400' },
  { value: 100,  label: '100', cls: 'bg-green-600 hover:bg-green-500 border-green-400' },
  { value: 500,  label: '500', cls: 'bg-slate-700 hover:bg-slate-600 border-slate-500' },
  { value: 1000, label: '1K',  cls: 'bg-purple-700 hover:bg-purple-600 border-purple-400' },
]

// ── Outcome config ────────────────────────────────────────────────────────────
const OC_CFG: Record<Outcome, { label: string; color: string; bg: string; sub: (w: number, p: number) => string }> = {
  blackjack:        { label: 'Blackjack!',      color: 'text-yellow-300', bg: 'from-yellow-950/95 to-yellow-900/85 border-yellow-500/40', sub: (_,p) => `+${(p).toLocaleString()} pts` },
  win:              { label: 'You Win!',         color: 'text-green-300',  bg: 'from-green-950/95 to-green-900/85 border-green-500/40',   sub: (w,p) => `+${(p-w).toLocaleString()} pts` },
  dealer_bust:      { label: 'Dealer Busts!',   color: 'text-green-300',  bg: 'from-green-950/95 to-green-900/85 border-green-500/40',   sub: (w,p) => `+${(p-w).toLocaleString()} pts` },
  push:             { label: 'Push',             color: 'text-blue-300',   bg: 'from-blue-950/95 to-blue-900/85 border-blue-500/40',      sub: () => 'Wager returned' },
  bust:             { label: 'Bust!',            color: 'text-red-300',    bg: 'from-red-950/95 to-red-900/85 border-red-500/40',         sub: (w) => `-${w.toLocaleString()} pts` },
  lose:             { label: 'Dealer Wins',      color: 'text-red-300',    bg: 'from-red-950/95 to-red-900/85 border-red-500/40',         sub: (w) => `-${w.toLocaleString()} pts` },
  dealer_blackjack: { label: 'Dealer Blackjack', color: 'text-red-300',    bg: 'from-red-950/95 to-red-900/85 border-red-500/40',         sub: (w) => `-${w.toLocaleString()} pts` },
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BlackjackPage() {
  const [wager, setWager]         = useState(100)
  const [phase, setPhase]         = useState<Phase>('BETTING')
  const [shoe, setShoe]           = useState<Card[]>([])
  const shoeRef                   = useRef<Card[]>([])
  const [playerCards, setPlayer]  = useState<Card[]>([])
  const [dealerCards, setDealer]  = useState<Card[]>([])
  const [holeHidden, setHoleHidden] = useState(true)
  const [doubled, setDoubled]     = useState(false)
  const [outcome, setOutcome]     = useState<Outcome | null>(null)
  const [payout, setPayout]       = useState(0)
  const [settling, setSettling]   = useState(false)
  // Track which cards are "new" for animation
  const [animKeys, setAnimKeys]   = useState<Set<string>>(new Set())

  // Draw next card from shoe ref (mutable during a hand)
  const drawCard = useCallback((): Card => {
    const card = shoeRef.current.shift()!
    return card
  }, [])

  const markAnim = (key: string) => setAnimKeys(s => new Set(s).add(key))

  // ── DEAL ─────────────────────────────────────────────────────────────────────
  const deal = useCallback(() => {
    const freshShoe = shuffleDeck(buildDeck())
    shoeRef.current = freshShoe

    const p1 = drawCard()
    const d1 = drawCard()
    const p2 = drawCard()
    const d2 = drawCard() // hole card — stays hidden

    const pHand = [p1, p2]
    const dHand = [d1, d2]

    setShoe([...shoeRef.current])
    setPlayer(pHand)
    setDealer(dHand)
    setHoleHidden(true)
    setDoubled(false)
    setOutcome(null)
    setPayout(0)
    setAnimKeys(new Set(['p0','p1','d0']))
    setPhase('PLAYER_TURN')

    // Immediate resolution: both blackjack, player blackjack, dealer blackjack
    const pBJ = isBlackjack(pHand)
    const dBJ = isBlackjack(dHand)
    if (pBJ || dBJ) {
      setHoleHidden(false)
      const { outcome: oc, payout: po } = resolveOutcome(pHand, dHand, wager, false)
      settle(pHand, dHand, oc, po, false)
    }
  }, [wager])

  // ── HIT ──────────────────────────────────────────────────────────────────────
  const hit = useCallback((currentPlayer: Card[], currentDealer: Card[], isDoubling = false) => {
    const newCard = drawCard()
    const next = [...currentPlayer, newCard]
    setPlayer(next)
    setAnimKeys(s => new Set(s).add(`p${next.length - 1}`))

    const bust = isBust(next)
    const is21 = handTotal(next).total === 21

    if (bust || is21 || isDoubling) {
      // Run dealer turn then resolve
      setTimeout(() => runDealerTurn(next, currentDealer, isDoubling ? wager : wager), 400)
    }
    // else stay in PLAYER_TURN — user must click again
  }, [drawCard, wager])

  // ── STAND ─────────────────────────────────────────────────────────────────────
  const stand = useCallback((currentPlayer: Card[], currentDealer: Card[]) => {
    runDealerTurn(currentPlayer, currentDealer, false)
  }, [])

  // ── DOUBLE ───────────────────────────────────────────────────────────────────
  const doubleDown = useCallback((currentPlayer: Card[], currentDealer: Card[]) => {
    setDoubled(true)
    setPhase('DEALER_TURN') // lock buttons immediately
    hit(currentPlayer, currentDealer, true)
  }, [hit])

  // ── DEALER TURN ───────────────────────────────────────────────────────────────
  const runDealerTurn = useCallback((pHand: Card[], dHand: Card[], _isDoubled: boolean | number) => {
    setPhase('DEALER_TURN')
    setHoleHidden(false)

    let current = [...dHand]

    const drawLoop = (hand: Card[]) => {
      if (dealerShouldHit(hand)) {
        const newCard = drawCard()
        const next = [...hand, newCard]
        setDealer(next)
        setAnimKeys(s => new Set(s).add(`d${next.length - 1}`))
        setTimeout(() => drawLoop(next), 600)
      } else {
        // Resolve
        const isDoubledFinal = _isDoubled === true || doubled
        const { outcome: oc, payout: po } = resolveOutcome(pHand, hand, wager, isDoubledFinal)
        settle(pHand, hand, oc, po, isDoubledFinal)
      }
    }

    // Small delay to show hole card reveal
    setTimeout(() => drawLoop(current), 500)
  }, [drawCard, wager, doubled])

  // ── SETTLE (call server once) ──────────────────────────────────────────────
  const settle = useCallback(async (
    pHand: Card[], dHand: Card[], oc: Outcome, po: number, isDoubled: boolean
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
          game: 'blackjack',
          wager,
          outcome: oc,
          payout: po,
          playerHand: cardsToWire(pHand),
          dealerHand: cardsToWire(dHand),
          doubled: isDoubled,
        }),
      })
      mutate('/api/games/profile')
      mutate('/api/games/history')
    } finally {
      setSettling(false)
    }
  }, [wager])

  // ── RESET ─────────────────────────────────────────────────────────────────────
  const reset = () => {
    setPhase('BETTING')
    setPlayer([])
    setDealer([])
    setOutcome(null)
    setPayout(0)
    setDoubled(false)
    setHoleHidden(true)
    setAnimKeys(new Set())
  }

  const canAct  = phase === 'PLAYER_TURN'
  const canDouble = canAct && playerCards.length === 2
  const effectiveWager = doubled ? wager * 2 : wager
  const oc = outcome ? OC_CFG[outcome] : null

  return (
    <GameLayout title="Blackjack">
      <style>{`
        @keyframes dealIn {
          from { opacity: 0; transform: translateY(-18px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div className="relative flex flex-col min-h-[calc(100vh-120px)] bg-[#0d1f0f] overflow-hidden">
        {/* Felt texture */}
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize:'4px 4px' }} />
        {/* Table oval rim */}
        <div className="absolute inset-4 rounded-[50%/18%] border-2 border-[#1a4020]/50 pointer-events-none" />

        <div className="relative flex flex-col flex-1 px-4 md:px-8 pt-6 pb-0">

          {/* ── Dealer ── */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-widest text-white/40 font-semibold">Dealer</span>
              {dealerCards.length > 0 && <HandBadge cards={dealerCards} hide2nd={holeHidden} />}
              {phase === 'DEALER_TURN' && (
                <span className="text-[11px] text-white/40 animate-pulse">drawing…</span>
              )}
            </div>
            <div className="flex gap-[-8px] min-h-[100px] items-center justify-center" style={{ gap: '-8px' }}>
              {dealerCards.length === 0 ? (
                <div className="w-[60px] h-[84px] rounded-xl border border-dashed border-white/10 flex items-center justify-center">
                  <span className="text-white/15 text-[10px]">Dealer</span>
                </div>
              ) : (
                <div className="flex" style={{ gap: '6px' }}>
                  {dealerCards.map((c, i) => (
                    <PlayingCard
                      key={`d-${i}-${c.rank}${c.suit}`}
                      card={c}
                      hidden={holeHidden && i === dealerCards.length - 1}
                      animIn={animKeys.has(`d${i}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Center rules strip ── */}
          <div className="flex flex-col items-center gap-0.5 my-3">
            <p className="text-white/20 text-[10px] uppercase tracking-widest">Insurance pays 2 to 1</p>
            <p className="text-white/25 text-[11px] uppercase tracking-widest font-semibold">Blackjack pays 3 to 2</p>
          </div>

          {/* ── Outcome overlay ── */}
          {oc && phase === 'RESOLUTION' && (
            <div className={cn(
              'absolute inset-x-6 md:inset-x-16 top-1/2 -translate-y-1/2 z-20',
              'rounded-2xl border bg-gradient-to-br p-6 text-center shadow-2xl backdrop-blur-sm',
              oc.bg
            )}>
              <p className={cn('text-4xl md:text-5xl font-extrabold mb-1 tracking-tight', oc.color)}>
                {oc.label}
              </p>
              <p className="text-white/60 text-lg font-semibold">
                {oc.sub(effectiveWager, payout)}
              </p>
              <Button
                onClick={reset}
                disabled={settling}
                className="mt-5 px-8 h-11 text-base font-bold bg-white text-black hover:bg-white/90 rounded-full"
              >
                {settling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Deal Again'}
              </Button>
            </div>
          )}

          {/* ── Player hand ── */}
          <div className="flex flex-col items-center gap-2 mt-auto mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-widest text-white/40 font-semibold">Your Hand</span>
              {playerCards.length > 0 && <HandBadge cards={playerCards} />}
              {doubled && <span className="text-[11px] text-amber-400 font-bold">DOUBLED</span>}
            </div>
            <div className={cn(
              'flex min-h-[100px] items-center justify-center p-3 rounded-2xl transition-all',
              canAct && 'ring-2 ring-green-500/30',
            )} style={{ gap: '6px' }}>
              {playerCards.length === 0 ? (
                <div className="w-[60px] h-[84px] rounded-xl border border-dashed border-white/10 flex items-center justify-center">
                  <span className="text-white/15 text-[10px]">Player</span>
                </div>
              ) : (
                playerCards.map((c, i) => (
                  <PlayingCard
                    key={`p-${i}-${c.rank}${c.suit}`}
                    card={c}
                    animIn={animKeys.has(`p${i}`)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Bottom controls ── */}
        <div className="bg-[#0a1a0c]/95 border-t border-[#1a3a1e] px-4 py-4 space-y-3">

          {/* Wager + chips — only in BETTING phase */}
          {phase === 'BETTING' && (
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-white/40 text-[11px] font-semibold uppercase tracking-widest">Wager</span>
              <Input
                type="number" min={1} max={20000}
                value={wager}
                onChange={e => setWager(Math.max(1, Math.min(20000, parseInt(e.target.value) || 1)))}
                className="w-24 h-8 text-sm text-center bg-black/30 border-white/10 text-white"
              />
              {CHIPS.map(chip => (
                <button
                  key={chip.value}
                  onClick={() => setWager(chip.value)}
                  className={cn(
                    'w-11 h-11 rounded-full font-bold text-xs border-2 transition-all shadow-md text-white',
                    chip.cls,
                    wager === chip.value && 'ring-2 ring-white/50 ring-offset-1 ring-offset-black scale-110'
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Current wager display during hand */}
          {phase !== 'BETTING' && phase !== 'RESOLUTION' && (
            <div className="flex justify-center">
              <span className="text-white/40 text-xs font-mono">
                Wager: <span className="text-white/70 font-bold">{effectiveWager.toLocaleString()} pts</span>
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid gap-2 max-w-md mx-auto" style={{
            gridTemplateColumns: phase === 'BETTING' ? '1fr' : canDouble ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)'
          }}>
            {phase === 'BETTING' && (
              <button
                onClick={deal}
                className={cn(
                  'h-13 py-3 rounded-xl font-bold text-base border-2 transition-all',
                  'bg-green-600 hover:bg-green-500 border-green-400 text-white',
                  'flex items-center justify-center gap-2'
                )}
              >
                Deal
              </button>
            )}

            {canAct && (
              <>
                <button
                  onClick={() => hit(playerCards, dealerCards)}
                  className="h-12 rounded-xl font-bold text-sm border-2 transition-all bg-green-700 hover:bg-green-600 border-green-500 text-white flex items-center justify-center gap-1.5"
                >
                  Hit <span className="opacity-60">↗</span>
                </button>
                <button
                  onClick={() => stand(playerCards, dealerCards)}
                  className="h-12 rounded-xl font-bold text-sm border-2 transition-all bg-red-700 hover:bg-red-600 border-red-500 text-white flex items-center justify-center gap-1.5"
                >
                  Stand <span className="opacity-60">✋</span>
                </button>
                {canDouble && (
                  <button
                    onClick={() => doubleDown(playerCards, dealerCards)}
                    className="h-12 rounded-xl font-bold text-sm border-2 transition-all bg-amber-600 hover:bg-amber-500 border-amber-400 text-white flex items-center justify-center gap-1.5"
                  >
                    Double <span className="text-xs font-normal opacity-70">2×</span>
                  </button>
                )}
              </>
            )}

            {phase === 'DEALER_TURN' && (
              <div className="col-span-full h-12 flex items-center justify-center gap-2 text-white/40 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Dealer is playing…
              </div>
            )}
          </div>

          <p className="text-center text-white/15 text-[10px] uppercase tracking-widest">
            Dealer stands soft 17 · Blackjack pays 3:2 · Max 20,000 pts
          </p>
        </div>
      </div>
    </GameLayout>
  )
}
