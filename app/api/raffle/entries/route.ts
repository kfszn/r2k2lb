import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform') || 'acebet';
    
    const supabase = await createClient();
    
    // Get raffle config for this platform
    const { data: configData } = await supabase
      .from('raffle_config')
      .select('*')
      .eq('platform', platform)
      .single();
    
    if (!configData) {
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
    const startDate = configData.start_date;
    const endDate = configData.end_date;

    // Get all entries for this raffle period
    const { data: allEntries } = await supabase
      .from('raffle_entries')
      .select('*')
      .eq('platform', platform)
      .eq('week_start', startDate)
      .limit(maxEntries);

    const entriesCount = allEntries?.length || 0;

    return NextResponse.json({
      entries: allEntries || [],
      count: entriesCount,
      totalPrize: prizeAmount,
      minWager,
      maxEntries,
      startDate,
      endDate
    });
  } catch (error) {
    console.error('[v0] Error in raffle entries API:', error);
    return NextResponse.json(
      { 
        entries: [],
        count: 0,
        totalPrize: 0,
        minWager: 50,
        maxEntries: 10000,
        startDate: '2026-02-14',
        endDate: '2026-02-21',
        error: 'Failed to fetch raffle entries'
      },
      { status: 500 }
    );
  }
}
