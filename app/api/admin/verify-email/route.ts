import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST — manually confirm a user's email address.
// body: { email }
// Uses the service-role admin API (same pattern as other admin routes; the
// admin panel is already password-gated on the client).
export async function POST(req: NextRequest) {
  try {
    let body: { email?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const email = body.email?.trim().toLowerCase()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Resolve the auth user id from the profiles table (profiles.id === auth uid)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .ilike('email', email)
      .maybeSingle()

    let userId = profile?.id ?? null

    // Fallback: search the auth users list directly if there's no profile row
    if (!userId) {
      const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      })
      if (listErr) {
        return NextResponse.json({ error: listErr.message }, { status: 500 })
      }
      const match = list.users.find((u) => u.email?.toLowerCase() === email)
      userId = match?.id ?? null
    }

    if (!userId) {
      return NextResponse.json(
        { error: `No account found for ${email}` },
        { status: 404 }
      )
    }

    // Mark the email as confirmed
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      email_confirm: true,
    })

    if (error) {
      console.error('[v0] Error verifying email:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${email} has been verified successfully.`,
    })
  } catch (error) {
    console.error('[v0] Admin verify email error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
