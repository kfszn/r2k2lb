import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { keyword } = await req.json()

    if (!keyword?.trim()) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 })
    }

    // Close and delete any existing open giveaway (cascade deletes entries)
    const { data: existing } = await supabaseAdmin
      .from('giveaway')
      .select('id')
      .eq('is_open', true)

    if (existing && existing.length > 0) {
      await supabaseAdmin.from('giveaway').delete().eq('is_open', true)
    }

    // Create new giveaway
    const { data, error } = await supabaseAdmin
      .from('giveaway')
      .insert({ keyword: keyword.trim().toLowerCase(), is_open: true })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, giveaway: data })
  } catch (err) {
    console.error('[admin/giveaway/open] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
