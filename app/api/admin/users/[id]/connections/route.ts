import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function logAction(supabase: ReturnType<typeof getSupabase>, {
  target_profile_id, action, provider, old_value, new_value,
}: {
  target_profile_id: string
  action: string
  provider: string
  old_value?: string | null
  new_value?: string | null
}) {
  await supabase.from('account_connection_logs').insert({
    target_profile_id,
    action,
    provider,
    old_value: old_value ?? null,
    new_value: new_value ?? null,
  })
}

// PATCH — admin links/updates a connection on a profile
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getSupabase()

  const body = await req.json().catch(() => ({}))
  const { provider, ...fields } = body as { provider: string; [key: string]: string }

  if (!provider) return NextResponse.json({ error: 'provider required' }, { status: 400 })

  // Fetch current values for audit log
  const { data: current } = await supabase
    .from('profiles')
    .select('kick_id, kick_username, acebet_id, acebet_id_suffix, acebet_username, discord_id, discord_username')
    .eq('id', id)
    .maybeSingle()

  let updates: Record<string, string | null> = {}
  let old_value: string | null = null
  let new_value: string | null = null

  if (provider === 'acebet') {
    const rawSuffix = String(fields.acebet_id_suffix ?? '').trim().replace(/^AB-/i, '')
    if (!rawSuffix) return NextResponse.json({ error: 'acebet_id_suffix required' }, { status: 400 })
    const acebet_id = `AB-${rawSuffix}`
    updates = {
      acebet_id,
      acebet_id_suffix: rawSuffix,
      acebet_username: fields.acebet_username?.trim() || null,
      acebet_linked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    old_value = current?.acebet_id ?? null
    new_value = acebet_id
  } else if (provider === 'kick') {
    updates = {
      kick_id: fields.kick_id?.trim() || null,
      kick_username: fields.kick_username?.trim() || null,
      kick_avatar: fields.kick_avatar?.trim() || null,
      kick_linked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    old_value = current?.kick_id ?? null
    new_value = fields.kick_id?.trim() || null
  } else if (provider === 'discord') {
    updates = {
      discord_id: fields.discord_id?.trim() || null,
      discord_username: fields.discord_username?.trim() || null,
      discord_linked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    old_value = current?.discord_id ?? null
    new_value = fields.discord_id?.trim() || null
  } else {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  }

  const { error } = await supabase.from('profiles').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAction(supabase, { target_profile_id: id, action: 'admin_link', provider, old_value, new_value })
  return NextResponse.json({ success: true })
}

// DELETE — admin unlinks a provider from a profile
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getSupabase()

  const { provider } = await req.json().catch(() => ({}))
  if (!provider) return NextResponse.json({ error: 'provider required' }, { status: 400 })

  const { data: current } = await supabase
    .from('profiles')
    .select('kick_id, kick_username, acebet_id, discord_id')
    .eq('id', id)
    .maybeSingle()

  let updates: Record<string, null> = {}
  let old_value: string | null = null

  if (provider === 'kick') {
    updates = { kick_id: null, kick_username: null, kick_avatar: null, kick_linked_at: null }
    old_value = current?.kick_username ?? null
  } else if (provider === 'acebet') {
    updates = { acebet_id: null, acebet_id_suffix: null, acebet_username: null, acebet_linked_at: null }
    old_value = current?.acebet_id ?? null
  } else if (provider === 'discord') {
    updates = { discord_id: null, discord_username: null, discord_linked_at: null }
    old_value = current?.discord_id ?? null
  } else {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAction(supabase, { target_profile_id: id, action: 'admin_unlink', provider, old_value, new_value: null })
  return NextResponse.json({ success: true })
}
