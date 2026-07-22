import { type SupabaseClient } from '@supabase/supabase-js'
import { adjustBalance } from './r2koins'
import { getOrCreateActiveSeed, consumeNonce } from './seeds'

export type GameName = 'blackjack' | 'keno' | 'plinko' | 'limbo'

export interface RoundResult {
  /** Total returned to the player (stake * multiplier). 0 for a loss. */
  payout: number
  /** Effective multiplier applied to the stake (payout / bet). */
  multiplier: number
  /** Game-specific detail persisted to game_rounds.outcome. */
  outcome: Record<string, unknown>
}

export interface SettledRound extends RoundResult {
  balance: number
  serverSeedHash: string
  clientSeed: string
  nonce: number
  roundId: string
}

/**
 * Runs a full single-step wagered round atomically:
 * 1. Deducts the stake (guarded — throws INSUFFICIENT_FUNDS).
 * 2. Computes the outcome from the active provably-fair seed + nonce.
 * 3. Credits any payout.
 * 4. Records the round in game_rounds.
 *
 * `compute` receives the revealed seed material for this round and returns the
 * result. It must be pure (no side effects) so the outcome is reproducible.
 */
export async function settleRound(
  admin: SupabaseClient,
  userId: string,
  game: GameName,
  betAmount: number,
  compute: (serverSeed: string, clientSeed: string, nonce: number) => RoundResult,
): Promise<SettledRound> {
  const seed = await getOrCreateActiveSeed(admin, userId)
  const nonce = await consumeNonce(admin, seed)

  // Deduct stake first (atomic, guarded against overdraw).
  await adjustBalance(admin, userId, -betAmount)

  const result = compute(seed.server_seed, seed.client_seed, nonce)

  // Credit payout (if any).
  let balance: number
  if (result.payout > 0) {
    balance = await adjustBalance(admin, userId, result.payout)
  } else {
    const { data } = await admin
      .from('r2koins_balance')
      .select('balance')
      .eq('kick_user_id', userId)
      .maybeSingle()
    balance = data ? Number(data.balance) : 0
  }

  const profit = result.payout - betAmount

  const { data: round, error } = await admin
    .from('game_rounds')
    .insert({
      user_id: userId,
      game,
      bet_amount: betAmount,
      payout: result.payout,
      profit,
      server_seed_hash: seed.server_seed_hash,
      client_seed: seed.client_seed,
      nonce,
      outcome: result.outcome,
    })
    .select('id')
    .single()

  if (error) throw error

  return {
    ...result,
    balance,
    serverSeedHash: seed.server_seed_hash,
    clientSeed: seed.client_seed,
    nonce,
    roundId: round.id as string,
  }
}
