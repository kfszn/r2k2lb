import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform') || 'acebet';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('raffle_winners')
      .select('*')
      .eq('platform', platform)
      .order('won_date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return NextResponse.json({ winners: data || [] });
  } catch (error) {
    console.error('Error fetching winners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch winners' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { platform, username, prizeAmount, weekStart } = await request.json();
    
    if (!platform || !username || !prizeAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('raffle_winners')
      .insert({
        platform,
        username,
        prize_amount: prizeAmount,
        week_start: weekStart,
        raffle_type: 'Weekly',
      })
      .select();
    
    if (error) throw error;
    
    return NextResponse.json({ winner: data?.[0] });
  } catch (error) {
    console.error('Error creating winner:', error);
    return NextResponse.json(
      { error: 'Failed to create winner' },
      { status: 500 }
    );
  }
}
