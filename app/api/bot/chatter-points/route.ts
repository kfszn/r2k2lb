import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { kickUsername, points, type, botSecret } = await req.json()

    const secret = process.env.BOT_SECRET
    if (secret && botSecret !== secret) {
      return NextResponse.json({ success: false, message: 'Invalid bot secret.' }, { status: 401 })
    }

    if (!kickUsername || points === undefined || !type) {
      return NextResponse.json(
        { success: false, message: 'kickUsername, points, and type are required.' },
        { status: 400 }
      )
    }

    if (!['message', 'emote'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'type must be "message" or "emote".' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin.from('chatter_points').insert({
      kick_username: kickUsername.toLowerCase(),
      points: Number(points),
      type,
    })

    if (error) {
      console.error('[chatter-points] Insert error:', error)
      return NextResponse.json(
        { success: false, message: `Failed to record points: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[chatter-points] Unexpected error:', err)
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 })
  }
}
