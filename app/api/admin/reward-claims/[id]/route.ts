import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession } from '@/lib/staff-auth'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// PATCH — update a reward claim. Staff may only change `status` (marking a
// claim pending/approved/paid) — editing the rest of an existing claim is
// owner-only.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getAdminSession(request)
  if (!session) return NextResponse.json({ error: 'Admin session required.' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  if (session.role === 'staff') {
    const keys = Object.keys(body)
    if (keys.length !== 1 || keys[0] !== 'status') {
      return NextResponse.json({ error: 'Staff can only update a claim\u2019s status.' }, { status: 403 })
    }
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('reward_claims')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ claim: data })
}

// DELETE — delete a reward claim (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getAdminSession(request)
  if (!session) return NextResponse.json({ error: 'Admin session required.' }, { status: 401 })
  if (session.role !== 'owner') {
    return NextResponse.json({ error: 'Owner access required.' }, { status: 403 })
  }

  const { id } = await params
  const supabase = getSupabase()

  const { error } = await supabase.from('reward_claims').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
