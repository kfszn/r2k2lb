import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ADMIN_SESSION_COOKIE, createSessionToken, getAdminSession, verifyPassword } from '@/lib/staff-auth'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 12,
}

// GET — restore an existing session (so a page refresh doesn't force a re-login)
export async function GET(request: NextRequest) {
  const session = getAdminSession(request)
  if (!session) return NextResponse.json({ session: null }, { status: 401 })
  return NextResponse.json({ session: { role: session.role, username: session.username } })
}

// POST — log in as owner (shared password) or staff (username + password)
export async function POST(request: NextRequest) {
  const body = await request.json()

  if (body.type === 'staff') {
    const username = String(body.username ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data: staff, error } = await supabase
      .from('staff_accounts')
      .select('id, username, password_hash, password_salt, is_active')
      .eq('username', username)
      .maybeSingle()

    if (error || !staff || !staff.is_active || !verifyPassword(password, staff.password_hash, staff.password_salt)) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 })
    }

    await supabase.from('staff_accounts').update({ last_login_at: new Date().toISOString() }).eq('id', staff.id)

    const token = createSessionToken({ role: 'staff', username: staff.username, staffId: staff.id })
    const res = NextResponse.json({ session: { role: 'staff', username: staff.username } })
    res.cookies.set(ADMIN_SESSION_COOKIE, token, COOKIE_OPTIONS)
    return res
  }

  // Owner login — the single shared admin password
  const password = String(body.password ?? '')
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
  if (password !== adminPassword) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  const token = createSessionToken({ role: 'owner', username: 'owner' })
  const res = NextResponse.json({ session: { role: 'owner', username: 'owner' } })
  res.cookies.set(ADMIN_SESSION_COOKIE, token, COOKIE_OPTIONS)
  return res
}

// DELETE — log out
export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.set(ADMIN_SESSION_COOKIE, '', { ...COOKIE_OPTIONS, maxAge: 0 })
  return res
}
