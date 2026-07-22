import { type SupabaseClient } from '@supabase/supabase-js'
import { generateServerSeed, generateClientSeed, hashServerSeed } from './provably-fair'

export interface GameSeed {
  id: string
  user_id: string
  server_seed: string
  server_seed_hash: string
  client_seed: string
  nonce: number
  is_active: boolean
  created_at: string
  revealed_at: string | null
}

/** Returns the user's active seed pair, creating one if none exists. */
export async function getOrCreateActiveSeed(
  admin: SupabaseClient,
  userId: string,
): Promise<GameSeed> {
  const { data: existing } = await admin
    .from('game_seeds')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (existing) return existing as GameSeed

  const serverSeed = generateServerSeed()
  const { data: created, error } = await admin
    .from('game_seeds')
    .insert({
      user_id: userId,
      server_seed: serverSeed,
      server_seed_hash: hashServerSeed(serverSeed),
      client_seed: generateClientSeed(),
      nonce: 0,
      is_active: true,
    })
    .select('*')
    .single()

  if (error) throw error
  return created as GameSeed
}

/**
 * Consumes the current nonce for a round and advances it, using optimistic
 * concurrency so two concurrent rounds can't reuse the same nonce.
 * Returns the nonce that the caller should use for this round.
 */
export async function consumeNonce(
  admin: SupabaseClient,
  seed: GameSeed,
): Promise<number> {
  let current = seed.nonce
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await admin
      .from('game_seeds')
      .update({ nonce: current + 1 })
      .eq('id', seed.id)
      .eq('nonce', current)
      .select('nonce')
      .maybeSingle()

    if (!error && data) return current

    // Someone else advanced the nonce; re-read and retry.
    const { data: fresh } = await admin
      .from('game_seeds')
      .select('nonce')
      .eq('id', seed.id)
      .single()
    current = fresh?.nonce ?? current + 1
  }
  throw new Error('NONCE_CONTENTION')
}

/**
 * Rotates the active seed: reveals the current server seed and creates a new
 * active pair. Optionally accepts a user-provided client seed for the new pair.
 */
export async function rotateSeed(
  admin: SupabaseClient,
  userId: string,
  newClientSeed?: string,
): Promise<{ revealed: GameSeed | null; next: GameSeed }> {
  const current = await getOrCreateActiveSeed(admin, userId)

  await admin
    .from('game_seeds')
    .update({ is_active: false, revealed_at: new Date().toISOString() })
    .eq('id', current.id)

  const serverSeed = generateServerSeed()
  const { data: next, error } = await admin
    .from('game_seeds')
    .insert({
      user_id: userId,
      server_seed: serverSeed,
      server_seed_hash: hashServerSeed(serverSeed),
      client_seed: newClientSeed?.trim() || generateClientSeed(),
      nonce: 0,
      is_active: true,
    })
    .select('*')
    .single()

  if (error) throw error
  return { revealed: current, next: next as GameSeed }
}
