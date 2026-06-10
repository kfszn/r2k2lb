import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Dedicated server-side token exchange for Kick OAuth login.
// Called from /api/auth/kick/callback with ?token_hash=...
// Verifies the OTP token, sets the Supabase session cookie, and redirects to /account.
// The user never sees an email or an error page — the flow is completely seamless.
export async function GET(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.r2k2.gg'
  const tokenHash = req.nextUrl.searchParams.get('token_hash')

  if (!tokenHash) {
    console.error('[kick-login] missing token_hash')
    return NextResponse.redirect(`${siteUrl}/auth/login?kick_error=missing_token`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // Exchange the hashed OTP token for a real session — this sets the session
  // cookie automatically via the SSR client.
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'magiclink',
  })

  if (error) {
    console.error('[kick-login] verifyOtp error:', error.message)
    return NextResponse.redirect(`${siteUrl}/auth/login?kick_error=session_failed`)
  }

  // Session is now set — redirect seamlessly to the account page.
  return NextResponse.redirect(`${siteUrl}/account`)
}
