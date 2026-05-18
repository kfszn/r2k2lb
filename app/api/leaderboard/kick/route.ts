import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    let query = supabaseAdmin
      .from('chatter_points')
      .select('kick_username, points, earned_at')

    if (start) {
      query = query.gte('earned_at', `${start}T00:00:00.000Z`)
    }
    if (end) {
      query = query.lte('earned_at', `${end}T23:59:59.999Z`)
    }

    const { data, error } = await query

    if (error) {
      console.error('[leaderboard/kick] Query error:', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    // Aggregate points per user
    const totals: Record<string, number> = {}
    for (const row of data ?? []) {
      const u = row.kick_username
      totals[u] = (totals[u] ?? 0) + Number(row.points)
    }

    const ranked = Object.entries(totals)
      .sort(([, a], [, b]) => b - a)
      .map(([kick_username, total_points], i) => ({
        rank: i + 1,
        kick_username,
        total_points: Math.round(total_points * 100) / 100,
      }))

    return NextResponse.json({
      ok: true,
      count: ranked.length,
      data: ranked,
      range: { start: start ?? null, end: end ?? null },
    })
  } catch (err) {
    console.error('[leaderboard/kick] Unexpected error:', err)
    return NextResponse.json({ ok: false, error: 'Internal server error.' }, { status: 500 })
  }
}
