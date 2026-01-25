import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateBracket } from "@/lib/tournament/helpers";

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Bracket generation request started");
    const supabase = await createClient();
    const { tournamentId } = await request.json();

    console.log("[v0] Tournament ID:", tournamentId);

    if (!tournamentId) {
      return NextResponse.json(
        { error: "Tournament ID required" },
        { status: 400 }
      );
    }

    // Fetch all registered players
    const { data: players, error: playersError } = await supabase
      .from("tournament_players")
      .select("id, acebet_username, kick_username, seed_number")
      .eq("tournament_id", tournamentId)
      .eq("status", "registered");

    console.log("[v0] Players fetched:", players?.length, "Error:", playersError);

    if (playersError || !players || players.length < 2) {
      return NextResponse.json(
        { error: "Need at least 2 registered players" },
        { status: 400 }
      );
    }

    // Check if bracket already exists
    const { data: existingMatches } = await supabase
      .from("bracket_matches")
      .select("id")
      .eq("tournament_id", tournamentId)
      .limit(1);

    console.log("[v0] Existing matches:", existingMatches?.length);

    if (existingMatches && existingMatches.length > 0) {
      return NextResponse.json(
        { error: "Bracket already generated for this tournament" },
        { status: 400 }
      );
    }

    // Generate bracket
    console.log("[v0] Generating bracket for", players.length, "players");
    const bracketMatches = generateBracket(players);
    console.log("[v0] Generated", bracketMatches.length, "matches");

    // Insert matches
    const matchesToInsert = bracketMatches.map((match) => ({
      tournament_id: tournamentId,
      round_number: match.round,
      match_number: match.match_number,
      player1_id: match.player1_id,
      player2_id: match.player2_id,
      is_bye: !match.player1_id || !match.player2_id,
      status: "pending",
    }));

    console.log("[v0] Inserting matches:", matchesToInsert.length);

    const { error: insertError, data: insertedMatches } = await supabase
      .from("bracket_matches")
      .insert(matchesToInsert)
      .select();

    console.log("[v0] Insert result - Error:", insertError, "Inserted:", insertedMatches?.length);

    if (insertError) {
      console.error("[v0] Error inserting bracket matches:", insertError);
      throw insertError;
    }

    // Update tournament with round info
    const numRounds = Math.ceil(Math.log2(players.length));
    await supabase
      .from("tournaments")
      .update({ total_rounds: numRounds, current_round: 1 })
      .eq("id", tournamentId);

    console.log("[v0] Bracket generation successful");

    return NextResponse.json(
      {
        success: true,
        matchesGenerated: insertedMatches?.length || 0,
        rounds: numRounds,
        players: players.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[v0] Error generating bracket:", error);
    return NextResponse.json(
      { error: "Failed to generate bracket: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}
