import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token = requestUrl.searchParams.get('token')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') || '/'

  console.log('[v0] Callback route - code:', code, 'token:', token, 'type:', type)

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Handle OAuth callback (code parameter)
  if (code) {
    console.log('[v0] Exchanging code for session')
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    console.log('[v0] Exchange result - error:', error)

    if (!error) {
      console.log('[v0] Code exchange successful, redirecting to:', next)
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // Handle email verification callback (token parameter) 
  if (token && type) {
    console.log('[v0] Verifying OTP with token:', token, 'type:', type)
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change' | 'phone_change',
    })
    console.log('[v0] Verify OTP result - error:', error)

    if (!error) {
      console.log('[v0] OTP verified successfully, redirecting to:', next)
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // Return to login if there was an error
  console.log('[v0] No code or token found, redirecting to login with error')
  return NextResponse.redirect(new URL('/auth/login?error=auth_callback_error', requestUrl.origin))
}
