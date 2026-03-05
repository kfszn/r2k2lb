import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabase()
  const { id } = await params
  const body = await req.json()
  // Support both 'delta' (from component) and 'amount' for backwards compat
  const delta = body.delta ?? body.amount
  const description = body.description ?? body.reason ?? 'Manual adjustment by admin'

  if (typeof delta !== 'number' || delta === 0) {
    return NextResponse.json({ error: 'delta must be a non-zero number' }, { status: 400 })
  }

  // Fetch current points
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('id, points')
    .eq('id', id)
    .single()

  if (fetchError || !profile) {
    return NextResponse.json({ error: 'user not found' }, { status: 404 })
  }

  const newPoints = Math.max(0, (profile.points ?? 0) + delta)

  // Update points
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ points: newPoints })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Log transaction (non-fatal)
  await supabase.from('point_transactions').insert({
    profile_id: id,
    amount: delta,
    type: delta > 0 ? 'admin_add' : 'admin_deduct',
    description,
  })

  return NextResponse.json({ success: true, new_points: newPoints })
}
