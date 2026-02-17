import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { platform, adminSecret } = await request.json();

    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get raffle config for this platform
    const { data: config } = await supabase
      .from('raffle_config')
      .select('*')
      .eq('platform', platform)
      .maybeSingle();

    if (!config) {
      return NextResponse.json({ error: 'No raffle config found' }, { status: 400 });
    }

    // Return the config so the client can draw from real leaderboard data
    // The actual winner selection happens client-side from the fetched leaderboard entries
    // and then the admin confirms + stores via POST /api/raffle/winners
    return NextResponse.json({
      config,
      message: 'Use the visual spinner to select from leaderboard entries, then confirm the winner.',
    });
  } catch (error) {
    console.error('Error in raffle spin:', error);
    return NextResponse.json({ error: 'Failed to process spin' }, { status: 500 });
  }
}
