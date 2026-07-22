import { NextResponse } from 'next/server'
import { adminClient, getAuthUser, ADMIN_EMAIL } from '@/lib/games/r2koins'

/**
 * Aggregate house performance across all game_rounds. Phase 1 scaffold:
 * returns totals + per-game breakdown with actual RTP. Expanded in Phase 5.
 */
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const admin = adminClient()

  const { data: rounds, error } = await admin
    .from('game_rounds')
    .select('game, bet_amount, payout, profit')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const perGame: Record<
    string,
    { rounds: number; wagered: number; paidOut: number; houseProfit: number; rtp: number }
  > = {}
  let totalWagered = 0
  let totalPaidOut = 0

  for (const r of rounds ?? []) {
    const g = r.game as string
    perGame[g] ??= { rounds: 0, wagered: 0, paidOut: 0, houseProfit: 0, rtp: 0 }
    perGame[g].rounds += 1
    perGame[g].wagered += Number(r.bet_amount)
    perGame[g].paidOut += Number(r.payout)
    perGame[g].houseProfit -= Number(r.profit) // house profit = -player profit
    totalWagered += Number(r.bet_amount)
    totalPaidOut += Number(r.payout)
  }

  for (const g of Object.keys(perGame)) {
    perGame[g].rtp = perGame[g].wagered > 0 ? perGame[g].paidOut / perGame[g].wagered : 0
  }

  return NextResponse.json({
    totals: {
      rounds: rounds?.length ?? 0,
      wagered: totalWagered,
      paidOut: totalPaidOut,
      houseProfit: totalWagered - totalPaidOut,
      rtp: totalWagered > 0 ? totalPaidOut / totalWagered : 0,
    },
    perGame,
  })
}
