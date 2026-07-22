import { type SupabaseClient } from '@supabase/supabase-js'
import { adjustBalance } from '@/lib/games/r2koins'
import {
  type BlackjackState,
  totalStaked,
  totalReturned,
  publicState,
  handTotal,
} from '@/lib/games/blackjack-v2'

/**
 * If the hand has reached the 'done' phase, credit the player's total return,
 * mark the DB row complete, and log the round to game_rounds. Idempotent-ish:
 * relies on the caller only invoking once per transition to 'done'.
 */
export async function finalizeIfDone(
  admin: SupabaseClient,
  userId: string,
  handRow: { id: string; server_seed_hash: string; client_seed: string; nonce: number },
  state: BlackjackState,
): Promise<number> {
  if (state.phase !== 'done') return 0

  const staked = totalStaked(state)
  const returned = totalReturned(state)

  if (returned > 0) {
    await adjustBalance(admin, userId, returned)
  }

  await admin
    .from('blackjack_hands')
    .update({ state: state as unknown as Record<string, unknown>, status: 'complete', updated_at: new Date().toISOString() })
    .eq('id', handRow.id)

  await admin.from('game_rounds').insert({
    user_id: userId,
    game: 'blackjack',
    bet_amount: staked,
    payout: returned,
    profit: returned - staked,
    server_seed_hash: handRow.server_seed_hash,
    client_seed: handRow.client_seed,
    nonce: handRow.nonce,
    outcome: {
      dealer: state.dealer,
      dealerTotal: handTotal(state.dealer).total,
      hands: state.hands.map((h) => ({
        cards: h.cards,
        total: handTotal(h.cards).total,
        bet: h.bet,
        outcome: h.outcome,
        payout: h.payout,
      })),
      insurance: state.insurance,
    },
  })

  return returned
}

export function viewFor(state: BlackjackState) {
  return publicState(state)
}
