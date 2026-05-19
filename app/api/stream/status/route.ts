import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('stream_games_config')
      .select('is_open')
      .eq('game_name', 'stream_is_live')
      .single();

    if (error) {
      console.error('[stream/status] DB read error:', error);
      return Response.json({ isLive: false, error: 'Failed to read stream status' }, { status: 200 });
    }

    return Response.json({ isLive: data?.is_open === true });
  } catch (error) {
    console.error('[stream/status] Unexpected error:', error);
    return Response.json({ isLive: false, error: 'Internal error' }, { status: 200 });
  }
}
