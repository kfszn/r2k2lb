import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform') || 'acebet';
    
    const supabase = await createClient();
    
    // Get raffle config for this platform
    const { data: configData, error: configError } = await supabase
      .from('raffle_config')
      .select('*')
      .eq('platform', platform)
      .single();
    
    if (configError || !configData) {
      return NextResponse.json({
        entries: [],
        count: 0,
        totalPrize: 0,
        minWager: 50,
        maxEntries: 10000
      });
    }

    const minWager = configData.min_wager;
    const prizeAmount = configData.prize_amount;
    const maxEntries = configData.max_entries;

    // Get current week start (Monday)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Get existing entries for this week
    const { data: finalEntries } = await supabase
      .from('raffle_entries')
      .select('*')
      .eq('platform', platform)
      .eq('week_start', weekStartStr)
      .limit(maxEntries);

    const entriesCount = finalEntries?.length || 0;

    return NextResponse.json({
      entries: finalEntries || [],
      count: entriesCount,
      totalPrize: prizeAmount,
      minWager,
      maxEntries
    });
  } catch (error) {
    console.error('[v0] Error fetching raffle entries:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch entries',
        entries: [],
        count: 0,
        totalPrize: 0,
        minWager: 50,
        maxEntries: 10000
      },
      { status: 500 }
    );
  }
}
