import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()

  let body: { kick_username?: string; points?: number; type?: string; description?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const { kick_username, points, type, description } = body

  if (!kick_username || typeof points !== 'number' || points === 0) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  // Look up profile by kick_username (case insensitive)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, points, kick_username')
    .ilike('kick_username', kick_username.trim())
    .maybeSingle()

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // Silently skip if user not found or kick account not linked
  if (!profile || !profile.kick_username) {
    return NextResponse.json({ success: false, reason: 'not_found' }, { status: 404 })
  }

  const newBalance = Math.max(0, (profile.points ?? 0) + points)

  // Update points balance
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ points: newBalance })
    .eq('id', profile.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Log to point_transactions (non-fatal if table missing)
  await supabase.from('point_transactions').insert({
    profile_id: profile.id,
    amount: points,
    type: type ?? (points > 0 ? 'bot_award' : 'bot_deduct'),
    description: description ?? `Bot award: ${points} points`,
  })

  return NextResponse.json({ success: true, new_balance: newBalance })
}
