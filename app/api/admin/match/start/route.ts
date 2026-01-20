import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId } = body;

    if (!matchId) {
      return NextResponse.json(
        { error: "Missing matchId" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the match to update player statuses
    const { data: match, error: matchFetchError } = await supabase
      .from("bracket_matches")
      .select("*, player1_id, player2_id")
      .eq("id", matchId)
      .single();

    if (matchFetchError || !match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Update match status to in_progress
    const { error: matchError } = await supabase
      .from("bracket_matches")
      .update({ status: "in_progress" })
      .eq("id", matchId);

    if (matchError) {
      console.error("Error starting match:", matchError);
      return NextResponse.json(
        { error: "Failed to start match" },
        { status: 500 }
      );
    }

    // Update player statuses to playing
    if (match.player1_id) {
      await supabase
        .from("tournament_players")
        .update({ status: "playing" })
        .eq("id", match.player1_id);
    }

    if (match.player2_id) {
      await supabase
        .from("tournament_players")
        .update({ status: "playing" })
        .eq("id", match.player2_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in start match:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
