import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET — list all reward claims (admin, unfiltered)
export async function GET() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('reward_claims')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ claims: data })
}

// POST — create a reward claim
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { platform, username, category, title, amount, status, period_label, notes } = body

  if (!platform || !['roobet', 'luxdrop'].includes(platform)) {
    return NextResponse.json({ error: 'platform must be "roobet" or "luxdrop"' }, { status: 400 })
  }
  if (!username?.trim()) {
    return NextResponse.json({ error: 'username is required' }, { status: 400 })
  }
  const validCategories = ['wager_milestone', 'lossback', 'tournament', 'deposit_bonus', 'giveaway', 'raffle']
  if (!category || !validCategories.includes(category)) {
    return NextResponse.json({ error: `category must be one of ${validCategories.join(', ')}` }, { status: 400 })
  }
  if (!title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('reward_claims')
    .insert({
      platform,
      username: username.trim(),
      category,
      title: title.trim(),
      amount: amount ?? 0,
      status: status ?? 'pending',
      period_label: period_label?.trim() || null,
      notes: notes?.trim() || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ claim: data }, { status: 201 })
}
