import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { isLive, botSecret } = await req.json();

    // Validate bot secret
    const secret = process.env.BOT_SECRET;
    if (secret && botSecret !== secret) {
      return NextResponse.json({ success: false, message: 'Invalid bot secret.' }, { status: 401 });
    }

    if (typeof isLive !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'isLive (boolean) is required.' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('stream_games_config')
      .upsert(
        { game_name: 'stream_is_live', is_open: isLive },
        { onConflict: 'game_name' }
      );

    if (error) {
      console.error('[bot/stream-status] DB upsert error:', error);
      return NextResponse.json({ success: false, message: 'Failed to update stream status.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, isLive });
  } catch (error) {
    console.error('[bot/stream-status] Unexpected error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}
