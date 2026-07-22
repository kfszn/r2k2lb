import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { kickUsername, message, botSecret } = await req.json()

    const secret = process.env.BOT_SECRET
    if (secret && botSecret !== secret) {
      return NextResponse.json({ success: false, message: '❌ Invalid bot secret.' }, { status: 401 })
    }

    if (!kickUsername || !message) {
      return NextResponse.json({ success: false, message: '❌ kickUsername and message are required.' }, { status: 400 })
    }

    // Find open giveaway
    const { data: giveaway } = await supabaseAdmin
      .from('giveaway')
      .select('id, keyword')
      .eq('is_open', true)
      .maybeSingle()

    if (!giveaway) {
      return NextResponse.json({ entered: false, message: 'No giveaway open.' })
    }

    // Check keyword match
    if (message.trim().toLowerCase() !== giveaway.keyword.trim().toLowerCase()) {
      return NextResponse.json({ entered: false })
    }

    // Insert entry — ignore duplicate
    const { error } = await supabaseAdmin
      .from('giveaway_entries')
      .insert({ giveaway_id: giveaway.id, kick_username: kickUsername })

    if (error && error.code !== '23505') {
      return NextResponse.json({ entered: false, message: `❌ Failed to enter: ${error.message}` }, { status: 500 })
    }

    // Return false if duplicate (already entered)
    const entered = !error
    return NextResponse.json({ entered })
  } catch (err) {
    console.error('[bot/giveaway/enter] error:', err)
    return NextResponse.json({ success: false, message: '❌ Internal server error.' }, { status: 500 })
  }
}
