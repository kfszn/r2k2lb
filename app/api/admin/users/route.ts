import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id, account_id, email, points, created_at,
      kick_id, kick_username, kick_avatar, kick_linked_at,
      acebet_id, acebet_id_suffix, acebet_username, acebet_linked_at,
      discord_id, discord_username, discord_linked_at
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ users: data ?? [] })
}
