import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET — list all challenges (admin, unfiltered)
export async function GET() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('acebet_challenges')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ challenges: data })
}

// POST — create a challenge
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { title, description, prize, image_url, active, sort_order } = body

  if (!title?.trim() || !description?.trim() || !prize?.trim()) {
    return NextResponse.json(
      { error: 'title, description, and prize are required' },
      { status: 400 }
    )
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('acebet_challenges')
    .insert({
      title: title.trim(),
      description: description.trim(),
      prize: prize.trim(),
      image_url: image_url || null,
      active: active ?? true,
      sort_order: sort_order ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ challenge: data }, { status: 201 })
}
