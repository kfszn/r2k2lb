import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { addDaysToDateString, getFirstRoobetPeriod, getPreviousRoobetPeriod, ROOBET_PERIOD_DAYS } from "@/lib/roobet/period";
import { ROOBET_PRIZE_TOTAL, ROOBET_REWARDS, roobetPrizeForRank } from "@/lib/roobet/leaderboard-rewards";

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

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII"];

function monthLabel(dateStr: string): string {
  return new Date(dateStr + "T00:00:00Z").toLocaleString("en-US", { month: "long", timeZone: "UTC" });
}

// Given a period's (ET) start date, compute its Roman-numeral index within
// its calendar month (I, II, III, ... resets each month). Walks the same
// fixed-length cadence used everywhere else, seeded from the first period's
// actual boundaries so a one-off first-period length doesn't throw off the
// month-relative count.
function romanIndexForPeriod(periodStart: string, firstPeriodStart: string, firstPeriodEnd: string): number {
  let cursor = firstPeriodStart;
  let cursorEnd = firstPeriodEnd;
  let indexInMonth = 0;
  let lastMonth = monthLabel(cursor);

  while (cursor < periodStart) {
    const month = monthLabel(cursor);
    if (month !== lastMonth) {
      indexInMonth = 0;
      lastMonth = month;
    }
    indexInMonth++;
    cursor = addDaysToDateString(cursorEnd, 1);
    cursorEnd = addDaysToDateString(cursor, ROOBET_PERIOD_DAYS - 1);
  }
  // one more increment for the period we stopped on
  const month = monthLabel(cursor);
  if (month !== lastMonth) indexInMonth = 0;
  indexInMonth++;
  return indexInMonth;
}

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
    entries = Array.isArray(json) ? json : (json?.data ?? json?.affiliates ?? json?.results ?? []);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch Roobet snapshot", detail: error instanceof Error ? error.message : String(error) },
      { status: 502 }
    );
  }

  // The very first period's own start/end date anchor the month-relative
  // Roman-numeral count for every period after it.
  const firstPeriod = getFirstRoobetPeriod();
  const romanIndex = romanIndexForPeriod(periodStart, firstPeriod.startDate, firstPeriod.endDate);

  const label = `${monthLabel(periodStart)} ${ROMAN[romanIndex - 1] ?? romanIndex}`;

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

  // Automatically post leaderboard prizes to reward_claims for every ranked
  // player who has this platform linked, so payouts show up in their
  // account's Rewards & Claims panel without any manual entry. Idempotent
  // per (platform, username, category, period_label) — safe if this cron
  // ever reruns for the same already-archived period.
  const rankedEntries = (entries as { username?: string; name?: string; wagered?: number; wagerAmount?: number; totalWagered?: number }[])
    .map((e) => ({
      username: e.username ?? e.name ?? "",
      wagered: e.wagered ?? e.wagerAmount ?? e.totalWagered ?? 0,
    }))
    .filter((e) => e.username)
    .sort((a, b) => b.wagered - a.wagered)
    .slice(0, REWARDS.length);

  const claimErrors: string[] = [];
  for (let i = 0; i < rankedEntries.length; i++) {
    const rank = i + 1;
    const prize = roobetPrizeForRank(rank);
    if (prize <= 0) continue;
    const { username } = rankedEntries[i];

    const { data: profile } = await supabase
      .from("profiles")
      .select("roobet_username")
      .ilike("roobet_username", username)
      .maybeSingle();
    if (!profile) continue;

    const { data: existingClaim } = await supabase
      .from("reward_claims")
      .select("id")
      .eq("platform", "roobet")
      .ilike("username", username)
      .eq("category", "leaderboard")
      .eq("period_label", label)
      .maybeSingle();
    if (existingClaim) continue;

    const { error: claimError } = await supabase.from("reward_claims").insert({
      platform: "roobet",
      username,
      category: "leaderboard",
      title: `Weekly Leaderboard — Rank #${rank}`,
      amount: prize,
      status: "pending",
      period_label: label,
    });
    if (claimError) claimErrors.push(`${username}: ${claimError.message}`);
  }

  return NextResponse.json({
    message: "Archived Roobet leaderboard period",
    label,
    periodStart,
    periodEnd,
    entryCount: entries.length,
    claimErrors: claimErrors.length > 0 ? claimErrors : undefined,
  });
}
