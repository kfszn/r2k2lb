import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET — list all wager milestone tiers (admin, unfiltered)
export async function GET() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('wager_milestone_tiers')
    .select('*')
    .order('platform')
    .order('sort_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tiers: data })
}

// POST — create a wager milestone tier
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { platform, tier_name, wager_threshold, reward_amount, sort_order, active } = body

  if (!platform || !['roobet', 'luxdrop'].includes(platform)) {
    return NextResponse.json({ error: 'platform must be "roobet" or "luxdrop"' }, { status: 400 })
  }
  if (!tier_name?.trim()) {
    return NextResponse.json({ error: 'tier_name is required' }, { status: 400 })
  }
  if (wager_threshold == null || reward_amount == null) {
    return NextResponse.json({ error: 'wager_threshold and reward_amount are required' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('wager_milestone_tiers')
    .insert({
      platform,
      tier_name: tier_name.trim(),
      wager_threshold,
      reward_amount,
      sort_order: sort_order ?? 0,
      active: active ?? true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tier: data }, { status: 201 })
}
