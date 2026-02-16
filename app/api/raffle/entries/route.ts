import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform') || 'acebet';
    
    const supabase = await createClient();
    
    // Get current week start (Sunday)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabase
      .from('raffle_entries')
      .select('*')
      .eq('platform', platform)
      .eq('week_start', weekStart.toISOString().split('T')[0]);
    
    if (error) throw error;
    
    const totalPrize = (data || []).reduce((sum, entry) => sum + (entry.wager_amount || 0) * 0.1, 0);
    
    return NextResponse.json({
      entries: data || [],
      count: data?.length || 0,
      totalPrize,
    });
  } catch (error) {
    console.error('Error fetching raffle entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}
