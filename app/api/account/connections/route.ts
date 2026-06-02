import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// GET — return connection data for the logged-in user
export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id, account_id, email, points, created_at,
      kick_id, kick_username, kick_avatar, kick_linked_at,
      acebet_id, acebet_id_suffix, acebet_username, acebet_linked_at,
      discord_id, discord_username, discord_linked_at
    `)
    .eq('id', session.user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}

// POST — user links their Acebet account by ID suffix
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const rawSuffix: string = String(body.acebet_id_suffix ?? '').trim().replace(/^AB-/i, '')

  if (!rawSuffix || !/^\d+$/.test(rawSuffix)) {
    return NextResponse.json({ error: 'Invalid Acebet ID. Enter only the numeric suffix.' }, { status: 400 })
  }

  const acebet_id_suffix = rawSuffix
  const acebet_id = `AB-${rawSuffix}`

  // Verify the ID exists in Acebet leaderboard data
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Call our own leaderboard API to look up the user
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.r2k2.gg'
  let acebet_username: string | null = null
  try {
    const lbRes = await fetch(`${siteUrl}/api/leaderboard?fresh=1`)
    if (lbRes.ok) {
      const lbData = await lbRes.json()
      const found = (lbData.data ?? []).find((u: { userId: number | string }) => String(u.userId) === rawSuffix)
      if (!found) {
        return NextResponse.json({ error: `No Acebet account with ID AB-${rawSuffix} was found under affiliate code R2K2. Make sure you have wagered with code R2K2.` }, { status: 404 })
      }
      acebet_username = found.name ?? null
    }
  } catch {
    // If leaderboard fetch fails, still allow linking but skip username
  }

  // Check not already taken by another profile
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('acebet_id', acebet_id)
    .neq('id', session.user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'This Acebet ID is already linked to another account.' }, { status: 409 })
  }

  const { error } = await admin
    .from('profiles')
    .update({
      acebet_id,
      acebet_id_suffix,
      acebet_username,
      acebet_linked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, acebet_id, acebet_username })
}

// DELETE — user unlinks a provider from their own account
export async function DELETE(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { provider } = await req.json().catch(() => ({}))
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const updates: Record<string, null> = {}
  if (provider === 'kick') {
    Object.assign(updates, { kick_id: null, kick_username: null, kick_avatar: null, kick_linked_at: null })
  } else if (provider === 'acebet') {
    Object.assign(updates, { acebet_id: null, acebet_id_suffix: null, acebet_username: null, acebet_linked_at: null })
  } else if (provider === 'discord') {
    Object.assign(updates, { discord_id: null, discord_username: null, discord_linked_at: null })
  } else {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  }

  const { error } = await admin
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', session.user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
