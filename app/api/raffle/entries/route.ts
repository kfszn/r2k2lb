import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Fetch leaderboard data from the existing Acebet/Packdraw leaderboard API
async function fetchLeaderboardData(platform: string, startAt: string, endAt: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/leaderboard?start_at=${startAt}&end_at=${endAt}`;
    
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.error(`[v0] Leaderboard fetch failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('[v0] Error fetching leaderboard:', error);
    return [];
  }
}

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

    // Calculate week start date (Monday of current week)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    // Calculate end of week (Sunday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    // Fetch current leaderboard data for the week
    const leaderboardData = await fetchLeaderboardData(platform, weekStartStr, weekEndStr);
    
    // Filter users who meet minimum wager requirement
    const elegibleUsers = leaderboardData
      .filter((user: any) => (user.wagered || 0) >= minWager)
      .slice(0, maxEntries)
      .map((user: any) => ({
        username: user.username || user.name || '',
        wager_amount: user.wagered || 0
      }));

    // Get existing entries for this week from database
    const { data: existingEntries } = await supabase
      .from('raffle_entries')
      .select('*')
      .eq('platform', platform)
      .eq('week_start', weekStartStr);

    // Identify new eligible users not in database
    const existingUsernames = new Set((existingEntries || []).map(e => e.username));
    const newEntries = elegibleUsers.filter(
      (u: any) => !existingUsernames.has(u.username) && u.username
    );

    // Insert new entries to database
    if (newEntries.length > 0) {
      await supabase.from('raffle_entries').insert(
        newEntries.map((u: any) => ({
          platform,
          username: u.username,
          wager_amount: u.wager_amount,
          week_start: weekStartStr,
          entered: true,
          entry_date: new Date().toISOString()
        }))
      );
    }

    // Get all entries for this week (existing + newly inserted)
    const { data: allEntries } = await supabase
      .from('raffle_entries')
      .select('*')
      .eq('platform', platform)
      .eq('week_start', weekStartStr)
      .limit(maxEntries);

    const entriesCount = allEntries?.length || 0;

    return NextResponse.json({
      entries: allEntries || [],
      count: entriesCount,
      totalPrize: prizeAmount,
      minWager,
      maxEntries,
      weekStart: weekStartStr,
      weekEnd: weekEndStr
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
        error: 'Failed to fetch raffle entries'
      },
      { status: 500 }
    );
  }
}
