import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const platform = request.nextUrl.searchParams.get('platform') || 'acebet';
    const supabase = await createClient();

    // Load config from admin panel
    const { data: configData } = await supabase
      .from('raffle_config')
      .select('*')
      .eq('platform', platform)
      .maybeSingle();

    const startDate = configData?.start_date ?? '2026-02-14';
    const maxEntries = configData?.max_entries ?? 10000;

    // Get stored raffle entries
    const { data: entries } = await supabase
      .from('raffle_entries')
      .select('*')
      .eq('platform', platform)
      .eq('week_start', startDate)
      .limit(maxEntries);

    return NextResponse.json({
      entries: entries || [],
      count: entries?.length || 0,
      totalPrize: configData?.prize_amount ?? 0,
      minWager: configData?.min_wager ?? 50,
      maxEntries,
      startDate,
      endDate: configData?.end_date ?? '2026-02-21',
    });
  } catch (error) {
    console.error('[v0] Raffle entries error:', error);
    return NextResponse.json({
      entries: [],
      count: 0,
      totalPrize: 0,
      minWager: 50,
      maxEntries: 10000,
      startDate: '2026-02-14',
      endDate: '2026-02-21',
      error: 'Failed to fetch raffle entries',
    }, { status: 500 });
  }
}
