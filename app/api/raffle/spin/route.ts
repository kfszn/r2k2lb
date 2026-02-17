import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { platform, adminSecret } = await request.json();
    
    // Verify admin secret
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const supabase = await createClient();
    
    // Get current week start
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    // Get all entries for this week
    const { data: entries, error: fetchError } = await supabase
      .from('raffle_entries')
      .select('*')
      .eq('platform', platform)
      .eq('week_start', weekStartStr);
    
    if (fetchError) throw fetchError;
    
    if (!entries || entries.length === 0) {
      return NextResponse.json({ error: 'No entries found' }, { status: 400 });
    }
    
    // Select random winner
    const winner = entries[Math.floor(Math.random() * entries.length)];
    const totalPrize = entries.reduce((sum, entry) => sum + (entry.wager_amount || 0) * 0.1, 0);
    
    // Store winner
    const { data: winnerData, error: winnerError } = await supabase
      .from('raffle_winners')
      .insert({
        platform,
        username: winner.username,
        prize_amount: totalPrize,
        week_start: weekStartStr,
        raffle_type: 'Weekly',
      })
      .select();
    
    if (winnerError) throw winnerError;
    
    // Clear entries for next week
    const nextWeekStart = new Date(weekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    
    return NextResponse.json({ 
      winner: winnerData?.[0],
      prizeAmount: totalPrize,
      entryCount: entries.length,
    });
  } catch (error) {
    console.error('Error spinning raffle:', error);
    return NextResponse.json(
      { error: 'Failed to spin raffle' },
      { status: 500 }
    );
  }
}
