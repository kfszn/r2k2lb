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
      console.log('[v0] No config found for platform:', platform);
      return NextResponse.json({
        entries: [],
        count: 0,
        totalPrize: 0,
        minWager: 50,
        maxEntries: 10000,
        startDate: '2026-02-14',
        endDate: '2026-02-21'
      });
    }

    const minWager = configData.min_wager;
    const prizeAmount = configData.prize_amount;
    const maxEntries = configData.max_entries;
    const startDate = configData.start_date;
    const endDate = configData.end_date;

    console.log('[v0] Raffle config loaded - platform:', platform, 'minWager:', minWager, 'startDate:', startDate, 'endDate:', endDate);

    // Use the existing leaderboard API which already fetches from Acebet/Packdraw
    let eligibleUsers: any[] = [];
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const leaderboardUrl = `${baseUrl}/api/leaderboard?start_at=${startDate}&end_at=${endDate}`;
      
      console.log('[v0] Fetching leaderboard from:', leaderboardUrl);
      
      const leaderboardRes = await fetch(leaderboardUrl, {
        cache: 'no-store',
        method: 'GET'
      });

      if (!leaderboardRes.ok) {
        console.error('[v0] Leaderboard API error:', leaderboardRes.status);
        throw new Error(`Leaderboard returned ${leaderboardRes.status}`);
      }

      const leaderboardData = await leaderboardRes.json();
      console.log('[v0] Leaderboard response - users:', leaderboardData.data?.length || 0);

      // Filter users who wagered at least the minimum amount
      eligibleUsers = (leaderboardData.data || [])
        .filter((user: any) => (user.wagered || 0) >= minWager)
        .slice(0, maxEntries)
        .map((user: any) => ({
          username: user.name || user.username || '',
          wager_amount: user.wagered || 0
        }));
      
      console.log('[v0] Eligible users after filtering:', eligibleUsers.length, 'eligible');
    } catch (fetchError) {
      console.error('[v0] Error fetching leaderboard:', fetchError);
    }

    // Sync eligible users to database
    if (eligibleUsers.length > 0) {
      // Get existing entries
      const { data: existingEntries } = await supabase
        .from('raffle_entries')
        .select('username')
        .eq('platform', platform)
        .eq('week_start', startDate);

      const existingUsernames = new Set((existingEntries || []).map(e => e.username));
      const newEntries = eligibleUsers.filter(u => !existingUsernames.has(u.username) && u.username);

      if (newEntries.length > 0) {
        console.log('[v0] Inserting', newEntries.length, 'new raffle entries');
        const { error: insertError } = await supabase.from('raffle_entries').insert(
          newEntries.map((u: any) => ({
            platform,
            username: u.username,
            wager_amount: u.wager_amount,
            week_start: startDate,
            entered: true,
            entry_date: new Date().toISOString()
          }))
        );
        if (insertError) {
          console.error('[v0] Insert error:', insertError);
        }
      }
    }

    // Get all entries for this raffle period
    const { data: allEntries, error: entriesError } = await supabase
      .from('raffle_entries')
      .select('*')
      .eq('platform', platform)
      .eq('week_start', startDate)
      .limit(maxEntries);

    if (entriesError) {
      console.error('[v0] Error fetching entries from DB:', entriesError);
    }

    console.log('[v0] Total entries for display:', allEntries?.length || 0);

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

    const minWager = configData.min_wager;
    const prizeAmount = configData.prize_amount;
    const maxEntries = configData.max_entries;
    const startDate = configData.start_date;
    const endDate = configData.end_date;

    console.log('[v0] Raffle config loaded - platform:', platform, 'minWager:', minWager, 'startDate:', startDate, 'endDate:', endDate);

    // Fetch from Acebet or Packdraw API based on platform
    let apiUrl = '';
    if (platform === 'acebet') {
      apiUrl = 'https://api.acebet.com/affiliates/detailed-summary/v2/';
    } else if (platform === 'packdraw') {
      apiUrl = 'https://api.packdraw.com/affiliates/detailed-summary/v2/';
    }

    console.log('[v0] Fetching from API:', apiUrl);

    let eligibleUsers: any[] = [];
    if (apiUrl) {
      try {
        const apiResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': platform === 'acebet' ? process.env.ACEBET_API_KEY || '' : process.env.PACKDRAW_API_KEY || ''
          },
          body: JSON.stringify({
            dateFrom: startDate,
            dateTo: endDate
          }),
          cache: 'no-store'
        });

        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          console.log('[v0] API response received:', apiData?.data?.length || 0, 'users');
          
          // Filter users who wagered at least the minimum amount
          eligibleUsers = (apiData.data || [])
            .filter((user: any) => (user.wagered || user.total_wagered || 0) >= minWager)
            .map((user: any) => ({
              username: user.name || user.username || '',
              wager_amount: user.wagered || user.total_wagered || 0
            }));
          
          console.log('[v0] Eligible users after filtering:', eligibleUsers.length);
        } else {
          console.error('[v0] API fetch failed:', apiResponse.status);
        }
      } catch (apiError) {
        console.error('[v0] Error fetching from API:', apiError);
      }
    }

    // Sync eligible users to database
    if (eligibleUsers.length > 0) {
      // Get existing entries
      const { data: existingEntries } = await supabase
        .from('raffle_entries')
        .select('username')
        .eq('platform', platform)
        .eq('week_start', startDate);

      const existingUsernames = new Set((existingEntries || []).map(e => e.username));
      const newEntries = eligibleUsers.filter(u => !existingUsernames.has(u.username) && u.username);

      if (newEntries.length > 0) {
        console.log('[v0] Inserting', newEntries.length, 'new entries');
        await supabase.from('raffle_entries').insert(
          newEntries.map((u: any) => ({
            platform,
            username: u.username,
            wager_amount: u.wager_amount,
            week_start: startDate,
            entered: true,
            entry_date: new Date().toISOString()
          }))
        );
      }
    }

    // Get all entries for this raffle period
    const { data: allEntries, error: entriesError } = await supabase
      .from('raffle_entries')
      .select('*')
      .eq('platform', platform)
      .eq('week_start', startDate)
      .limit(maxEntries);

    if (entriesError) {
      console.error('[v0] Error fetching entries from DB:', entriesError);
    }

    console.log('[v0] Total entries for display:', allEntries?.length || 0);

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
