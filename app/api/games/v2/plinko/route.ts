import { NextResponse } from 'next/server'
import { adminClient, getAuthUser } from '@/lib/games/r2koins'
import { settleRound } from '@/lib/games/engine'
import { fairPlinkoSlot } from '@/lib/games/provably-fair'
import {
  PLINKO_ROWS_OPTIONS,
  PLINKO_RISKS,
  plinkoBuckets,
  type PlinkoRisk,
  type PlinkoRows,
} from '@/lib/games/plinko-config'

const MIN_BET = 1
const MAX_BET = 1_000_000
const round2 = (n: number) => Math.round(n * 100) / 100

export async function POST(req: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { betAmount?: number; rows?: number; risk?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }

  const betAmount = round2(Number(body.betAmount))
  const rows = Number(body.rows) as PlinkoRows
  const risk = (body.risk ?? '') as PlinkoRisk

  if (!Number.isFinite(betAmount) || betAmount < MIN_BET || betAmount > MAX_BET) {
    return NextResponse.json({ error: 'invalid bet amount' }, { status: 400 })
  }
  if (!PLINKO_ROWS_OPTIONS.includes(rows)) {
    return NextResponse.json({ error: 'invalid rows' }, { status: 400 })
  }
  if (!PLINKO_RISKS.includes(risk)) {
    return NextResponse.json({ error: 'invalid risk' }, { status: 400 })
  }

  const admin = adminClient()
  const buckets = plinkoBuckets(rows, risk)

  try {
    const settled = await settleRound(admin, user.id, 'plinko', betAmount, (ss, cs, nonce) => {
      const slot = fairPlinkoSlot(rows, ss, cs, nonce)
      const multiplier = buckets[slot] ?? 0
      const payout = round2(betAmount * multiplier)
      return {
        payout,
        multiplier,
        outcome: { slot, rows, risk, multiplier },
      }
    })

    const o = settled.outcome as { slot: number; multiplier: number }
    return NextResponse.json({
      slot: o.slot,
      rows,
      risk,
      multiplier: o.multiplier,
      payout: settled.payout,
      profit: settled.payout - betAmount,
      balance: settled.balance,
      nonce: settled.nonce,
      serverSeedHash: settled.serverSeedHash,
      clientSeed: settled.clientSeed,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error'
    if (msg === 'INSUFFICIENT_FUNDS') {
      return NextResponse.json({ error: 'Insufficient R2Koins balance' }, { status: 400 })
    }
    return NextResponse.json({ error: 'settle failed' }, { status: 500 })
  }
}
