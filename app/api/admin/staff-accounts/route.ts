import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession, hashPassword } from '@/lib/staff-auth'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// GET — list staff accounts (owner only)
export async function GET(request: NextRequest) {
  const session = getAdminSession(request)
  if (!session || session.role !== 'owner') {
    return NextResponse.json({ error: 'Owner access required.' }, { status: 403 })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('staff_accounts')
    .select('id, username, is_active, created_at, last_login_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ staff: data })
}

// POST — create a staff account (owner only)
export async function POST(request: NextRequest) {
  const session = getAdminSession(request)
  if (!session || session.role !== 'owner') {
    return NextResponse.json({ error: 'Owner access required.' }, { status: 403 })
  }

  const body = await request.json()
  const username = String(body.username ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')

  if (!username || !password || password.length < 8) {
    return NextResponse.json({ error: 'Username and a password of at least 8 characters are required.' }, { status: 400 })
  }

  const { hash, salt } = hashPassword(password)
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('staff_accounts')
    .insert({ username, password_hash: hash, password_salt: salt })
    .select('id, username, is_active, created_at, last_login_at')
    .single()

  if (error) {
    const message = error.code === '23505' ? 'That username is already taken.' : error.message
    return NextResponse.json({ error: message }, { status: 500 })
  }
  return NextResponse.json({ staff: data })
}
