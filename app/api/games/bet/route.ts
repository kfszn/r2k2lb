import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import {
  generateServerSeed, hashServerSeed,
  fairKenoDraw, fairPlinkoSlot, fairBlackjackDeck,
  handValue
} from '@/lib/games/provably-fair'

const MAX_PAYOUT = 20000

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getProfile() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = getAdmin()
  const { data } = await admin.from('profiles').select('id, points, manual_award_balance, manual_award_wagered').eq('id', user.id).single()
  return data
}

// Keno multiplier tables (30-number grid, 10 drawn, pick 1–6)
const KENO_MULTIPLIERS: Record<string, Record<number, Record<number, number>>> = {
  classic: {
    1: { 1: 3 },
    2: { 2: 7,   1: 0 },
    3: { 3: 27,  2: 2,  1: 0 },
    4: { 4: 90,  3: 3,  2: 1 },
    5: { 5: 250, 4: 7,  3: 2, 2: 0 },
    6: { 6: 750, 5: 18, 4: 4, 3: 1 },
  },
  low: {
    1: { 1: 2 },
    2: { 2: 4, 1: 1 },
    3: { 3: 8, 2: 2, 1: 0.5 },
    4: { 4: 15, 3: 3, 2: 1 },
    5: { 5: 30, 4: 6, 3: 2, 2: 0.5 },
    6: { 6: 60, 5: 12, 4: 4, 3: 1 },
  },
  medium: {
    1: { 1: 2.5 },
    2: { 2: 6, 1: 0.5 },
    3: { 3: 15, 2: 2 },
    4: { 4: 40, 3: 4, 2: 1 },
    5: { 5: 100, 4: 10, 3: 2 },
    6: { 6: 300, 5: 20, 4: 5, 3: 2 },
  },
  high: {
    1: { 1: 3 },
    2: { 2: 10 },
    3: { 3: 30, 2: 1 },
    4: { 4: 100, 3: 5 },
    5: { 5: 300, 4: 15, 3: 2 },
    6: { 6: 1000, 5: 50, 4: 8, 3: 2 },
  },
}

// 17 slots (0-16) for 16 rows — must match client PLINKO_MULTIPLIERS exactly
const PLINKO_MULTIPLIERS: Record<string, number[]> = {
  low:    [15.5, 8.73, 1.94, 1.35, 1.35, 1.16, 1.07, 0.97, 0.49, 0.97, 1.07, 1.16, 1.35, 1.35, 1.94, 8.73, 15.5],
  medium: [106,  39.7, 9.68, 4.84, 2.9,  1.46, 0.97, 0.49, 0.29, 0.49, 0.97, 1.46, 2.9,  4.84, 9.68, 39.7, 106],
  high:   [968,  126,  25.2, 8.71, 3.87, 1.93, 0.2,  0.2,  0.2,  0.2,  0.2,  1.93, 3.87, 8.71, 25.2, 126,  968],
}

function calcBlackjack(deck: string[], gameData: { action?: string; playerCards?: string[]; dealerCards?: string[] }, wager: number) {
  // Deal initial hands
  const playerCards = [deck[0], deck[2]]
  const dealerCards = [deck[1], deck[3]]
  let cardIndex = 4

  let playerHand = [...playerCards]
  let dealerHand = [...dealerCards]

  const playerBJ = handValue(playerHand) === 21
  const dealerBJ = handValue(dealerHand) === 21

  if (playerBJ && dealerBJ) return { playerHand, dealerHand, outcome: 'push', payout: wager, cardIndex }
  if (playerBJ) return { playerHand, dealerHand, outcome: 'blackjack', payout: Math.min(wager * 2, MAX_PAYOUT), cardIndex }
  if (dealerBJ) return { playerHand, dealerHand, outcome: 'dealer_blackjack', payout: 0, cardIndex }

  const action = gameData?.action || 'stand'

  if (action === 'hit') {
    playerHand.push(deck[cardIndex++])
    if (handValue(playerHand) > 21) {
      return { playerHand, dealerHand, outcome: 'bust', payout: 0, cardIndex }
    }
  }

  if (action === 'double') {
    playerHand.push(deck[cardIndex++])
    const doubled = wager * 2
    if (handValue(playerHand) > 21) {
      return { playerHand, dealerHand, outcome: 'bust', payout: 0, cardIndex, doubled: true }
    }
    // Fall through to dealer play with doubled wager
    wager = doubled
  }

  // Dealer plays: stand on soft 17
  while (handValue(dealerHand) < 17) {
    dealerHand.push(deck[cardIndex++])
  }

  const pv = handValue(playerHand)
  const dv = handValue(dealerHand)

  if (dv > 21) return { playerHand, dealerHand, outcome: 'dealer_bust', payout: Math.min(wager * 2, MAX_PAYOUT), cardIndex }
  if (pv > dv) return { playerHand, dealerHand, outcome: 'win', payout: Math.min(wager * 2, MAX_PAYOUT), cardIndex }
  if (pv < dv) return { playerHand, dealerHand, outcome: 'lose', payout: 0, cardIndex }
  return { playerHand, dealerHand, outcome: 'push', payout: wager, cardIndex }
}

export async function POST(req: NextRequest) {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { game?: string; wager?: number; gameData?: Record<string, unknown> }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }) }

  const { game, wager, gameData } = body

  if (!['blackjack', 'keno', 'plinko'].includes(game ?? '')) {
    return NextResponse.json({ error: 'invalid game' }, { status: 400 })
  }
  if (typeof wager !== 'number' || wager < 1 || !Number.isInteger(wager)) {
    return NextResponse.json({ error: 'wager must be an integer >= 1' }, { status: 400 })
  }
  if (profile.points < wager) {
    return NextResponse.json({ error: 'insufficient_points' }, { status: 400 })
  }

  const admin = getAdmin()

  // Fetch or create user seeds
  let { data: seeds } = await admin.from('user_seeds').select('*').eq('profile_id', profile.id).single()
  if (!seeds) {
    const activeSeed = generateServerSeed()
    const nextSeed = generateServerSeed()
    const { data: newSeeds } = await admin.from('user_seeds').insert({
      profile_id: profile.id,
      client_seed: randomBytes(16).toString('hex'),
      nonce: 0,
      active_server_seed: activeSeed,
      active_server_seed_hash: hashServerSeed(activeSeed),
      next_server_seed: nextSeed,
      next_server_seed_hash: hashServerSeed(nextSeed),
    }).select().single()
    seeds = newSeeds
  }

  const { active_server_seed: serverSeed, client_seed: clientSeed, nonce } = seeds

  // Calculate game result
  let resultData: Record<string, unknown> = {}
  let rawPayout = 0

  if (game === 'blackjack') {
    const deck = fairBlackjackDeck(serverSeed, clientSeed, nonce)
    const bj = calcBlackjack(deck, (gameData ?? {}) as { action?: string }, wager)
    rawPayout = bj.payout
    resultData = { playerHand: bj.playerHand, dealerHand: bj.dealerHand, outcome: bj.outcome }
  }

  if (game === 'keno') {
    const picks = (gameData?.picks as number[]) ?? []
    const risk = (gameData?.risk as string) ?? 'medium'
    if (picks.length < 1 || picks.length > 6) return NextResponse.json({ error: 'pick 1-6 numbers' }, { status: 400 })
    const drawn = fairKenoDraw(30, 10, serverSeed, clientSeed, nonce)
    const matched = picks.filter(p => drawn.includes(p)).length
    const multiplierTable = KENO_MULTIPLIERS[risk]?.[picks.length] ?? {}
    const multiplier = multiplierTable[matched] ?? 0
    rawPayout = Math.floor(wager * multiplier)
    resultData = { picks, drawn, matched, multiplier, risk }
  }

  if (game === 'plinko') {
    const risk = (gameData?.risk as string) ?? 'medium'
    const rows = 16
    const slot = fairPlinkoSlot(rows, serverSeed, clientSeed, nonce)
    const multipliers = PLINKO_MULTIPLIERS[risk] ?? PLINKO_MULTIPLIERS.medium
    const multiplier = multipliers[slot] ?? 0
    rawPayout = Math.floor(wager * multiplier)
    resultData = { slot, multiplier, risk, rows }
  }

  // Hard cap
  const payout = Math.min(rawPayout, MAX_PAYOUT)
  const profit = payout - wager
  const newPoints = Math.max(0, profile.points - wager + payout)

  // Track wager toward play-through requirement
  let updateData: any = { points: newPoints }
  if ((profile.manual_award_balance ?? 0) > 0) {
    const wagerTowardPlaythrough = Math.min(wager, profile.manual_award_balance)
    updateData.manual_award_wagered = (profile.manual_award_wagered ?? 0) + wagerTowardPlaythrough
  }

  // Update points
  const { error: updateError } = await admin.from('profiles').update(updateData).eq('id', profile.id)
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Increment nonce
  await admin.from('user_seeds').update({ nonce: nonce + 1 }).eq('profile_id', profile.id)

  // Log bet
  await admin.from('game_bets').insert({
    profile_id: profile.id,
    game,
    wager,
    payout,
    profit,
    server_seed: serverSeed,
    server_seed_hash: hashServerSeed(serverSeed),
    client_seed: clientSeed,
    nonce,
    result: resultData,
  })

  // Log point transactions
  await admin.from('point_transactions').insert([
    { profile_id: profile.id, amount: -wager, type: 'game_loss', description: `${game} wager` },
    ...(payout > 0 ? [{ profile_id: profile.id, amount: payout, type: 'game_win', description: `${game} payout` }] : []),
  ])

  return NextResponse.json({
    success: true,
    result: resultData,
    wager,
    payout,
    profit,
    new_balance: newPoints,
    server_seed: serverSeed,
    server_seed_hash: hashServerSeed(serverSeed),
    client_seed: clientSeed,
    nonce,
  })
}
