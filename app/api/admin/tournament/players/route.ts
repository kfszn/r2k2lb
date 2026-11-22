import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTournamentRoobetWagerMap } from "@/lib/tournament/roobet-wager";

export const dynamic = "force-dynamic";

// Returns a tournament's players with each player's live Roobet wager for the
// tournament's selected wager timeframe, and persists the refreshed values.
export async function GET(request: NextRequest) {
  const tournamentId = request.nextUrl.searchParams.get("tournamentId");
  if (!tournamentId) {
    return NextResponse.json({ error: "Missing tournamentId" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: players, error } = await supabase
    .from("tournament_players")
    .select("*")
    .eq("tournament_id", tournamentId);

  if (error) {
    return NextResponse.json({ error: "Failed to load players" }, { status: 500 });
  }

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("wager_timeframe")
    .eq("id", tournamentId)
    .single();

  const live = await getTournamentRoobetWagerMap(tournament?.wager_timeframe);
  if (!live) {
    return NextResponse.json({ players: players ?? [], period: null, live: false });
  }

  const updated = (players ?? []).map((p) => {
    if (!p.roobet_username) return p;
    const wager = live.wagers.get(String(p.roobet_username).toLowerCase()) ?? 0;
    return { ...p, roobet_wager: wager, roobet_active: wager > 0 };
  });

  const changed = updated.filter((p, i) => {
    const prev = players![i];
    return p.roobet_wager !== prev.roobet_wager || p.roobet_active !== prev.roobet_active;
  });

  await Promise.all(
    changed.map((p) =>
      supabase
        .from("tournament_players")
        .update({ roobet_wager: p.roobet_wager, roobet_active: p.roobet_active })
        .eq("id", p.id)
    )
  );

  return NextResponse.json({ players: updated, period: live.window, live: true });
}
