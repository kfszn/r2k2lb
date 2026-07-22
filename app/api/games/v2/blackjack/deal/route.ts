import { NextResponse } from 'next/server'
import { getAuthUser, adminClient, adjustBalance, getBalance } from '@/lib/games/r2koins'
import { getOrCreateActiveSeed, consumeNonce } from '@/lib/games/seeds'
import { deal, totalStaked, legalActions } from '@/lib/games/blackjack-v2'
import { finalizeIfDone, viewFor } from '@/lib/games/blackjack-service'

export async function POST(req: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const bet = Number(body.bet)
  if (!Number.isFinite(bet) || bet <= 0) {
    return NextResponse.json({ error: 'invalid_bet' }, { status: 400 })
  }

  const admin = adminClient()

  // Refuse if the user already has an active hand.
  const { data: active } = await admin
    .from('blackjack_hands')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()
  if (active) {
    return NextResponse.json({ error: 'hand_in_progress', handId: active.id }, { status: 409 })
  }

  const seed = await getOrCreateActiveSeed(admin, user.id)
  const nonce = await consumeNonce(admin, seed)

  // Deduct the base bet up front.
  try {
    await adjustBalance(admin, user.id, -bet)
  } catch (e) {
    if ((e as Error).message === 'INSUFFICIENT_FUNDS') {
      return NextResponse.json({ error: 'insufficient_funds' }, { status: 400 })
    }
    throw e
  }

  const state = deal(seed.server_seed, seed.client_seed, nonce, bet)

  const { data: row, error } = await admin
    .from('blackjack_hands')
    .insert({
      user_id: user.id,
      bet_amount: bet,
      server_seed: seed.server_seed,
      server_seed_hash: seed.server_seed_hash,
      client_seed: seed.client_seed,
      nonce,
      state: state as unknown as Record<string, unknown>,
      status: state.phase === 'done' ? 'complete' : 'active',
    })
    .select('id, server_seed_hash, client_seed, nonce')
    .single()

  if (error) throw error

  // If the deal produced an immediate resolution (player natural), finalize.
  let payout = 0
  if (state.phase === 'done') {
    payout = await finalizeIfDone(admin, user.id, row, state)
  }

  const balance = await getBalance(admin, user.id)

  return NextResponse.json({
    handId: row.id,
    state: viewFor(state),
    legal: state.phase === 'done' ? [] : legalActions(state),
    serverSeedHash: seed.server_seed_hash,
    clientSeed: seed.client_seed,
    nonce,
    staked: totalStaked(state),
    payout,
    balance,
    done: state.phase === 'done',
  })
}
