import { NextResponse } from 'next/server'
import {
  hashServerSeed,
  limboMultiplier,
  fairKenoDraw,
  fairPlinkoSlot,
} from '@/lib/games/provably-fair'
import { KENO_GRID, KENO_DRAWN } from '@/lib/games/keno-config'

/**
 * Public, stateless verification. Given the revealed server seed, client seed,
 * nonce and game, it reproduces the raw fair outcome and confirms the server
 * seed matches its published hash.
 */
export async function POST(req: Request) {
  let body: {
    game?: string
    serverSeed?: string
    clientSeed?: string
    nonce?: number
    params?: Record<string, unknown>
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }

  const { game, serverSeed, clientSeed, nonce } = body
  if (!game || !serverSeed || !clientSeed || nonce === undefined) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }

  const serverSeedHash = hashServerSeed(serverSeed)
  let outcome: Record<string, unknown> = {}

  switch (game) {
    case 'limbo': {
      const multiplier = limboMultiplier(serverSeed, clientSeed, nonce)
      outcome = { multiplier }
      break
    }
    case 'keno': {
      const drawn = fairKenoDraw(KENO_GRID, KENO_DRAWN, serverSeed, clientSeed, nonce)
      outcome = { drawn }
      break
    }
    case 'plinko': {
      const rows = Number(body.params?.rows) || 16
      const slot = fairPlinkoSlot(rows, serverSeed, clientSeed, nonce)
      outcome = { slot, rows }
      break
    }
    default:
      return NextResponse.json({ error: 'unsupported game' }, { status: 400 })
  }

  return NextResponse.json({ serverSeedHash, game, nonce, outcome })
}
