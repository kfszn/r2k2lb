import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Initialize inside the handler so missing env vars return a clean error
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'server_misconfigured', message: 'Missing Supabase environment variables' },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  let body: { account_id?: string; kick_username?: string }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const { account_id, kick_username } = body

  if (!account_id || !kick_username) {
    return NextResponse.json(
      { error: 'missing_fields', message: 'account_id and kick_username are required' },
      { status: 400 }
    )
  }

  // Normalize
  const normalizedAccountId = account_id.trim().toUpperCase()
  const normalizedKickUsername = kick_username.trim().toLowerCase()

  // 1. Find the profile by account_id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, account_id, kick_username')
    .eq('account_id', normalizedAccountId)
    .maybeSingle()

  if (profileError) {
    return NextResponse.json({ error: 'db_error', message: profileError.message }, { status: 500 })
  }

  if (!profile) {
    return NextResponse.json(
      { error: 'not_found', message: `No account found with ID ${normalizedAccountId}` },
      { status: 404 }
    )
  }

  // 2. Check if this profile already has a kick_username linked
  if (profile.kick_username) {
    return NextResponse.json(
      {
        error: 'already_linked',
        message: `Account ${normalizedAccountId} is already linked to Kick user @${profile.kick_username}`,
      },
      { status: 409 }
    )
  }

  // 3. Check if the kick_username is already linked to a different account
  const { data: existingKick, error: existingError } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('kick_username', normalizedKickUsername)
    .maybeSingle()

  if (existingError) {
    return NextResponse.json({ error: 'db_error', message: existingError.message }, { status: 500 })
  }

  if (existingKick) {
    return NextResponse.json(
      {
        error: 'kick_already_linked',
        message: `Kick user @${normalizedKickUsername} is already linked to a different account`,
      },
      { status: 409 }
    )
  }

  // 4. Link the kick_username to this profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ kick_username: normalizedKickUsername })
    .eq('id', profile.id)

  if (updateError) {
    return NextResponse.json({ error: 'db_error', message: updateError.message }, { status: 500 })
  }

  return NextResponse.json(
    {
      success: true,
      message: `Successfully linked Kick account @${normalizedKickUsername} to ${normalizedAccountId}`,
      account_id: normalizedAccountId,
      kick_username: normalizedKickUsername,
    },
    { status: 200 }
  )
}
