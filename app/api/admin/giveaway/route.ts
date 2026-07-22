import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data: giveaway } = await supabaseAdmin
      .from('giveaway')
      .select('*')
      .eq('is_open', true)
      .maybeSingle()

    if (!giveaway) {
      return NextResponse.json({ giveaway: null, entries: [] })
    }

    const { data: entries } = await supabaseAdmin
      .from('giveaway_entries')
      .select('*')
      .eq('giveaway_id', giveaway.id)
      .order('entered_at', { ascending: true })

    return NextResponse.json({ giveaway, entries: entries ?? [] })
  } catch (err) {
    console.error('[admin/giveaway GET] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
