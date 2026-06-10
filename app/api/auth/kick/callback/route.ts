import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Kick OAuth PKCE callback — exchanges code for token, fetches Kick profile,
// then either links the Kick account to an existing user (mode=link)
// or signs in / prompts sign-up via Kick identity (mode=login).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.r2k2.gg'

  const cookieState   = req.cookies.get('kick_oauth_state')?.value
  const codeVerifier  = req.cookies.get('kick_oauth_verifier')?.value
  const mode          = req.cookies.get('kick_oauth_mode')?.value ?? 'login'
  const profileUserId = req.cookies.get('kick_oauth_user_id')?.value

  const clearCookies = (res: NextResponse) => {
    res.cookies.delete('kick_oauth_state')
    res.cookies.delete('kick_oauth_verifier')
    res.cookies.delete('kick_oauth_mode')
    res.cookies.delete('kick_oauth_user_id')
    return res
  }

  // Validate state (CSRF guard)
  if (!state || !cookieState || state !== cookieState) {
    const dest = mode === 'link' ? '/account' : '/auth/login'
    return clearCookies(NextResponse.redirect(`${siteUrl}${dest}?kick_error=invalid_state`))
  }
  if (!code || !codeVerifier) {
    const dest = mode === 'link' ? '/account' : '/auth/login'
    return clearCookies(NextResponse.redirect(`${siteUrl}${dest}?kick_error=missing_params`))
  }

  const clientId    = process.env.KICK_CLIENT_ID!
  const clientSecret = process.env.KICK_CLIENT_SECRET!
  const redirectUri = process.env.KICK_REDIRECT_URI ?? `${siteUrl}/api/auth/kick/callback`

  // 1. Exchange code for access token
  let accessToken: string
  try {
    const tokenRes = await fetch('https://id.kick.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
        code_verifier: codeVerifier,
      }),
    })
    if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status}`)
    const tokenData = await tokenRes.json()
    accessToken = tokenData.access_token
  } catch (err) {
    console.error('[kick/callback] token exchange error:', err)
    const dest = mode === 'link' ? '/account' : '/auth/login'
    return clearCookies(NextResponse.redirect(`${siteUrl}${dest}?kick_error=token_exchange_failed`))
  }

  // 2. Fetch Kick user profile
  let kickUser: { user_id: string | number; name: string; profile_picture?: string }
  try {
    const profileRes = await fetch('https://api.kick.com/public/v1/users', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const profileBodyText = await profileRes.text()
    if (!profileRes.ok) throw new Error(`Profile fetch failed: ${profileRes.status} — ${profileBodyText}`)
    const profileData = JSON.parse(profileBodyText)
    kickUser = profileData?.data ?? profileData
  } catch (err) {
    console.error('[kick/callback] profile fetch error:', err)
    const dest = mode === 'link' ? '/account' : '/auth/login'
    return clearCookies(NextResponse.redirect(`${siteUrl}${dest}?kick_error=profile_fetch_failed`))
  }

  const kickId       = String(kickUser.user_id)
  const kickUsername = kickUser.name
  const kickAvatar   = kickUser.profile_picture ?? null

  console.log('[kick] parsed:', kickId, kickUsername, kickAvatar)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ── LINK MODE ──────────────────────────────────────────────────────────────
  if (mode === 'link') {
    if (!profileUserId) {
      return clearCookies(NextResponse.redirect(`${siteUrl}/account?kick_error=missing_params`))
    }

    console.log('[kick] writing to DB:', { kick_id: kickId, kick_username: kickUsername, kick_avatar: kickAvatar })

    const { error } = await supabase
      .from('profiles')
      .update({
        kick_id: kickId,
        kick_username: kickUsername,
        kick_avatar: kickAvatar,
        kick_linked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileUserId)

    if (error) {
      console.error('[kick/callback] db update error:', error)
      return clearCookies(NextResponse.redirect(`${siteUrl}/account?kick_error=db_error`))
    }

    return clearCookies(NextResponse.redirect(`${siteUrl}/account?kick_success=1`))
  }

  // ── LOGIN MODE ─────────────────────────────────────────────────────────────
  // Look up existing profile by kick_id
  const { data: existingProfile, error: lookupError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('kick_id', kickId)
    .maybeSingle()

  if (lookupError) {
    console.error('[kick/callback] profile lookup error:', lookupError)
    return clearCookies(NextResponse.redirect(`${siteUrl}/auth/login?kick_error=db_error`))
  }

  if (existingProfile) {
    // User already has a linked account — generate a magic link OTP and redirect
    const { data: otpData, error: otpError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: existingProfile.email,
      options: { redirectTo: `${siteUrl}/auth/callback?next=/account` },
    })

    if (otpError || !otpData?.properties?.action_link) {
      console.error('[kick/callback] magic link error:', otpError)
      return clearCookies(NextResponse.redirect(`${siteUrl}/auth/login?kick_error=login_failed&kick_user=${encodeURIComponent(kickUsername)}`))
    }

    return clearCookies(NextResponse.redirect(otpData.properties.action_link))
  }

  // No linked account — redirect to signup, pre-filling kick identity info
  return clearCookies(
    NextResponse.redirect(
      `${siteUrl}/auth/signup?kick_id=${encodeURIComponent(kickId)}&kick_username=${encodeURIComponent(kickUsername)}&kick_needs_account=1`
    )
  )
}
