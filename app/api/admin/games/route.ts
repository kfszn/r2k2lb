import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [statsResult, recentResult] = await Promise.all([
    admin.from('game_bets').select('wager, payout, game'),
    admin.from('game_bets')
      .select('id, game, wager, payout, profit, result, created_at, profile_id')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const bets = statsResult.data ?? []
  const totalBets = bets.length
  const totalWagered = bets.reduce((s, b) => s + (b.wager ?? 0), 0)
  const totalPaidOut = bets.reduce((s, b) => s + (b.payout ?? 0), 0)
  const houseProfit = totalWagered - totalPaidOut

  // Per-game breakdown
  const byGame: Record<string, { bets: number; wagered: number; paidOut: number }> = {}
  for (const b of bets) {
    if (!byGame[b.game]) byGame[b.game] = { bets: 0, wagered: 0, paidOut: 0 }
    byGame[b.game].bets++
    byGame[b.game].wagered += b.wager ?? 0
    byGame[b.game].paidOut += b.payout ?? 0
  }

  return NextResponse.json({
    stats: { totalBets, totalWagered, totalPaidOut, houseProfit },
    byGame,
    recentBets: recentResult.data ?? [],
  })
}
