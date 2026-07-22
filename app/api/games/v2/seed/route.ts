import { NextResponse } from 'next/server'
import { adminClient, getAuthUser, getBalance } from '@/lib/games/r2koins'
import { getOrCreateActiveSeed } from '@/lib/games/seeds'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = adminClient()
  const seed = await getOrCreateActiveSeed(admin, user.id)
  const balance = await getBalance(admin, user.id)

  return NextResponse.json({
    serverSeedHash: seed.server_seed_hash,
    clientSeed: seed.client_seed,
    nonce: seed.nonce,
    balance,
  })
}
