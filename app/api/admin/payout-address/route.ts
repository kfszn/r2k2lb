import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET — look up a player's saved payout addresses by their platform username,
// so admins can auto-fill USDT/SOL when processing a reward claim without
// having to ask the player again.
export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username')?.trim()
  const platform = req.nextUrl.searchParams.get('platform')?.trim()

  if (!username) {
    return NextResponse.json({ error: 'username is required' }, { status: 400 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let query = admin
    .from('profiles')
    .select('usdt_address, sol_address, roobet_username, luxdrop_username')

  if (platform === 'roobet') {
    query = query.ilike('roobet_username', username)
  } else if (platform === 'luxdrop') {
    query = query.ilike('luxdrop_username', username)
  } else {
    query = query.or(`roobet_username.ilike.${username},luxdrop_username.ilike.${username}`)
  }

  const { data, error } = await query.maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ found: false })

  return NextResponse.json({
    found: true,
    usdt_address: data.usdt_address ?? null,
    sol_address: data.sol_address ?? null,
  })
}
