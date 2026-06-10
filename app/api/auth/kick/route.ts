import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// Kick OAuth PKCE flow — initiates the authorization redirect
// Supports two modes:
//   ?mode=link  — user is logged in and wants to link their Kick account
//   ?mode=login — user is not logged in; Kick acts as the login method
// Required env vars: KICK_CLIENT_ID, KICK_REDIRECT_URI
export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const mode = req.nextUrl.searchParams.get('mode') ?? 'login'
  const clientId = process.env.KICK_CLIENT_ID
  const redirectUri = process.env.KICK_REDIRECT_URI ?? `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/kick/callback`

  if (!clientId) {
    return NextResponse.json({ error: 'KICK_CLIENT_ID is not configured' }, { status: 500 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // In link mode the user must already be logged in
  if (mode === 'link' && !session) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // Generate PKCE code verifier + challenge
  const codeVerifier = crypto.randomBytes(64).toString('base64url')
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')
  const state = crypto.randomBytes(32).toString('hex')

  const res = NextResponse.redirect(
    `https://id.kick.com/oauth/authorize?` +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'user:read',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    }).toString()
  )

  // sameSite: 'none' required so cookies survive the cross-site redirect back from Kick
  const cookieOpts = { httpOnly: true, secure: true, sameSite: 'none' as const, maxAge: 600 }
  res.cookies.set('kick_oauth_state', state, cookieOpts)
  res.cookies.set('kick_oauth_verifier', codeVerifier, cookieOpts)
  res.cookies.set('kick_oauth_mode', mode, cookieOpts)

  // Only store the user id when linking an existing account
  if (session) {
    res.cookies.set('kick_oauth_user_id', session.user.id, cookieOpts)
  }

  return res
}
