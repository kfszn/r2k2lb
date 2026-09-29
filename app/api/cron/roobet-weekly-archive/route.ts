import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getPreviousRoobetPeriod, getRoobetPeriodLabel } from "@/lib/roobet/period";
import { ROOBET_PRIZE_TOTAL, ROOBET_REWARDS } from "@/lib/roobet/leaderboard-rewards";
import { normalizeRoobetEntries } from "@/lib/roobet/rank";
import { createLeaderboardClaimsForPeriod } from "@/lib/roobet/leaderboard-claims";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Roobet leaderboard: rolling periods that cut over at exactly 6:00 PM
// Eastern every ROOBET_PERIOD_DAYS days. Boundary math (including the DST
// handling and the one-off first-period length) lives in lib/roobet/period —
// this cron just asks it "what period most recently ended?" and archives
// that period's exact-cutoff wager snapshot. Prize amounts live in
// lib/roobet/leaderboard-rewards so the live account-page stat card and this
// archive/payout step never disagree on numbers.
const PRIZE_TOTAL = ROOBET_PRIZE_TOTAL;
const REWARDS: number[] = ROOBET_REWARDS;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const previous = getPreviousRoobetPeriod();
  if (!previous) {
    return NextResponse.json({ message: "No period has ended yet" });
  }
  const { startDate: periodStart, endDate: periodEnd, startISO, endISO } = previous;

  const supabase = getSupabase();

  // Skip if already archived
  const { data: existing } = await supabase
    .from("roobet_leaderboard_archive")
    .select("id")
    .eq("start_date", periodStart)
    .eq("end_date", periodEnd)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ message: "Period already archived", periodStart, periodEnd });
  }

  // Pull the final snapshot for the completed period, using the exact
  // 6:00 PM ET cutover instants so wagers from the NEXT (already-live) period
  // never leak into this archived total.
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  let entries: unknown[] = [];
  try {
    const res = await fetch(
      `${origin}/api/roobet/affiliates?startDate=${encodeURIComponent(startISO)}&endDate=${encodeURIComponent(endISO)}`,
      { cache: "no-store" }
    );
    const json = await res.json();
    entries = normalizeRoobetEntries(json);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch Roobet snapshot", detail: error instanceof Error ? error.message : String(error) },
      { status: 502 }
    );
  }

  const label = getRoobetPeriodLabel(periodEnd);

  const { error: insertError } = await supabase.from("roobet_leaderboard_archive").insert({
    label,
    start_date: periodStart,
    end_date: periodEnd,
    prize_total: PRIZE_TOTAL,
    rewards: REWARDS,
    entries,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Automatically post leaderboard prizes to reward_claims for every ranked,
  // paid-position player — keyed by username, not by an existing profile —
  // so payouts show up in a player's account Rewards & Claims panel as soon
  // as they link that username, even if that happens well after this period
  // was archived. Idempotent per (platform, username, category,
  // period_label) — safe if this cron ever reruns for the same
  // already-archived period.
  //
  // Ranks with the SAME shared weighted-wager sort the public leaderboard
  // and account stat card use, so the username attached to each rank here
  // always matches the placement players actually see.
  const { created, skipped } = await createLeaderboardClaimsForPeriod(supabase, entries, label);

  return NextResponse.json({
    message: "Archived Roobet leaderboard period",
    label,
    periodStart,
    periodEnd,
    entryCount: entries.length,
    claimsCreated: created,
    claimsSkipped: skipped,
  });
}
