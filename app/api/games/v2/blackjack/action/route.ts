import { NextResponse } from 'next/server'
import { getAuthUser, adminClient, adjustBalance, getBalance } from '@/lib/games/r2koins'
import {
  type BlackjackState,
  type LegalAction,
  applyAction,
  legalActions,
  totalStaked,
} from '@/lib/games/blackjack-v2'
// legalActions is used both for validation and to advertise legal moves
import { finalizeIfDone, viewFor } from '@/lib/games/blackjack-service'

const ACTIONS: LegalAction[] = [
  'hit',
  'stand',
  'double',
  'split',
  'surrender',
  'insurance',
  'decline_insurance',
]

export async function POST(req: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const handId = String(body.handId || '')
  const action = body.action as LegalAction
  if (!handId || !ACTIONS.includes(action)) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }

  const admin = adminClient()

  const { data: row } = await admin
    .from('blackjack_hands')
    .select('*')
    .eq('id', handId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!row) {
    return NextResponse.json({ error: 'hand_not_found' }, { status: 404 })
  }

  const state = row.state as BlackjackState
  const stakedBefore = totalStaked(state)

  if (!legalActions(state).includes(action)) {
    return NextResponse.json({ error: 'illegal_action' }, { status: 400 })
  }

  // Apply the action (mutates state in place).
  try {
    applyAction(state, action)
  } catch {
    return NextResponse.json({ error: 'illegal_action' }, { status: 400 })
  }

  // Deduct any incremental stake (double/split/insurance).
  const delta = totalStaked(state) - stakedBefore
  if (delta > 0) {
    try {
      await adjustBalance(admin, user.id, -delta)
    } catch (e) {
      if ((e as Error).message === 'INSUFFICIENT_FUNDS') {
        return NextResponse.json({ error: 'insufficient_funds' }, { status: 400 })
      }
      throw e
    }
  }

  const rowRef = {
    id: row.id,
    server_seed_hash: row.server_seed_hash,
    client_seed: row.client_seed,
    nonce: row.nonce,
  }

  let payout = 0
  if (state.phase === 'done') {
    payout = await finalizeIfDone(admin, user.id, rowRef, state)
  } else {
    await admin
      .from('blackjack_hands')
      .update({ state: state as unknown as Record<string, unknown>, updated_at: new Date().toISOString() })
      .eq('id', row.id)
  }

  const balance = await getBalance(admin, user.id)

  return NextResponse.json({
    handId: row.id,
    state: viewFor(state),
    legal: state.phase === 'done' ? [] : legalActions(state),
    staked: totalStaked(state),
    payout,
    balance,
    done: state.phase === 'done',
  })
}
