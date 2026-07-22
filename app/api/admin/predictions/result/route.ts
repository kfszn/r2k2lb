import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { type, actual_value } = await req.json()

    if (!['gtb', 'gtm'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const actual = parseFloat(actual_value)
    if (isNaN(actual)) {
      return NextResponse.json({ error: 'Invalid actual_value' }, { status: 400 })
    }

    // Fetch all entries for this type
    const { data: entries, error: fetchError } = await supabaseAdmin
      .from('predictions')
      .select('*')
      .eq('type', type)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({ error: 'No entries to resolve' }, { status: 404 })
    }

    // Find closest guess
    let winner = entries[0]
    let minDiff = Math.abs(entries[0].guess - actual)

    for (const entry of entries) {
      const diff = Math.abs(entry.guess - actual)
      if (diff < minDiff) {
        minDiff = diff
        winner = entry
      }
    }

    // Delete all entries for this type
    await supabaseAdmin.from('predictions').delete().eq('type', type)

    // Close the game
    await supabaseAdmin.from('prediction_settings').update({ is_open: false }).eq('type', type)

    return NextResponse.json({
      success: true,
      winner: {
        kick_username: winner.kick_username,
        guess: winner.guess,
        actual_value: actual,
        diff: minDiff,
      },
    })
  } catch (err) {
    console.error('[admin/predictions/result] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
