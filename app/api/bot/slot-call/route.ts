import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { kickUsername, slotName, botSecret } = await req.json()

    // Validate bot secret
    const secret = process.env.BOT_SECRET
    if (secret && botSecret !== secret) {
      return NextResponse.json({ success: false, message: '❌ Invalid bot secret.' }, { status: 401 })
    }

    if (!kickUsername || !slotName) {
      return NextResponse.json(
        { success: false, message: '❌ kickUsername and slotName are required.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if slot calls are open
    const { data: config } = await supabase
      .from('stream_games_config')
      .select('is_open')
      .eq('game_name', 'slot_calls')
      .single()

    if (!config?.is_open) {
      return NextResponse.json({
        success: false,
        message: '❌ Slot calls are currently closed.',
      })
    }

    const { error } = await supabaseAdmin.from('slot_calls').insert({
      username: kickUsername,
      slot_name: slotName,
      type: 'call',
      timestamp: new Date().toISOString(),
      buy_amount: null,
      buy_result: null,
    })

    if (error) {
      console.error('[slot-call] Supabase insert error:', error)
      return NextResponse.json(
        { success: false, message: `❌ Failed to add slot call: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `✅ Slot call added! ${kickUsername} requested ${slotName}`,
    })
  } catch (err) {
    console.error('[slot-call] Unexpected error:', err)
    return NextResponse.json(
      { success: false, message: '❌ Internal server error.' },
      { status: 500 }
    )
  }
}
