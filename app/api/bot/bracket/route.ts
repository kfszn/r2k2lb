import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Find active tournament
    const { data: tournament } = await supabase
      .from("tournaments")
      .select("*")
      .in("status", ["registration", "live"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!tournament) {
      return NextResponse.json({
        success: true,
        message: "No active tournament. Check back later!",
      });
    }

    if (tournament.status === "registration") {
      return NextResponse.json({
        success: true,
        message: `${tournament.name} hasn't started yet. Registration is still open!`,
      });
    }

    // Get remaining players
    const { data: remainingPlayers } = await supabase
      .from("tournament_players")
      .select("display_name")
      .eq("tournament_id", tournament.id)
      .neq("status", "eliminated");

    const playerNames = remainingPlayers?.map((p) => p.display_name).join(", ") || "None";

    return NextResponse.json({
      success: true,
      message: `Players still in: ${playerNames} | View full bracket at r2k2.com`,
    });
  } catch (error) {
    console.error("Error in bot bracket:", error);
    return NextResponse.json(
      { success: false, message: "Could not get bracket info" },
      { status: 500 }
    );
  }
}
