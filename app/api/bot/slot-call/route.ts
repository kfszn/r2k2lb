import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const { error } = await supabase.from('slot_calls').insert({
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
