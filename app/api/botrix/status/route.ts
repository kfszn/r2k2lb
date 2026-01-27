import { createApiClient } from "@/lib/supabase/api";
import { NextResponse } from "next/server";

// GET endpoint for Botrix $(customapi) calls
// URL: /api/botrix/status
export async function GET() {
  const supabase = createApiClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*, tournament_players(id)")
    .in("status", ["pending", "registration", "live"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!tournament) {
    return new NextResponse("No active tournament right now. Follow R2K2 for updates!", { status: 200 });
  }

  const playerCount = tournament.tournament_players?.length || 0;
  const statusText = tournament.status === "pending" 
    ? "COMING SOON" 
    : tournament.status === "registration" 
    ? "OPEN" 
    : "LIVE";

  return new NextResponse(
    `${tournament.name} | Status: ${statusText} | Players: ${playerCount}/${tournament.max_players} | Prize: $${tournament.prize_pool} | Enter: !enter YourAcebetName`,
    { status: 200 }
  );
}
