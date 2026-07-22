import { NextResponse } from 'next/server'
import { adminClient, getAuthUser } from '@/lib/games/r2koins'
import { settleRound } from '@/lib/games/engine'
import { limboMultiplier } from '@/lib/games/provably-fair'

const MIN_BET = 1
const MAX_BET = 1_000_000
const MIN_TARGET = 1.01
const MAX_TARGET = 1_000_000

const round2 = (n: number) => Math.round(n * 100) / 100

export async function POST(req: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { betAmount?: number; target?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }

  const betAmount = round2(Number(body.betAmount))
  const target = round2(Number(body.target))

  if (!Number.isFinite(betAmount) || betAmount < MIN_BET || betAmount > MAX_BET) {
    return NextResponse.json({ error: 'invalid bet amount' }, { status: 400 })
  }
  if (!Number.isFinite(target) || target < MIN_TARGET || target > MAX_TARGET) {
    return NextResponse.json({ error: 'invalid target' }, { status: 400 })
  }

  const admin = adminClient()

  try {
    const settled = await settleRound(admin, user.id, 'limbo', betAmount, (ss, cs, nonce) => {
      const rolled = limboMultiplier(ss, cs, nonce)
      const win = rolled >= target
      const payout = win ? round2(betAmount * target) : 0
      return {
        payout,
        multiplier: win ? target : 0,
        outcome: { rolled, target, win },
      }
    })

    return NextResponse.json({
      rolled: (settled.outcome as { rolled: number }).rolled,
      target,
      win: (settled.outcome as { win: boolean }).win,
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
