import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const supabase = await createClient();
    const { tournamentId } = await params;

    if (!tournamentId) {
      return NextResponse.json(
        { error: "Tournament ID required" },
        { status: 400 }
      );
    }

    // Fetch bracket matches with player details
    const { data: matches, error: matchesError } = await supabase
      .from("bracket_matches")
      .select(
        `
        *,
        player1:player1_id(id, kick_username, acebet_username),
        player2:player2_id(id, kick_username, acebet_username)
        `
      )
      .eq("tournament_id", tournamentId)
      .order("round_number")
      .order("match_number");

    if (matchesError) {
      console.error("[v0] Error fetching bracket matches:", matchesError);
      return NextResponse.json(
        { error: "Failed to fetch bracket" },
        { status: 500 }
      );
    }

    return NextResponse.json({ matches: matches || [] }, { status: 200 });
  } catch (error) {
    console.error("[v0] Error in bracket endpoint:", error);
    return NextResponse.json(
      { error: "Failed to fetch bracket" },
      { status: 500 }
    );
  }
}
