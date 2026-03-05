import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET all shop items with redemption counts
export async function GET() {
  const supabase = getSupabase()

  const { data: items, error } = await supabase
    .from('shop_items')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get redemption counts per item
  const { data: counts } = await supabase
    .from('redemptions')
    .select('shop_item_id')

  const countMap: Record<number, number> = {}
  for (const r of counts ?? []) {
    countMap[r.shop_item_id] = (countMap[r.shop_item_id] ?? 0) + 1
  }

  const result = items.map((item) => ({
    ...item,
    redemption_count: countMap[item.id] ?? 0,
  }))

  return NextResponse.json(result)
}

// POST create new shop item
export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const body = await req.json()
  const { name, description, points_cost } = body

  if (!name || !points_cost) {
    return NextResponse.json({ error: 'name and points_cost required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('shop_items')
    .insert({ name, description, points_cost: Number(points_cost) })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
