import crypto from 'crypto'

export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function generateClientSeed(): string {
  return crypto.randomBytes(8).toString('hex')
}

export function hashServerSeed(seed: string): string {
  return crypto.createHash('sha256').update(seed).digest('hex')
}

/**
 * High-precision uniform float in [0, 1) built from 4 bytes of an HMAC digest,
 * Stake-style. `cursor` lets a single (seed, nonce) produce a stream of floats.
 */
export function randomFloat(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  cursor = 0,
): number {
  const hmac = crypto.createHmac('sha256', serverSeed)
  hmac.update(`${clientSeed}:${nonce}:${cursor}`)
  const hex = hmac.digest('hex')
  let result = 0
  for (let i = 0; i < 4; i++) {
    const byte = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
    result += byte / 256 ** (i + 1)
  }
  return result
}

export function randomFloats(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  count: number,
): number[] {
  return Array.from({ length: count }, (_, i) => randomFloat(serverSeed, clientSeed, nonce, i))
}

/**
 * Limbo crash multiplier. Fair distribution is P(M >= x) = 1/x; applying the
 * house edge gives P(win at target T) = edge/T, so RTP = edge exactly.
 * Returned value is floored to 2 decimals, min 1.00, capped at maxMultiplier.
 */
export function limboMultiplier(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  houseEdge = 0.99,
  maxMultiplier = 1_000_000,
): number {
  const u = randomFloat(serverSeed, clientSeed, nonce)
  // Guard against u === 0 (would divide by zero) and u -> 1 (huge multiplier)
  const raw = houseEdge / (1 - u)
  const floored = Math.floor(raw * 100) / 100
  return Math.min(Math.max(1.0, floored), maxMultiplier)
}

export function getResult(serverSeed: string, clientSeed: string, nonce: number): number {
  const hmac = crypto.createHmac('sha256', serverSeed)
  hmac.update(`${clientSeed}:${nonce}`)
  const hex = hmac.digest('hex')
  const result = parseInt(hex.slice(0, 8), 16)
  return (result % 10000) / 100 // 0.00 - 99.99
}

export function getMultipleResults(serverSeed: string, clientSeed: string, nonce: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => {
    const hmac = crypto.createHmac('sha256', serverSeed)
    hmac.update(`${clientSeed}:${nonce}:${i}`)
    const hex = hmac.digest('hex')
    const val = parseInt(hex.slice(0, 8), 16)
    return (val % 10000) / 100
  })
}

// Shuffle an array using provably fair results
export function fairShuffle<T>(arr: T[], serverSeed: string, clientSeed: string, nonce: number): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const hmac = crypto.createHmac('sha256', serverSeed)
    hmac.update(`${clientSeed}:${nonce}:${i}`)
    const hex = hmac.digest('hex')
    const rand = parseInt(hex.slice(0, 8), 16)
    const j = rand % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Keno: draw `count` unique numbers from 1..max using fair shuffle
export function fairKenoDraw(max: number, count: number, serverSeed: string, clientSeed: string, nonce: number): number[] {
  const pool = Array.from({ length: max }, (_, i) => i + 1)
  const shuffled = fairShuffle(pool, serverSeed, clientSeed, nonce)
  return shuffled.slice(0, count).sort((a, b) => a - b)
}

// Plinko: simulate a ball dropping through `rows` rows, returns slot index (0 to rows)
export function fairPlinkoSlot(rows: number, serverSeed: string, clientSeed: string, nonce: number): number {
  let slot = 0
  for (let row = 0; row < rows; row++) {
    const hmac = crypto.createHmac('sha256', serverSeed)
    hmac.update(`${clientSeed}:${nonce}:plinko:${row}`)
    const hex = hmac.digest('hex')
    const val = parseInt(hex.slice(0, 8), 16)
    slot += val % 2 // 0 = left, 1 = right
  }
  return slot
}

// Blackjack: deal cards from a fair-shuffled deck
export function fairBlackjackDeck(serverSeed: string, clientSeed: string, nonce: number): string[] {
  const suits = ['S', 'H', 'D', 'C']
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
  const deck: string[] = []
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push(`${rank}${suit}`)
    }
  }
  return fairShuffle(deck, serverSeed, clientSeed, nonce)
}

export function cardValue(card: string): number {
  const rank = card.slice(0, -1)
  if (['J', 'Q', 'K'].includes(rank)) return 10
  if (rank === 'A') return 11
  return parseInt(rank)
}

export function handValue(hand: string[]): number {
  let total = hand.reduce((sum, card) => sum + cardValue(card), 0)
  let aces = hand.filter(c => c.startsWith('A')).length
  while (total > 21 && aces > 0) {
    total -= 10
    aces--
  }
  return total
}
