import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { kickUsername, slotName, botSecret } = await request.json();

    // Validate required fields
    if (!kickUsername || !slotName) {
      return NextResponse.json(
        { error: 'Missing kickUsername or slotName' },
        { status: 400 }
      );
    }

    // Validate bot secret
    if (botSecret !== process.env.BOT_SECRET) {
      return NextResponse.json(
        { error: 'Invalid bot secret' },
        { status: 401 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Insert into slot_calls table
    const { data, error } = await supabase.from('slot_calls').insert({
      username: kickUsername,
      slot: slotName,
      buy_amount: 0,
      buy_result: null,
      status: 'pending',
    }).select();

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
