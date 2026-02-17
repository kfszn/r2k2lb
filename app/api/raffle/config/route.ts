import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');

  try {
    const supabase = await createClient();

    if (platform) {
      const { data, error } = await supabase
        .from('raffle_config')
        .select('*')
        .eq('platform', platform)
        .maybeSingle();

      if (error) throw error;
      
      // Return default config if not found
      if (!data) {
        return NextResponse.json({
          platform,
          min_wager: 50,
          prize_amount: 1000,
          max_entries: 10000,
          start_date: '2026-02-14',
          end_date: '2026-02-21'
        });
      }
      
      return NextResponse.json(data);
    } else {
      const { data, error } = await supabase
        .from('raffle_config')
        .select('*');

      if (error) throw error;
      return NextResponse.json(data || []);
    }
  } catch (error) {
    console.error('[v0] Error fetching raffle config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch config' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { platform, min_wager, prize_amount, max_entries, start_date, end_date } = await request.json();

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('raffle_config')
      .upsert({
        platform,
        min_wager: min_wager || 50,
        prize_amount: prize_amount || 1000,
        max_entries: max_entries || 10000,
        start_date: start_date || '2026-02-14',
        end_date: end_date || '2026-02-21',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'platform' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('[v0] Error updating raffle config:', error);
    return NextResponse.json(
      { error: 'Failed to update config' },
      { status: 500 }
    );
  }
}
