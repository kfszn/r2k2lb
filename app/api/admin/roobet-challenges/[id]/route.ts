import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { del } from '@vercel/blob'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// PATCH — update a Roobet challenge
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('roobet_challenges')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ challenge: data })
}

// DELETE — delete a Roobet challenge (and its blob image)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getSupabase()

  // Fetch image_url first so we can clean up blob storage
  const { data: existing } = await supabase
    .from('roobet_challenges')
    .select('image_url')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('roobet_challenges').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Best-effort blob deletion
  if (existing?.image_url) {
    try {
      await del(existing.image_url)
    } catch {
      // Non-fatal — blob may already be gone
    }
  }

  return NextResponse.json({ success: true })
}
