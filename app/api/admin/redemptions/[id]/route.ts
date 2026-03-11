import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabase()
  const { id } = await params
  const body = await req.json()
  const { action, status } = body

  // Fetch the redemption first to get profile_id and points_spent
  const { data: redemption, error: fetchError } = await supabase
    .from('redemptions')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !redemption) {
    return NextResponse.json({ error: 'Redemption not found' }, { status: 404 })
  }

  // Handle refund action
  if (action === 'refund') {
    // Return points to user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', redemption.profile_id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const newPoints = (profile.points || 0) + redemption.points_spent

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ points: newPoints })
      .eq('id', redemption.profile_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Update redemption status to refunded
    const { data: updated, error: updateRedemptionError } = await supabase
      .from('redemptions')
      .update({ status: 'refunded' })
      .eq('id', id)
      .select()
      .single()

    if (updateRedemptionError) {
      return NextResponse.json({ error: updateRedemptionError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      ...updated, 
      message: `Refunded ${redemption.points_spent.toLocaleString()} points to user`
    })
  }

  // Handle delete action
  if (action === 'delete') {
    const { error: deleteError } = await supabase
      .from('redemptions')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: `Deleted redemption (${redemption.points_spent.toLocaleString()} points)`
    })
  }

  // Handle standard fulfill action
  const { data, error } = await supabase
    .from('redemptions')
    .update({ status: status || 'fulfilled' })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
