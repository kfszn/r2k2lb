import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateBracket } from "@/lib/tournament/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, status } = body;

    if (!tournamentId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const validStatuses = ["pending", "registration", "in_progress", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // If starting tournament, generate bracket first
    if (status === "in_progress") {
      // Get players for bracket generation
      const { data: players, error: playersError } = await supabase
        .from("tournament_players")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("seed", { ascending: true, nullsFirst: false });

      if (playersError || !players || players.length < 2) {
        return NextResponse.json(
          { error: "Need at least 2 players to start tournament" },
          { status: 400 }
        );
      }

      // Assign seeds to unseeded players
      const seededPlayers = players.map((player, index) => ({
        ...player,
        seed: player.seed || index + 1,
      }));

      // Update seeds for players that didn't have one
      const unseededPlayers = seededPlayers.filter(
        (p, i) => players[i].seed === null
      );
      
      for (const player of unseededPlayers) {
        await supabase
          .from("tournament_players")
          .update({ seed: player.seed, status: "checked_in" })
          .eq("id", player.id);
      }

      // Generate bracket matches
      const bracketMatches = generateBracket(seededPlayers);

      // Insert bracket matches
      const { error: matchError } = await supabase
        .from("bracket_matches")
        .insert(
          bracketMatches.map((match) => ({
            tournament_id: tournamentId,
            round: match.round,
            match_number: match.match_number,
            player1_id: match.player1_id,
            player2_id: match.player2_id,
            status: "pending",
          }))
        );

      if (matchError) {
        console.error("Error creating bracket:", matchError);
        return NextResponse.json(
          { error: "Failed to generate bracket" },
          { status: 500 }
        );
      }
    }

    // Update tournament status
    const { data: tournament, error } = await supabase
      .from("tournaments")
      .update({ status })
      .eq("id", tournamentId)
      .select()
      .single();

    if (error) {
      console.error("Error updating tournament status:", error);
      return NextResponse.json(
        { error: "Failed to update tournament status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ tournament });
  } catch (error) {
    console.error("Error in update status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
