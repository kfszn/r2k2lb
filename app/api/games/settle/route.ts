import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const MAX_PAYOUT = 20000

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getAuthedProfile() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = getAdmin()
  const { data } = await admin.from('profiles').select('id, points').eq('id', user.id).single()
  return data
}

// POST /api/games/settle — called once at end of a blackjack hand
// Body: { game, wager, outcome, payout, playerHand, dealerHand }
export async function POST(req: NextRequest) {
  const profile = await getAuthedProfile()
  if (!profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: {
    game?: string
    wager?: number
    outcome?: string
    payout?: number
    playerHand?: string[]
    dealerHand?: string[]
    doubled?: boolean
  }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }) }

  const { game, wager, outcome, payout: claimedPayout, playerHand, dealerHand, doubled } = body

  if (game !== 'blackjack') return NextResponse.json({ error: 'unsupported game' }, { status: 400 })

  // Client sends the already-effective wager (doubled amount if applicable) — do NOT multiply again
  const effectiveWager = Math.round(wager ?? 0)

  if (effectiveWager < 1) {
    return NextResponse.json({ error: 'invalid wager' }, { status: 400 })
  }
  if (effectiveWager > 5000) {
    return NextResponse.json({ error: 'wager exceeds maximum of 5000' }, { status: 400 })
  }
  if (profile.points < effectiveWager) {
    return NextResponse.json({ error: 'insufficient_points' }, { status: 400 })
  }

  // Cap payout server-side — never trust client payout directly
  const payout = Math.min(Math.round(claimedPayout ?? 0), MAX_PAYOUT)
  const profit = payout - effectiveWager
  const newPoints = Math.max(0, profile.points - effectiveWager + payout)

  const admin = getAdmin()

  const { error: updateError } = await admin
    .from('profiles')
    .update({ points: newPoints })
    .eq('id', profile.id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Log to game_bets — provably-fair fields are null for client-side blackjack
  await admin.from('game_bets').insert({
    profile_id: profile.id,
    game: 'blackjack',
    wager: effectiveWager,
    payout,
    profit,
    server_seed_hash: 'client-side',
    client_seed: 'client-side',
    nonce: 0,
    result: { playerHand, dealerHand, outcome, doubled: doubled ?? false },
  })

  // Log point transactions
  await admin.from('point_transactions').insert([
    { profile_id: profile.id, amount: -effectiveWager, type: 'game_loss', description: 'blackjack wager' },
    ...(payout > 0 ? [{ profile_id: profile.id, amount: payout, type: 'game_win', description: 'blackjack payout' }] : []),
  ])

  return NextResponse.json({ success: true, payout, profit, new_balance: newPoints })
}
