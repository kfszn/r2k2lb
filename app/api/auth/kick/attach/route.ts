import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// Attaches a pending Kick identity (set by the OAuth callback in the
// `kick_pending` httpOnly cookie) to the currently authenticated user.
// Called from the account page after the user completes signup + login.
export async function POST(req: NextRequest) {
  const pendingRaw = req.cookies.get('kick_pending')?.value
  if (!pendingRaw) {
    return NextResponse.json({ attached: false, reason: 'no_pending' })
  }

  let pending: { id?: string; username?: string | null; avatar?: string | null }
  try {
    pending = JSON.parse(pendingRaw)
  } catch {
    const res = NextResponse.json({ attached: false, reason: 'bad_cookie' })
    res.cookies.delete('kick_pending')
    return res
  }

  if (!pending.id) {
    const res = NextResponse.json({ attached: false, reason: 'bad_cookie' })
    res.cookies.delete('kick_pending')
    return res
  }

  // Authenticated user via session cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    // Keep the cookie — user may still be mid email-confirmation
    return NextResponse.json({ attached: false, reason: 'not_authenticated' })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Refuse if this Kick identity is already linked to a different account
  const { data: conflict } = await admin
    .from('profiles')
    .select('id')
    .eq('kick_id', pending.id)
    .neq('id', user.id)
    .maybeSingle()

  if (conflict) {
    const res = NextResponse.json({ attached: false, reason: 'already_linked_elsewhere' })
    res.cookies.delete('kick_pending')
    return res
  }

  const { error } = await admin
    .from('profiles')
    .update({
      kick_id: pending.id,
      kick_username: pending.username ? String(pending.username).toLowerCase() : null,
      kick_avatar: pending.avatar ?? null,
      kick_linked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    console.error('[kick/attach] db update error:', error)
    return NextResponse.json({ attached: false, reason: 'db_error' }, { status: 500 })
  }

  const res = NextResponse.json({ attached: true, username: pending.username ?? null })
  res.cookies.delete('kick_pending')
  return res
}
