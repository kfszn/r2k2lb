import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

    // Find the open giveaway
    const { data: giveaway } = await supabaseAdmin
      .from('giveaway')
      .select('id')
      .eq('is_open', true)
      .maybeSingle()

    if (!giveaway) {
      return NextResponse.json({ error: 'No open giveaway' }, { status: 404 })
    }

    const { error } = await supabaseAdmin
      .from('giveaway_entries')
      .delete()
      .eq('giveaway_id', giveaway.id)
      .eq('kick_username', decodeURIComponent(username))

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/giveaway/entries/[username] DELETE] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
