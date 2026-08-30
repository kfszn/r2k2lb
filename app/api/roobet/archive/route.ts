import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("roobet_leaderboard_archive")
    .select("id, label, start_date, end_date, prize_total, rewards, entries, created_at")
    .order("start_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ periods: data ?? [] }, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
