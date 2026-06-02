import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// POST — admin refreshes the acebet_username from the Acebet API for a profile
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get current acebet_id_suffix
  const { data: profile, error: fetchErr } = await supabase
    .from('profiles')
    .select('acebet_id, acebet_id_suffix, acebet_username')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  if (!profile?.acebet_id_suffix) return NextResponse.json({ error: 'No Acebet ID linked to this profile' }, { status: 400 })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.r2k2.gg'
  let newUsername: string | null = null

  try {
    const lbRes = await fetch(`${siteUrl}/api/leaderboard?fresh=1`)
    if (!lbRes.ok) throw new Error(`Leaderboard returned ${lbRes.status}`)
    const lbData = await lbRes.json()
    const found = (lbData.data ?? []).find(
      (u: { userId: number | string }) => String(u.userId) === profile.acebet_id_suffix
    )
    if (!found) return NextResponse.json({ error: 'User not found in current leaderboard data' }, { status: 404 })
    newUsername = found.name ?? null
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Leaderboard fetch failed' }, { status: 500 })
  }

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ acebet_username: newUsername, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // Audit log
  await supabase.from('account_connection_logs').insert({
    target_profile_id: id,
    action: 'refresh_username',
    provider: 'acebet',
    old_value: profile.acebet_username ?? null,
    new_value: newUsername,
  })

  return NextResponse.json({ success: true, acebet_username: newUsername })
}
