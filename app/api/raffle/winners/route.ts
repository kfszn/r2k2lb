import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Use service role key so RLS doesn't block admin writes
function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform') || 'acebet';
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('raffle_winners')
      .select('*')
      .eq('platform', platform)
      .order('won_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[raffle/winners GET] Supabase error:', error);
      throw error;
    }

    return NextResponse.json({ winners: data || [] });
  } catch (error) {
    console.error('[raffle/winners GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch winners' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, username, prizeAmount, weekStart } = body;

    if (!platform || !username || !prizeAmount) {
      return NextResponse.json(
        { error: `Missing required fields: platform=${platform}, username=${username}, prizeAmount=${prizeAmount}` },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('raffle_winners')
      .insert({
        platform,
        username,
        prize_amount: prizeAmount,
        week_start: weekStart || null,
        raffle_type: 'Weekly',
        won_date: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error('[raffle/winners POST] Supabase error:', error);
      return NextResponse.json(
        { error: error.message || 'Database error saving winner' },
        { status: 500 },
      );
    }

    return NextResponse.json({ winner: data?.[0] });
  } catch (error: any) {
    console.error('[raffle/winners POST] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create winner' },
      { status: 500 },
    );
  }
}
