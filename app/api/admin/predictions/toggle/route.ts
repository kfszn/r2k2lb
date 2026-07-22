import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { type, is_open } = await req.json()

    if (!['gtb', 'gtm'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('prediction_settings')
      .update({ is_open })
      .eq('type', type)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/predictions/toggle] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
