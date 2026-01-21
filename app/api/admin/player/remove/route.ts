import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId } = body;

    if (!playerId) {
      return NextResponse.json(
        { error: "Missing playerId" },
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

    // Only allow removal during registration
    if (player.tournaments.status !== "registration") {
      return NextResponse.json(
        { error: "Cannot remove player after tournament has started" },
        { status: 400 }
      );
    }

    // Remove player
    const { error } = await supabase
      .from("tournament_players")
      .delete()
      .eq("id", playerId);

    if (error) {
      console.error("Error removing player:", error);
      return NextResponse.json(
        { error: "Failed to remove player" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in remove player:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
