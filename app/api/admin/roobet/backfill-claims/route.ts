import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createLeaderboardClaimsForPeriod } from "@/lib/roobet/leaderboard-claims";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST — re-run leaderboard reward-claim creation against archived Roobet
// periods. The weekly cron already posts a claim for every paid rank
// regardless of profile linkage, so this is mainly a repair tool for
// periods archived before that was true, or for any period whose claims
// didn't fully post for another reason. Safe and idempotent to re-run —
// existing claims are never duplicated, only missing ranks get inserted.
//
// Body: { label?: string } — backfill a single period by its archive label
// (e.g. "September IV"). Omit to backfill every archived period on file.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { label } = body as { label?: string };

  const supabase = getSupabase();

  let query = supabase
    .from("roobet_leaderboard_archive")
    .select("label, entries")
    .order("end_date", { ascending: false });
  if (label) query = query.eq("label", label);

  const { data: periods, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!periods || periods.length === 0) {
    return NextResponse.json({ error: label ? `No archived period found for "${label}"` : "No archived periods found" }, { status: 404 });
  }

  const results: { label: string; created: unknown[]; skipped: unknown[] }[] = [];
  for (const period of periods) {
    const { created, skipped } = await createLeaderboardClaimsForPeriod(
      supabase,
      (period.entries as unknown[]) ?? [],
      period.label
    );
    results.push({ label: period.label, created, skipped });
  }

  return NextResponse.json({ results });
}
