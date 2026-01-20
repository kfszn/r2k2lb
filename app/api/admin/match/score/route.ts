import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, player1Score, player2Score } = body;

    if (!matchId || player1Score === undefined || player2Score === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the match details
    const { data: match, error: matchFetchError } = await supabase
      .from("bracket_matches")
      .select("*, tournament_id")
      .eq("id", matchId)
      .single();

    if (matchFetchError || !match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Determine winner
    const winnerId = player1Score > player2Score ? match.player1_id : match.player2_id;
    const loserId = player1Score > player2Score ? match.player2_id : match.player1_id;

    // Update match with scores and winner
    const { error: matchError } = await supabase
      .from("bracket_matches")
      .update({
        player1_score: player1Score,
        player2_score: player2Score,
        winner_id: winnerId,
        status: "completed",
      })
      .eq("id", matchId);

    if (matchError) {
      console.error("Error updating match:", matchError);
      return NextResponse.json(
        { error: "Failed to update match" },
        { status: 500 }
      );
    }

    // Update winner's best multiplier if higher
    const winnerScore = player1Score > player2Score ? player1Score : player2Score;
    const { data: winner } = await supabase
      .from("tournament_players")
      .select("best_multiplier")
      .eq("id", winnerId)
      .single();

    if (!winner?.best_multiplier || winnerScore > winner.best_multiplier) {
      await supabase
        .from("tournament_players")
        .update({ best_multiplier: winnerScore, status: "checked_in" })
        .eq("id", winnerId);
    } else {
      await supabase
        .from("tournament_players")
        .update({ status: "checked_in" })
        .eq("id", winnerId);
    }

    // Update loser's best multiplier and status
    const loserScore = player1Score > player2Score ? player2Score : player1Score;
    const { data: loser } = await supabase
      .from("tournament_players")
      .select("best_multiplier")
      .eq("id", loserId)
      .single();

    if (!loser?.best_multiplier || loserScore > loser.best_multiplier) {
      await supabase
        .from("tournament_players")
        .update({ best_multiplier: loserScore, status: "eliminated" })
        .eq("id", loserId);
    } else {
      await supabase
        .from("tournament_players")
        .update({ status: "eliminated" })
        .eq("id", loserId);
    }

    // Find the next match for the winner and add them
    const { data: nextMatches } = await supabase
      .from("bracket_matches")
      .select("*")
      .eq("tournament_id", match.tournament_id)
      .eq("round", match.round + 1)
      .order("match_number", { ascending: true });

    if (nextMatches && nextMatches.length > 0) {
      // Calculate which next match this winner should go to
      const nextMatchIndex = Math.floor((match.match_number - 1) / 2);
      const nextMatch = nextMatches[nextMatchIndex];

      if (nextMatch) {
        // Determine if winner goes to player1 or player2 slot
        const isFirstFromPair = (match.match_number - 1) % 2 === 0;

        await supabase
          .from("bracket_matches")
          .update(
            isFirstFromPair
              ? { player1_id: winnerId }
              : { player2_id: winnerId }
          )
          .eq("id", nextMatch.id);
      }
    } else {
      // This was the finals - mark winner as tournament winner
      await supabase
        .from("tournament_players")
        .update({ status: "winner" })
        .eq("id", winnerId);

      // Get winner's Acebet username and record in winners table
      const { data: winnerPlayer } = await supabase
        .from("tournament_players")
        .select("acebet_username")
        .eq("id", winnerId)
        .single();

      if (winnerPlayer?.acebet_username) {
        // Check if winner already exists in winners table
        const { data: existingWinner } = await supabase
          .from("tournament_winners")
          .select("*")
          .eq("acebet_username", winnerPlayer.acebet_username)
          .single();

        if (existingWinner) {
          // Increment win count
          await supabase
            .from("tournament_winners")
            .update({ 
              win_count: existingWinner.win_count + 1,
              updated_at: new Date().toISOString()
            })
            .eq("id", existingWinner.id);
        } else {
          // Add new winner
          await supabase
            .from("tournament_winners")
            .insert({
              acebet_username: winnerPlayer.acebet_username,
              win_count: 1,
            });
        }
      }

      // Mark tournament as completed
      await supabase
        .from("tournaments")
        .update({ status: "completed", ended_at: new Date().toISOString() })
        .eq("id", match.tournament_id);
    }

    return NextResponse.json({ success: true, winnerId });
  } catch (error) {
    console.error("Error in submit score:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
