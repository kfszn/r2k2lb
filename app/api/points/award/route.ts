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

  // Check stream session cap (3,000 points per session)
  if (points > 0) {
    // Get stream session start time from settings
    const { data: settingsData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'stream_session_start')
      .maybeSingle()

    const sessionStart = settingsData?.value ? new Date(settingsData.value) : new Date(0)

    // Sum points earned in this session
    const { data: transactions, error: txnError } = await supabase
      .from('point_transactions')
      .select('amount')
      .eq('profile_id', profile.id)
      .eq('type', 'bot_award')
      .gte('created_at', sessionStart.toISOString())

    if (!txnError && transactions) {
      const sessionEarned = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0)
      const SESSION_CAP = 3000

      if (sessionEarned >= SESSION_CAP) {
        return NextResponse.json({ success: false, reason: 'session_cap_reached', session_earned: sessionEarned }, { status: 400 })
      }

      // Partial award if close to cap
      const pointsToAward = Math.min(points, SESSION_CAP - sessionEarned)
      if (pointsToAward < points) {
        const pointsAwarded = pointsToAward
        const newBalance = Math.max(0, (profile.points ?? 0) + pointsAwarded)

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ points: newBalance })
          .eq('id', profile.id)

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        await supabase.from('point_transactions').insert({
          profile_id: profile.id,
          amount: pointsAwarded,
          type: type ?? 'bot_award',
          description: description ?? `Bot award: ${pointsAwarded} points (capped at session limit)`,
        })

        return NextResponse.json({ 
          success: true, 
          new_balance: newBalance,
          points_awarded: pointsAwarded,
          reason: 'partial_award_session_cap',
          session_earned: sessionEarned + pointsAwarded
        })
      }
    }
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
