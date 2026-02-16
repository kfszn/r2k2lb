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
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    } else {
      const { data, error } = await supabase
        .from('raffle_config')
        .select('*');

      if (error) throw error;
      return NextResponse.json(data);
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
    const { platform, min_wager, prize_percentage, max_entries } = await request.json();

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('raffle_config')
      .update({
        min_wager: min_wager || 50,
        prize_percentage: prize_percentage || 10,
        max_entries: max_entries || 10000,
        updated_at: new Date().toISOString(),
      })
      .eq('platform', platform)
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data[0],
    });
  } catch (error) {
    console.error('[v0] Error updating raffle config:', error);
    return NextResponse.json(
      { error: 'Failed to update config' },
      { status: 500 }
    );
  }
}
