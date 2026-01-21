import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId, seed } = body;

    if (!playerId || seed === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get player to check tournament status
    const { data: player, error: playerFetchError } = await supabase
      .from("tournament_players")
      .select("*, tournaments!inner(status)")
      .eq("id", playerId)
      .single();

    if (playerFetchError || !player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    // Only allow seeding during registration
    if (player.tournaments.status !== "registration") {
      return NextResponse.json(
        { error: "Cannot change seed after tournament has started" },
        { status: 400 }
      );
    }

    // Update seed
    const { error } = await supabase
      .from("tournament_players")
      .update({ seed })
      .eq("id", playerId);

    if (error) {
      console.error("Error setting seed:", error);
      return NextResponse.json(
        { error: "Failed to set seed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in set seed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
