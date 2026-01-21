import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      maxPlayers,
      prizePool,
      minWager,
      wagerTimeframe,
      requireActive,
      buyIn,
      gameName,
      betAmount,
      spinCount,
    } = body;

    if (!name || !maxPlayers) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: tournament, error } = await supabase
      .from("tournaments")
      .insert({
        name,
        description: description || null,
        max_players: maxPlayers,
        prize_pool: prizePool || 0,
        min_wager: minWager || 0,
        wager_timeframe: wagerTimeframe || "all",
        require_active: requireActive !== false,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating tournament:", error);
      return NextResponse.json(
        { error: "Failed to create tournament" },
        { status: 500 }
      );
    }

    return NextResponse.json({ tournament });
  } catch (error) {
    console.error("Error in create tournament:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
