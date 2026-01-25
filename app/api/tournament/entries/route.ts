import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get accepted players for the active tournament
    const { data: entries, error } = await supabase
      .from("tournament_players")
      .select("id, kick_username, acebet_username, status")
      .eq("status", "registered")
      .order("registered_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[v0] Error fetching entries:", error);
      return NextResponse.json(
        { entries: [], error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ entries: entries || [] }, { status: 200 });
  } catch (error) {
    console.error("[v0] Exception fetching entries:", error);
    return NextResponse.json(
      { entries: [], error: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}
