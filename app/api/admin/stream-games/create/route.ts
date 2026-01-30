import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, gameType, entries } = body;

    if (!title || !gameType || !entries || !Array.isArray(entries)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the stream game
    const { data: game, error: gameError } = await supabase
      .from('stream_games')
      .insert({
        title,
        game_type: gameType,
      })
      .select()
      .single();

    if (gameError) {
      console.error('Error creating stream game:', gameError);
      return NextResponse.json(
        { error: 'Failed to create stream game' },
        { status: 500 }
      );
    }

    // Insert all entries
    const { error: entriesError } = await supabase
      .from('stream_game_entries')
      .insert(
        entries.map((entry: any) => ({
          stream_game_id: game.id,
          username: entry.username,
          starting_balance: entry.startingBalance,
          ending_balance: entry.endingBalance,
        }))
      );

    if (entriesError) {
      console.error('Error creating stream game entries:', entriesError);
      return NextResponse.json(
        { error: 'Failed to create entries' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        message: 'Game saved successfully',
        gameId: game.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Stream games API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
