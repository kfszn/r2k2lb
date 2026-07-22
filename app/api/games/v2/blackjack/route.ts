import { NextResponse } from 'next/server'
import { getAuthUser, adminClient } from '@/lib/games/r2koins'
import { type BlackjackState, totalStaked, legalActions } from '@/lib/games/blackjack-v2'
import { viewFor } from '@/lib/games/blackjack-service'

/** Returns the user's active (in-progress) blackjack hand, if any. */
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = adminClient()
  const { data: row } = await admin
    .from('blackjack_hands')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .maybeSingle()

  if (!row) return NextResponse.json({ active: null })

  const state = row.state as BlackjackState
  return NextResponse.json({
    active: {
      handId: row.id,
      state: viewFor(state),
      legal: legalActions(state),
      serverSeedHash: row.server_seed_hash,
      clientSeed: row.client_seed,
      nonce: row.nonce,
      staked: totalStaked(state),
    },
  })
}
