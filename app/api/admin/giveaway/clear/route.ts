import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    // Find the open giveaway
    const { data: giveaway } = await supabaseAdmin
      .from('giveaway')
      .select('id')
      .eq('is_open', true)
      .maybeSingle()

    if (!giveaway) {
      return NextResponse.json({ success: true, cleared: 0 })
    }

    const { error } = await supabaseAdmin
      .from('giveaway_entries')
      .delete()
      .eq('giveaway_id', giveaway.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/giveaway/clear] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
