import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { username, slotName, type = 'call', timestamp } = await request.json();

    // Validate required fields
    if (!username || !slotName) {
      return NextResponse.json(
        { error: 'Missing username or slotName' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Insert into slot_calls table
    const { data, error } = await supabase
      .from('slot_calls')
      .insert({
        username,
        slot_name: slotName,
        slot: slotName, // Keep for backwards compatibility
        type,
        timestamp: timestamp || new Date().toISOString(),
        buy_amount: null,
        buy_result: null,
        status: 'pending',
      })
      .select();

    if (error) {
      console.error('[v0] Error inserting slot call:', error);
      return NextResponse.json(
        { error: 'Failed to create slot call' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Slot call added: ${slotName}`,
      data,
    });
  } catch (error) {
    console.error('[v0] Error in slot-calls route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
