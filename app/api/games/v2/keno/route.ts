import { NextResponse } from 'next/server'
import { adminClient, getAuthUser } from '@/lib/games/r2koins'
import { settleRound } from '@/lib/games/engine'
import { fairKenoDraw } from '@/lib/games/provably-fair'
import {
  KENO_GRID,
  KENO_DRAWN,
  KENO_MAX_PICKS,
  kenoMultiplier,
  type KenoRisk,
} from '@/lib/games/keno-config'

const MIN_BET = 1
const MAX_BET = 1_000_000
const RISKS: KenoRisk[] = ['low', 'medium', 'high']
const round2 = (n: number) => Math.round(n * 100) / 100

export async function POST(req: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { betAmount?: number; picks?: number[]; risk?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }

  const betAmount = round2(Number(body.betAmount))
  const risk = (body.risk ?? '') as KenoRisk
  const picksRaw = Array.isArray(body.picks) ? body.picks : []

  if (!Number.isFinite(betAmount) || betAmount < MIN_BET || betAmount > MAX_BET) {
    return NextResponse.json({ error: 'invalid bet amount' }, { status: 400 })
  }
  if (!RISKS.includes(risk)) {
    return NextResponse.json({ error: 'invalid risk' }, { status: 400 })
  }

  // Sanitize picks: unique integers within [1, GRID], count 1..MAX_PICKS.
  const picks = Array.from(new Set(picksRaw.map((n) => Math.trunc(Number(n)))))
  if (
    picks.length < 1 ||
    picks.length > KENO_MAX_PICKS ||
    picks.some((n) => !Number.isInteger(n) || n < 1 || n > KENO_GRID)
  ) {
    return NextResponse.json({ error: 'invalid picks' }, { status: 400 })
  }

  const admin = adminClient()

  try {
    const settled = await settleRound(admin, user.id, 'keno', betAmount, (ss, cs, nonce) => {
      const drawn = fairKenoDraw(KENO_GRID, KENO_DRAWN, ss, cs, nonce)
      const drawnSet = new Set(drawn)
      const matched = picks.filter((n) => drawnSet.has(n)).length
      const multiplier = kenoMultiplier(risk, picks.length, matched)
      const payout = round2(betAmount * multiplier)
      return {
        payout,
        multiplier,
        outcome: { picks, drawn, matched, multiplier, risk },
      }
    })

    const o = settled.outcome as {
      picks: number[]
      drawn: number[]
      matched: number
      multiplier: number
    }
    return NextResponse.json({
      picks: o.picks,
      drawn: o.drawn,
      matched: o.matched,
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
