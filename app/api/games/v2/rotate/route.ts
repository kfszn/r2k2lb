import { NextResponse } from 'next/server'
import { adminClient, getAuthUser } from '@/lib/games/r2koins'
import { rotateSeed } from '@/lib/games/seeds'

export async function POST(req: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let clientSeed: string | undefined
  try {
    const body = await req.json()
    clientSeed = typeof body?.clientSeed === 'string' ? body.clientSeed : undefined
  } catch {
    // no body is fine
  }

  const admin = adminClient()
  const { revealed, next } = await rotateSeed(admin, user.id, clientSeed)

  return NextResponse.json({
    revealed: revealed
      ? {
          serverSeed: revealed.server_seed,
          serverSeedHash: revealed.server_seed_hash,
          clientSeed: revealed.client_seed,
          nonce: revealed.nonce,
        }
      : null,
    next: {
      serverSeedHash: next.server_seed_hash,
      clientSeed: next.client_seed,
      nonce: next.nonce,
    },
  })
}
