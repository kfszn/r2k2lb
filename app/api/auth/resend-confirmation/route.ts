import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    console.log('[v0] Server: resend confirmation requested for:', email)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const origin = request.headers.get('origin') || new URL(request.url).origin

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/account`,
      },
    })

    if (error) {
      console.log('[v0] Server: resend error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('[v0] Server: resend email sent successfully to:', email)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.log('[v0] Server: resend unexpected error:', err)
    return NextResponse.json(
      { error: 'Failed to resend confirmation email. Please try again.' },
      { status: 500 }
    )
  }
}
