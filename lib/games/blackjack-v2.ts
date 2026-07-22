import { randomFloat } from '@/lib/games/provably-fair'

/**
 * Server-authoritative blackjack engine.
 *
 * Rules: 6-deck shoe, dealer hits soft 17 (H17), blackjack pays 3:2,
 * double on any two cards, double-after-split allowed, split up to 3 hands
 * (4 total is disallowed to keep it to "up to 3"), split aces get one card each,
 * insurance pays 2:1, early surrender allowed (first action on the initial hand).
 *
 * Shoe order is derived deterministically from (serverSeed, clientSeed, nonce)
 * via a provably-fair Fisher-Yates shuffle, so the whole game is verifiable.
 */

export type Suit = 'S' | 'H' | 'D' | 'C'
export type Card = { rank: number; suit: Suit } // rank: 1=A, 11=J, 12=Q, 13=K

export type Hand = {
  cards: Card[]
  bet: number
  done: boolean
  doubled: boolean
  surrendered: boolean
  splitAces: boolean
  outcome: 'win' | 'lose' | 'push' | 'blackjack' | null
  payout: number
}

export type BlackjackState = {
  shoe: Card[]
  cursor: number
  dealer: Card[]
  hands: Hand[]
  active: number // index of the hand currently in play
  baseBet: number
  insurance: number // amount wagered on insurance (0 if none)
  insuranceResolved: boolean
  phase: 'player' | 'dealer' | 'done'
  dealerHoleShown: boolean
}

const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
const SUITS: Suit[] = ['S', 'H', 'D', 'C']
const DECKS = 6

/** Build an ordered 6-deck shoe then shuffle it with provably-fair floats. */
export function buildShoe(serverSeed: string, clientSeed: string, nonce: number): Card[] {
  const shoe: Card[] = []
  for (let d = 0; d < DECKS; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        shoe.push({ rank, suit })
      }
    }
  }
  // Fisher-Yates using a stream of PF floats (cursor advances per swap).
  for (let i = shoe.length - 1; i > 0; i--) {
    const r = randomFloat(serverSeed, clientSeed, nonce, shoe.length - 1 - i)
    const j = Math.floor(r * (i + 1))
    ;[shoe[i], shoe[j]] = [shoe[j], shoe[i]]
  }
  return shoe
}

/** Card value for totals: face cards = 10, ace = 11 (soft-adjusted later). */
export function cardValue(card: Card): number {
  if (card.rank >= 10) return 10
  if (card.rank === 1) return 11
  return card.rank
}

/** Best total for a hand plus whether it is soft (an ace counted as 11). */
export function handTotal(cards: Card[]): { total: number; soft: boolean } {
  let total = 0
  let aces = 0
  for (const c of cards) {
    total += cardValue(c)
    if (c.rank === 1) aces++
  }
  let soft = aces > 0
  while (total > 21 && aces > 0) {
    total -= 10
    aces--
    soft = aces > 0
  }
  return { total, soft }
}

export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handTotal(cards).total === 21
}

function draw(state: BlackjackState): Card {
  const card = state.shoe[state.cursor]
  state.cursor++
  return card
}

/** Start a new hand: deal player+dealer, detect naturals. */
export function deal(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  bet: number,
): BlackjackState {
  const shoe = buildShoe(serverSeed, clientSeed, nonce)
  const state: BlackjackState = {
    shoe,
    cursor: 0,
    dealer: [],
    hands: [
      {
        cards: [],
        bet,
        done: false,
        doubled: false,
        surrendered: false,
        splitAces: false,
        outcome: null,
        payout: 0,
      },
    ],
    active: 0,
    baseBet: bet,
    insurance: 0,
    insuranceResolved: false,
    phase: 'player',
    dealerHoleShown: false,
  }

  // Standard deal order: player, dealer, player, dealer(hole).
  state.hands[0].cards.push(draw(state))
  state.dealer.push(draw(state))
  state.hands[0].cards.push(draw(state))
  state.dealer.push(draw(state))

  const playerBJ = isBlackjack(state.hands[0].cards)
  const dealerUpAce = state.dealer[0].rank === 1
  const dealerUpTen = cardValue(state.dealer[0]) === 10

  // If the dealer shows A or 10, we still allow insurance/peek flow. If player
  // has a natural and dealer cannot, resolve immediately.
  if (playerBJ && !dealerUpAce && !dealerUpTen) {
    settleImmediateBlackjack(state)
  }
  return state
}

function settleImmediateBlackjack(state: BlackjackState) {
  state.dealerHoleShown = true
  state.phase = 'done'
  const hand = state.hands[0]
  if (isBlackjack(state.dealer)) {
    hand.outcome = 'push'
    hand.payout = hand.bet
  } else {
    hand.outcome = 'blackjack'
    hand.payout = hand.bet * 2.5 // 3:2 (stake back + 1.5x)
  }
  hand.done = true
}

export type LegalAction =
  | 'hit'
  | 'stand'
  | 'double'
  | 'split'
  | 'surrender'
  | 'insurance'
  | 'decline_insurance'

/** Which actions are currently legal for the active hand. */
export function legalActions(state: BlackjackState): LegalAction[] {
  if (state.phase !== 'player') return []
  const actions: LegalAction[] = []
  const hand = state.hands[state.active]

  // Insurance offer: only when dealer shows an ace, not yet resolved, on the
  // very first decision of the round (single hand, two cards).
  const dealerUpAce = state.dealer[0]?.rank === 1
  if (
    dealerUpAce &&
    !state.insuranceResolved &&
    state.hands.length === 1 &&
    hand.cards.length === 2
  ) {
    return ['insurance', 'decline_insurance']
  }

  if (hand.done) return []

  actions.push('hit', 'stand')

  const twoCards = hand.cards.length === 2
  if (twoCards && !hand.splitAces) actions.push('double')
  // Split: two cards of equal value, fewer than 3 hands, and not already split aces getting extra.
  if (
    twoCards &&
    state.hands.length < 3 &&
    cardValue(hand.cards[0]) === cardValue(hand.cards[1])
  ) {
    actions.push('split')
  }
  // Early surrender: only as the first action on the initial single hand.
  if (twoCards && state.hands.length === 1 && !hand.doubled) {
    actions.push('surrender')
  }
  return actions
}

function advanceHand(state: BlackjackState) {
  // Move to the next not-done hand, else go to dealer phase.
  for (let i = state.active + 1; i < state.hands.length; i++) {
    if (!state.hands[i].done) {
      state.active = i
      // A freshly split hand needs a second card.
      if (state.hands[i].cards.length === 1) {
        state.hands[i].cards.push(draw(state))
        maybeAutoStand(state, i)
      }
      return
    }
  }
  state.phase = 'dealer'
  playDealer(state)
}

/** Auto-stand a hand that reached 21, busted, or is a one-card split ace. */
function maybeAutoStand(state: BlackjackState, index: number) {
  const hand = state.hands[index]
  const { total } = handTotal(hand.cards)
  if (hand.splitAces && hand.cards.length === 2) {
    hand.done = true
  } else if (total >= 21) {
    hand.done = true
  }
}

export function applyAction(state: BlackjackState, action: LegalAction): BlackjackState {
  const legal = legalActions(state)
  if (!legal.includes(action)) {
    throw new Error('ILLEGAL_ACTION')
  }

  if (action === 'insurance' || action === 'decline_insurance') {
    state.insuranceResolved = true
    if (action === 'insurance') {
      state.insurance = state.baseBet / 2
    }
    // If the player has a natural, resolve now against the peeked hole card.
    if (isBlackjack(state.hands[0].cards)) {
      state.dealerHoleShown = true
      state.phase = 'done'
      const hand = state.hands[0]
      if (isBlackjack(state.dealer)) {
        hand.outcome = 'push'
        hand.payout = hand.bet
      } else {
        hand.outcome = 'blackjack'
        hand.payout = hand.bet * 2.5
      }
      hand.done = true
      resolveInsurance(state)
      return state
    }
    // Dealer peeks for blackjack when showing an ace.
    if (isBlackjack(state.dealer)) {
      state.dealerHoleShown = true
      state.phase = 'done'
      for (const hand of state.hands) {
        hand.done = true
        hand.outcome = 'lose'
        hand.payout = 0
      }
      resolveInsurance(state)
      return state
    }
    return state
  }

  const hand = state.hands[state.active]

  switch (action) {
    case 'surrender': {
      hand.surrendered = true
      hand.done = true
      hand.outcome = 'lose'
      hand.payout = hand.bet * 0.5 // half back
      state.phase = 'done'
      break
    }
    case 'hit': {
      hand.cards.push(draw(state))
      const { total } = handTotal(hand.cards)
      if (total >= 21) {
        hand.done = true
        advanceHand(state)
      }
      break
    }
    case 'stand': {
      hand.done = true
      advanceHand(state)
      break
    }
    case 'double': {
      hand.bet *= 2
      hand.doubled = true
      hand.cards.push(draw(state))
      hand.done = true
      advanceHand(state)
      break
    }
    case 'split': {
      const [c1, c2] = hand.cards
      const splittingAces = c1.rank === 1
      const newHand: Hand = {
        cards: [c2],
        bet: state.baseBet,
        done: false,
        doubled: false,
        surrendered: false,
        splitAces: splittingAces,
        outcome: null,
        payout: 0,
      }
      hand.cards = [c1]
      hand.splitAces = splittingAces
      // Give the current hand its second card immediately.
      hand.cards.push(draw(state))
      state.hands.splice(state.active + 1, 0, newHand)
      maybeAutoStand(state, state.active)
      if (hand.done) advanceHand(state)
      break
    }
  }
  return state
}

function resolveInsurance(state: BlackjackState) {
  if (state.insurance > 0) {
    // Insurance pays 2:1 if dealer has blackjack. Payout returned separately.
    if (isBlackjack(state.dealer)) {
      // stake (insurance) + 2x winnings = 3x total returned on the side bet
      state.hands[0].payout += state.insurance * 3
    }
  }
}

/** Dealer draws to 17, hitting soft 17 (H17). */
function playDealer(state: BlackjackState) {
  state.dealerHoleShown = true

  // If every hand is bust/surrendered, dealer need not draw.
  const anyLive = state.hands.some(
    (h) => !h.surrendered && handTotal(h.cards).total <= 21,
  )
  if (anyLive) {
    while (true) {
      const { total, soft } = handTotal(state.dealer)
      if (total < 17 || (total === 17 && soft)) {
        state.dealer.push(draw(state))
      } else {
        break
      }
    }
  }

  const dealerTotal = handTotal(state.dealer).total
  const dealerBust = dealerTotal > 21

  for (const hand of state.hands) {
    if (hand.done && hand.outcome) continue // already settled (surrender/BJ)
    const playerTotal = handTotal(hand.cards).total
    if (playerTotal > 21) {
      hand.outcome = 'lose'
      hand.payout = 0
    } else if (dealerBust || playerTotal > dealerTotal) {
      hand.outcome = 'win'
      hand.payout = hand.bet * 2
    } else if (playerTotal < dealerTotal) {
      hand.outcome = 'lose'
      hand.payout = 0
    } else {
      hand.outcome = 'push'
      hand.payout = hand.bet
    }
    hand.done = true
  }

  resolveInsurance(state)
  state.phase = 'done'
}

/** Total amount the player staked this round (all hands + insurance). */
export function totalStaked(state: BlackjackState): number {
  return state.hands.reduce((sum, h) => sum + h.bet, 0) + state.insurance
}

/** Total returned to the player across all hands + insurance side bet. */
export function totalReturned(state: BlackjackState): number {
  return state.hands.reduce((sum, h) => sum + h.payout, 0)
}

/** Public view of state — hides the shoe and the hole card until revealed. */
export function publicState(state: BlackjackState) {
  return {
    dealer: state.dealerHoleShown ? state.dealer : [state.dealer[0]],
    dealerHoleShown: state.dealerHoleShown,
    dealerTotal: state.dealerHoleShown ? handTotal(state.dealer).total : null,
    hands: state.hands.map((h) => ({
      cards: h.cards,
      bet: h.bet,
      total: handTotal(h.cards).total,
      soft: handTotal(h.cards).soft,
      done: h.done,
      doubled: h.doubled,
      surrendered: h.surrendered,
      splitAces: h.splitAces,
      outcome: h.outcome,
      payout: h.payout,
    })),
    active: state.active,
    phase: state.phase,
    insurance: state.insurance,
    insuranceResolved: state.insuranceResolved,
    baseBet: state.baseBet,
  }
}
