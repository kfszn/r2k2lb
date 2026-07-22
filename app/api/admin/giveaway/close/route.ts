import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    const { error } = await supabaseAdmin
      .from('giveaway')
      .update({ is_open: false })
      .eq('is_open', true)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/giveaway/close] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
