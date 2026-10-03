import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession, hashPassword } from '@/lib/staff-auth'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// PATCH — toggle active state or reset password (owner only)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getAdminSession(request)
  if (!session || session.role !== 'owner') {
    return NextResponse.json({ error: 'Owner access required.' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const update: Record<string, unknown> = {}

  if (typeof body.is_active === 'boolean') update.is_active = body.is_active
  if (typeof body.password === 'string' && body.password) {
    if (body.password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }
    const { hash, salt } = hashPassword(body.password)
    update.password_hash = hash
    update.password_salt = salt
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('staff_accounts')
    .update(update)
    .eq('id', id)
    .select('id, username, is_active, created_at, last_login_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ staff: data })
}

// DELETE — remove a staff account (owner only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getAdminSession(request)
  if (!session || session.role !== 'owner') {
    return NextResponse.json({ error: 'Owner access required.' }, { status: 403 })
  }

  const { id } = await params
  const supabase = getSupabase()
  const { error } = await supabase.from('staff_accounts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
