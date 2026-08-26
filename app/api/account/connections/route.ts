import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { fetchPlatformWagerTotal } from '@/lib/r2koins/platforms'

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
      luxdrop_username, luxdrop_linked_at,
      roobet_username, roobet_linked_at,
      discord_id, discord_username, discord_linked_at
    `)
    .eq('id', session.user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}

// POST — user links their Acebet or LuxDrop account
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

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ── LuxDrop self-serve link ───────────────────────────────────────────
  if (typeof body.luxdrop_username === 'string') {
    const luxdropUsername = body.luxdrop_username.trim()

    if (!luxdropUsername) {
      return NextResponse.json({ error: 'Enter your LuxDrop username.' }, { status: 400 })
    }

    // Verify the username exists under the R2K2 affiliate code and grab the
    // current lifetime wager — this becomes the sync baseline.
    const wagerTotal = await fetchPlatformWagerTotal('luxdrop', luxdropUsername)

    if (wagerTotal === null) {
      return NextResponse.json({ error: 'Failed to reach the LuxDrop API. Try again shortly.' }, { status: 502 })
    }
    if (wagerTotal === 'not_found') {
      return NextResponse.json(
        { error: `No LuxDrop account named "${luxdropUsername}" was found under affiliate code R2K2. Make sure you have wagered with code R2K2.` },
        { status: 404 }
      )
    }

    // Not already linked to another profile via the self-serve column
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id')
      .ilike('luxdrop_username', luxdropUsername)
      .neq('id', session.user.id)
      .maybeSingle()

    if (existingProfile) {
      return NextResponse.json({ error: 'This LuxDrop username is already linked to another account.' }, { status: 409 })
    }

    // Not already linked via the canonical linked_accounts table (e.g. admin/Discord link)
    const { data: existingLink } = await admin
      .from('linked_accounts')
      .select('id, kick_user_id')
      .eq('platform', 'luxdrop')
      .ilike('platform_username', luxdropUsername)
      .maybeSingle()

    if (existingLink && existingLink.kick_user_id !== session.user.id) {
      return NextResponse.json({ error: 'This LuxDrop username is already linked to another account.' }, { status: 409 })
    }

    // If the user already has a linked_accounts row for luxdrop (e.g. previously
    // linked by an admin), just sync the profile columns instead of duplicating.
    const { data: ownLink } = await admin
      .from('linked_accounts')
      .select('id')
      .eq('kick_user_id', session.user.id)
      .eq('platform', 'luxdrop')
      .maybeSingle()

    if (!ownLink) {
      const { data: link, error: linkError } = await admin
        .from('linked_accounts')
        .insert({
          kick_user_id: session.user.id,
          platform: 'luxdrop',
          platform_username: luxdropUsername,
          linked_by_admin: null,
          discord_ticket_ref: null,
          initial_wager_baseline: wagerTotal,
        })
        .select('id')
        .single()

      if (linkError || !link) {
        return NextResponse.json({ error: linkError?.message ?? 'Failed to link LuxDrop account.' }, { status: 500 })
      }

      const { error: creditError } = await admin.from('wager_credits').insert({
        linked_account_id: link.id,
        last_counted_wager: wagerTotal,
        total_coins_awarded: 0,
      })

      if (creditError) {
        // Never leave a link without a baseline row
        await admin.from('linked_accounts').delete().eq('id', link.id)
        return NextResponse.json({ error: creditError.message }, { status: 500 })
      }

      // Ensure the user has a balance row so the daily-sync cron can credit them
      await admin
        .from('r2koins_balance')
        .upsert({ kick_user_id: session.user.id }, { onConflict: 'kick_user_id', ignoreDuplicates: true })
    }

    const { error } = await admin
      .from('profiles')
      .update({
        luxdrop_username: luxdropUsername,
        luxdrop_linked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, luxdrop_username: luxdropUsername })
  }

  // ── Roobet self-serve link ─────────────────────────────────────────────
  if (typeof body.roobet_username === 'string') {
    const roobetUsername = body.roobet_username.trim()

    if (!roobetUsername) {
      return NextResponse.json({ error: 'Enter your Roobet username.' }, { status: 400 })
    }

    // Verify the username exists under the R2K2 affiliate code
    const wagerTotal = await fetchPlatformWagerTotal('roobet', roobetUsername)

    if (wagerTotal === null) {
      return NextResponse.json({ error: 'Failed to reach the Roobet API. Try again shortly.' }, { status: 502 })
    }
    if (wagerTotal === 'not_found') {
      return NextResponse.json(
        { error: `No Roobet account named "${roobetUsername}" was found under affiliate code R2K2. Make sure you have wagered with code R2K2.` },
        { status: 404 }
      )
    }

    // Not already linked to another profile via the self-serve column
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id')
      .ilike('roobet_username', roobetUsername)
      .neq('id', session.user.id)
      .maybeSingle()

    if (existingProfile) {
      return NextResponse.json({ error: 'This Roobet username is already linked to another account.' }, { status: 409 })
    }

    // Not already linked via the canonical linked_accounts table (e.g. admin/Discord link)
    const { data: existingLink } = await admin
      .from('linked_accounts')
      .select('id, kick_user_id')
      .eq('platform', 'roobet')
      .ilike('platform_username', roobetUsername)
      .maybeSingle()

    if (existingLink && existingLink.kick_user_id !== session.user.id) {
      return NextResponse.json({ error: 'This Roobet username is already linked to another account.' }, { status: 409 })
    }

    const { error } = await admin
      .from('profiles')
      .update({
        roobet_username: roobetUsername,
        roobet_linked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, roobet_username: roobetUsername })
  }

  // ── Acebet self-serve link ────────────────────────────────────────────
  const rawSuffix: string = String(body.acebet_id_suffix ?? '').trim().replace(/^AB-/i, '')

  if (!rawSuffix || !/^\d+$/.test(rawSuffix)) {
    return NextResponse.json({ error: 'Invalid Acebet ID. Enter only the numeric suffix.' }, { status: 400 })
  }

  const acebet_id_suffix = rawSuffix
  const acebet_id = `AB-${rawSuffix}`

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
  } else if (provider === 'luxdrop') {
    Object.assign(updates, { luxdrop_username: null, luxdrop_linked_at: null })
  } else if (provider === 'roobet') {
    Object.assign(updates, { roobet_username: null, roobet_linked_at: null })
  } else if (provider === 'discord') {
    Object.assign(updates, { discord_id: null, discord_username: null, discord_linked_at: null })
  } else {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  }

  // For LuxDrop, also tear down the canonical linked_accounts / wager_credits
  // rows so the R2Koins daily-sync cron stops crediting this account.
  if (provider === 'luxdrop') {
    const { data: link } = await admin
      .from('linked_accounts')
      .select('id')
      .eq('kick_user_id', session.user.id)
      .eq('platform', 'luxdrop')
      .maybeSingle()

    if (link) {
      await admin.from('wager_credits').delete().eq('linked_account_id', link.id)
      await admin.from('linked_accounts').delete().eq('id', link.id)
    }
  }

  const { error } = await admin
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', session.user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
