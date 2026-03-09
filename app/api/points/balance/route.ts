import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const supabase = getSupabase()

  const { searchParams } = new URL(req.url)
  const kick_username = searchParams.get('kick_username')?.trim()

  if (!kick_username) {
    return NextResponse.json({ error: 'missing_kick_username' }, { status: 400 })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('account_id, points, kick_username')
    .ilike('kick_username', kick_username)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!profile) {
    return NextResponse.json({ error: 'not_linked' }, { status: 404 })
  }

  return NextResponse.json({
    kick_username: profile.kick_username,
    account_id: profile.account_id,
    points: profile.points ?? 0,
  })
}
