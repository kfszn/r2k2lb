'use client'

import { useState } from 'react'
import { mutate } from 'swr'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { GameLayout } from '@/components/games/game-layout'

type GameState = 'idle' | 'choose_action' | 'done'

const SUIT_SYMBOLS: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' }
const RED_SUITS = new Set(['H', 'D'])

function getCardRank(card: string) { return card.slice(0, -1) }
function getCardSuit(card: string) { return card.slice(-1) }
function isRed(card: string) { return RED_SUITS.has(getCardSuit(card)) }

function PlayingCard({ card, hidden = false }: { card: string; hidden?: boolean }) {
  if (hidden) {
    return (
      <div className="w-14 h-20 rounded-lg border-2 border-border/60 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-md">
        <div className="w-7 h-10 rounded border border-primary/30 bg-primary/10" />
      </div>
    )
  }
  const rank = getCardRank(card)
  const suit = getCardSuit(card)
  const red = isRed(card)
  return (
    <div className={`w-14 h-20 rounded-lg border-2 bg-card shadow-md flex flex-col p-1.5 select-none ${red ? 'border-red-400/40 text-red-400' : 'border-border/60 text-foreground'}`}>
      <div className="text-xs font-bold leading-none">{rank}</div>
      <div className="flex-1 flex items-center justify-center text-lg">{SUIT_SYMBOLS[suit]}</div>
      <div className="text-xs font-bold leading-none self-end rotate-180">{rank}</div>
    </div>
  )
}

function handTotal(cards: string[]) {
  let total = 0; let aces = 0
  for (const c of cards) {
    const rank = getCardRank(c)
    if (['J', 'Q', 'K'].includes(rank)) total += 10
    else if (rank === 'A') { total += 11; aces++ }
    else total += parseInt(rank)
  }
  while (total > 21 && aces > 0) { total -= 10; aces-- }
  return total
}

const OUTCOME_LABELS: Record<string, { label: string; color: string }> = {
  blackjack:        { label: 'Blackjack!', color: 'text-yellow-400' },
  win:              { label: 'You Win!', color: 'text-green-400' },
  dealer_bust:      { label: 'Dealer Bust — You Win!', color: 'text-green-400' },
  push:             { label: 'Push — Wager Returned', color: 'text-blue-400' },
  bust:             { label: 'Bust — You Lose', color: 'text-red-400' },
  lose:             { label: 'Dealer Wins', color: 'text-red-400' },
  dealer_blackjack: { label: 'Dealer Blackjack', color: 'text-red-400' },
}

export default function BlackjackPage() {
  const [wager, setWager] = useState('100')
  const [state, setState] = useState<GameState>('idle')
  const [playerCards, setPlayerCards] = useState<string[]>([])
  const [dealerCards, setDealerCards] = useState<string[]>([])
  const [outcome, setOutcome] = useState<string | null>(null)
  const [payout, setPayout] = useState(0)
  const [loading, setLoading] = useState(false)

  const bet = async (action: 'stand' | 'hit' | 'double') => {
    setLoading(true)
    try {
      const res = await fetch('/api/games/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: 'blackjack',
          wager: parseInt(wager),
          gameData: { action },
        }),
      })
      const data = await res.json()
      if (data.error) return
      setPlayerCards(data.result.playerHand)
      setDealerCards(data.result.dealerHand)
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
  }

  const outcomeInfo = outcome ? OUTCOME_LABELS[outcome] : null

  return (
    <GameLayout title="Blackjack">
      <Card className="border-border/40 bg-card/50">
        <CardContent className="p-6 space-y-6">

          {/* Table */}
          <div className="bg-green-950/30 border border-green-900/40 rounded-xl p-6 space-y-6 min-h-64">
            {/* Dealer hand */}
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                Dealer
                {dealerCards.length > 0 && state === 'done' && (
                  <span className="font-semibold text-foreground">({handTotal(dealerCards)})</span>
                )}
              </p>
              <div className="flex gap-2 flex-wrap min-h-[5rem]">
                {dealerCards.length === 0
                  ? <span className="text-muted-foreground text-sm self-center">Waiting for deal...</span>
                  : dealerCards.map((c, i) => <PlayingCard key={i} card={c} />)
                }
              </div>
            </div>

            {/* Outcome banner */}
            {outcomeInfo && (
              <div className={`text-center text-2xl font-bold py-2 ${outcomeInfo.color}`}>
                {outcomeInfo.label}
                {payout > 0 && (
                  <div className="text-base font-normal text-muted-foreground mt-1">
                    +{payout.toLocaleString()} pts returned
                  </div>
                )}
              </div>
            )}

            {/* Player hand */}
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                Your Hand
                {playerCards.length > 0 && (
                  <span className="font-semibold text-foreground">({handTotal(playerCards)})</span>
                )}
              </p>
              <div className="flex gap-2 flex-wrap min-h-[5rem]">
                {playerCards.length === 0
                  ? <span className="text-muted-foreground text-sm self-center">Place a bet to start</span>
                  : playerCards.map((c, i) => <PlayingCard key={i} card={c} />)
                }
              </div>
            </div>
          </div>

          {/* Action description for choose_action state */}
          {state === 'choose_action' && (
            <p className="text-sm text-muted-foreground text-center">
              Your hand: <span className="text-foreground font-semibold">{handTotal(playerCards)}</span> — choose your action below
            </p>
          )}

          {/* Wager input */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm text-muted-foreground w-16 shrink-0">Wager</label>
            <Input
              type="number"
              min={1}
              value={wager}
              onChange={e => setWager(e.target.value)}
              disabled={state !== 'idle' || loading}
              className="w-32"
            />
            <div className="flex gap-1.5 flex-wrap">
              {[50, 100, 500, 1000].map(v => (
                <Button key={v} size="sm" variant="outline" className="text-xs h-8 px-2.5"
                  disabled={state !== 'idle' || loading}
                  onClick={() => setWager(String(v))}>
                  {v}
                </Button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          {state === 'idle' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">Choose your action before dealing — the hand resolves instantly</p>
              <div className="grid grid-cols-3 gap-3">
                <Button onClick={() => bet('stand')} disabled={loading || parseInt(wager) < 1} variant="outline" className="h-12">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Stand'}
                </Button>
                <Button onClick={() => bet('hit')} disabled={loading || parseInt(wager) < 1} className="h-12 font-semibold">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Hit'}
                </Button>
                <Button onClick={() => bet('double')} disabled={loading || parseInt(wager) < 1} variant="outline" className="h-12">
                  Double
                </Button>
              </div>
            </div>
          )}

          {state === 'done' && (
            <Button onClick={reset} className="w-full h-12 text-base font-semibold" variant="outline">
              New Hand
            </Button>
          )}

          {/* Rules badges */}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground border-t border-border/30 pt-4">
            <Badge variant="outline" className="text-xs">Blackjack pays 2x</Badge>
            <Badge variant="outline" className="text-xs">Dealer stands soft 17</Badge>
            <Badge variant="outline" className="text-xs">Double doubles wager</Badge>
            <Badge variant="outline" className="text-xs">Max payout 20,000 pts</Badge>
          </div>
        </CardContent>
      </Card>
    </GameLayout>
  )
}
