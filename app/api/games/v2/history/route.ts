import { NextResponse } from 'next/server'
import { adminClient, getAuthUser } from '@/lib/games/r2koins'

export async function GET(req: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const game = searchParams.get('game')
  const limit = Math.min(Number(searchParams.get('limit')) || 15, 50)

  const admin = adminClient()
  let query = admin
    .from('game_rounds')
    .select('id, game, bet_amount, payout, profit, server_seed_hash, client_seed, nonce, outcome, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (game) query = query.eq('game', game)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ rounds: data ?? [] })
}
