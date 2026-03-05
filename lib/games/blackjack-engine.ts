// ─── Blackjack Engine (client-side) ──────────────────────────────────────────
// All card logic runs here. The server only settles at the end.

export type Suit = 'S' | 'H' | 'D' | 'C'
export type Card = { rank: string; suit: Suit }

export type Phase =
  | 'BETTING'
  | 'PLAYER_TURN'
  | 'DEALER_TURN'
  | 'RESOLUTION'

export type Outcome =
  | 'blackjack'
  | 'win'
  | 'dealer_bust'
  | 'push'
  | 'bust'
  | 'lose'
  | 'dealer_blackjack'

const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
const SUITS: Suit[] = ['S','H','D','C']

export function buildDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS)
    for (const rank of RANKS)
      deck.push({ rank, suit })
  // 6-deck shoe
  const shoe: Card[] = []
  for (let i = 0; i < 6; i++) shoe.push(...deck)
  return shoe
}

// Fisher-Yates shuffle using Math.random (client preview only — server verifies with HMAC)
export function shuffleDeck(deck: Card[]): Card[] {
  const d = [...deck]
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[d[i], d[j]] = [d[j], d[i]]
  }
  return d
}

export function cardValue(card: Card): number {
  if (['J', 'Q', 'K'].includes(card.rank)) return 10
  if (card.rank === 'A') return 11
  return parseInt(card.rank)
}

export function handTotal(cards: Card[]): { total: number; soft: boolean } {
  let total = 0
  let aces = 0
  for (const c of cards) {
    if (c.rank === 'A') { total += 11; aces++ }
    else if (['J','Q','K'].includes(c.rank)) total += 10
    else total += parseInt(c.rank)
  }
  let soft = aces > 0 && total <= 21
  while (total > 21 && aces > 0) { total -= 10; aces--; soft = aces > 0 }
  return { total, soft }
}

export function isBust(cards: Card[]) { return handTotal(cards).total > 21 }
export function isBlackjack(cards: Card[]) { return cards.length === 2 && handTotal(cards).total === 21 }
export function isSoft17(cards: Card[]) {
  const { total, soft } = handTotal(cards)
  return total === 17 && soft
}

// Dealer auto-plays: stands on soft 17
export function dealerShouldHit(cards: Card[]): boolean {
  const { total, soft } = handTotal(cards)
  if (total < 17) return true
  // S17: stand on soft 17
  if (total === 17 && soft) return false
  return false
}

export function resolveOutcome(
  playerCards: Card[],
  dealerCards: Card[],
  wager: number,
  doubled: boolean
): { outcome: Outcome; payout: number } {
  const effectiveWager = doubled ? wager * 2 : wager
  const MAX = 20000

  const playerBJ = isBlackjack(playerCards) && !doubled
  const dealerBJ = isBlackjack(dealerCards)

  if (playerBJ && dealerBJ) return { outcome: 'push', payout: effectiveWager }
  if (dealerBJ) return { outcome: 'dealer_blackjack', payout: 0 }
  if (playerBJ) return { outcome: 'blackjack', payout: Math.min(Math.floor(effectiveWager * 2.5), MAX) }

  const pv = handTotal(playerCards).total
  const dv = handTotal(dealerCards).total

  if (pv > 21) return { outcome: 'bust', payout: 0 }
  if (dv > 21) return { outcome: 'dealer_bust', payout: Math.min(effectiveWager * 2, MAX) }
  if (pv > dv)  return { outcome: 'win', payout: Math.min(effectiveWager * 2, MAX) }
  if (pv < dv)  return { outcome: 'lose', payout: 0 }
  return { outcome: 'push', payout: effectiveWager }
}

// Convert Card[] to the wire format the server understands: "AS", "10H", "KD" etc.
export function cardsToWire(cards: Card[]): string[] {
  return cards.map(c => `${c.rank}${c.suit}`)
}
