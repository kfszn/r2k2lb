import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const PROFILE_SELECT = 'id, email, account_id, roobet_username, luxdrop_username'

// GET — list all referral links, joined with referrer/referred profile info.
export async function GET() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('referrals')
    .select(`
      id, notes, linked_by_admin, created_at,
      referrer:referrer_profile_id(${PROFILE_SELECT}),
      referred:referred_profile_id(${PROFILE_SELECT})
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ referrals: data ?? [] })
}

// POST — link a referrer to a referred player.
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { referrer_profile_id, referred_profile_id, notes, linked_by_admin } = body

  if (!referrer_profile_id?.trim() || !referred_profile_id?.trim()) {
    return NextResponse.json({ error: 'referrer_profile_id and referred_profile_id are required' }, { status: 400 })
  }
  if (referrer_profile_id === referred_profile_id) {
    return NextResponse.json({ error: 'A player cannot refer themselves.' }, { status: 400 })
  }

  const supabase = getSupabase()

  const { data: existing, error: existingError } = await supabase
    .from('referrals')
    .select('id')
    .eq('referred_profile_id', referred_profile_id)
    .maybeSingle()

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 })
  if (existing) {
    return NextResponse.json({ error: 'This player is already linked as a referred player under another referrer.' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('referrals')
    .insert({
      referrer_profile_id,
      referred_profile_id,
      notes: notes?.trim() || null,
      linked_by_admin: linked_by_admin?.trim() || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ referral: data }, { status: 201 })
}

// DELETE — unlink a referral.
export async function DELETE(request: NextRequest) {
  const body = await request.json()
  const { id } = body

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const supabase = getSupabase()
  const { error } = await supabase.from('referrals').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
