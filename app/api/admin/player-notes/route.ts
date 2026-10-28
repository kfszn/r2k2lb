import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession } from '@/lib/staff-auth'

const MAX_NOTES_LENGTH = 5000

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function requireOwner(request: NextRequest) {
  const session = getAdminSession(request)
  if (!session) {
    return NextResponse.json({ error: 'Admin session required.' }, { status: 401 })
  }
  if (session.role !== 'owner') {
    return NextResponse.json({ error: 'Owner access required.' }, { status: 403 })
  }
  return null
}

// GET /api/admin/player-notes?username=foo — owner only
export async function GET(request: NextRequest) {
  const denied = requireOwner(request)
  if (denied) return denied

  const username = request.nextUrl.searchParams.get('username')?.trim()
  if (!username) return NextResponse.json({ error: 'username is required.' }, { status: 400 })

  const { data, error } = await getSupabase()
    .from('player_notes')
    .select('notes, updated_at')
    .eq('username_key', username.toLowerCase())
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notes: data?.notes ?? '', updatedAt: data?.updated_at ?? null })
}

// PUT { username, notes } — owner only. Empty notes remove the row.
export async function PUT(request: NextRequest) {
  const denied = requireOwner(request)
  if (denied) return denied

  const body = await request.json().catch(() => null)
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const notes = typeof body?.notes === 'string' ? body.notes : ''

  if (!username) return NextResponse.json({ error: 'username is required.' }, { status: 400 })
  if (notes.length > MAX_NOTES_LENGTH) {
    return NextResponse.json({ error: `Notes are limited to ${MAX_NOTES_LENGTH} characters.` }, { status: 400 })
  }

  const supabase = getSupabase()
  const usernameKey = username.toLowerCase()

  if (notes.trim() === '') {
    const { error } = await supabase.from('player_notes').delete().eq('username_key', usernameKey)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ notes: '', updatedAt: null })
  }

  const { data, error } = await supabase
    .from('player_notes')
    .upsert(
      { username_key: usernameKey, username, notes, updated_at: new Date().toISOString() },
      { onConflict: 'username_key' }
    )
    .select('notes, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notes: data.notes, updatedAt: data.updated_at })
}
