import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/api";
import { formatCurrency } from "@/lib/tournament/client-utils";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient();

    // Find active tournament
    const { data: tournament } = await supabase
      .from("tournaments")
      .select("*")
      .in("status", ["registration", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!tournament) {
      return NextResponse.json({
        success: true,
        message: "No active tournament right now. Stay tuned!",
      });
    }

    // Get player count
    const { count } = await supabase
      .from("tournament_players")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", tournament.id);

    if (tournament.status === "registration") {
      return NextResponse.json({
        success: true,
        message: `${tournament.name} - Registration OPEN! ${count}/${tournament.max_players} players | Prize Pool: ${formatCurrency(tournament.prize_pool)} | Type !join <acebet_username> to enter!`,
      });
    }

    // Get current match if in progress
    const { data: currentMatch } = await supabase
      .from("bracket_matches")
      .select(`
        *,
        player1:tournament_players!bracket_matches_player1_id_fkey(display_name),
        player2:tournament_players!bracket_matches_player2_id_fkey(display_name)
      `)
      .eq("tournament_id", tournament.id)
      .eq("status", "in_progress")
      .single();

    if (currentMatch) {
      return NextResponse.json({
        success: true,
        message: `${tournament.name} - LIVE NOW! ${currentMatch.player1?.display_name} vs ${currentMatch.player2?.display_name} | Watch at r2k2.com`,
      });
    }

    return NextResponse.json({
      success: true,
      message: `${tournament.name} is in progress! ${count} players competing for ${formatCurrency(tournament.prize_pool)}`,
    });
  } catch (error) {
    console.error("Error in bot status:", error);
    return NextResponse.json(
      { success: false, message: "Could not get tournament status" },
      { status: 500 }
    );
  }
}
