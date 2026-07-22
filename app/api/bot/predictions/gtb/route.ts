import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { kickUsername, guess, botSecret } = await req.json()

    const secret = process.env.BOT_SECRET
    if (secret && botSecret !== secret) {
      return NextResponse.json({ success: false, message: '❌ Invalid bot secret.' }, { status: 401 })
    }

    if (!kickUsername || guess === undefined || guess === null) {
      return NextResponse.json({ success: false, message: '❌ kickUsername and guess are required.' }, { status: 400 })
    }

    const guessNum = parseFloat(guess)
    if (isNaN(guessNum) || guessNum < 0) {
      return NextResponse.json({ success: false, message: '❌ Invalid guess value.' }, { status: 400 })
    }

    const { data: settings } = await supabaseAdmin
      .from('prediction_settings')
      .select('is_open')
      .eq('type', 'gtb')
      .single()

    if (!settings?.is_open) {
      return NextResponse.json({ success: false, message: '❌ Guess The Balance is currently closed.' }, { status: 403 })
    }

    const { data: existing } = await supabaseAdmin
      .from('predictions')
      .select('id')
      .eq('type', 'gtb')
      .eq('kick_username', kickUsername)
      .maybeSingle()

    const { error } = await supabaseAdmin
      .from('predictions')
      .upsert({ type: 'gtb', kick_username: kickUsername, guess: guessNum, updated_at: new Date().toISOString() }, { onConflict: 'type,kick_username' })

    if (error) {
      return NextResponse.json({ success: false, message: `❌ Failed to record guess: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, updated: !!existing })
  } catch (err) {
    console.error('[bot/predictions/gtb] error:', err)
    return NextResponse.json({ success: false, message: '❌ Internal server error.' }, { status: 500 })
  }
}
