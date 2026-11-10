import { NextResponse } from 'next/server'
import { findCurrentHunt, getHuntDb, loadEntries } from '@/lib/hunt/server'
import { computeHuntStats } from '@/lib/hunt/stats'

export const dynamic = 'force-dynamic'

// Public and read-only: returns only what the OBS widget displays (no usernames, no ids).
export async function GET() {
  const db = getHuntDb()
  const hunt = await findCurrentHunt(db)

  const headers = { 'Cache-Control': 'public, s-maxage=1, stale-while-revalidate=2' }
  if (!hunt) return NextResponse.json({ hunt: null }, { headers })

  const entries = await loadEntries(db, hunt.id)
  const stats = computeHuntStats(hunt.startBalance, entries)

  return NextResponse.json(
    {
      hunt: { number: hunt.number, name: hunt.name, currency: hunt.currency, status: hunt.status },
      stats: {
        start: stats.start,
        winnings: stats.winnings,
        totalBonuses: stats.totalBonuses,
        remaining: stats.remaining,
        runAverage: stats.runAverage,
        requiredAverage: stats.requiredAverage,
        best: stats.best,
        lucky: stats.lucky,
        nextPosition: stats.nextPosition,
      },
      entries: entries.map((e) => ({
        position: e.position,
        game: e.game,
        imageUrl: e.imageUrl,
        bet: e.betSize,
        payout: e.status === 'opened' ? e.payout : null,
        opened: e.status === 'opened' && e.payout !== null,
      })),
    },
    { headers }
  )
}
