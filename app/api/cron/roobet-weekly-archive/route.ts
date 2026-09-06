import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { addDaysToDateString, getFirstRoobetPeriod, getPreviousRoobetPeriod, ROOBET_PERIOD_DAYS } from "@/lib/roobet/period";

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
// that period's exact-cutoff wager snapshot.
const PRIZE_TOTAL = 5000;
const REWARDS: number[] = [2000, 1000, 600, 400, 300, 250, 200, 150, 75, 25];

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

  return NextResponse.json({
    message: "Archived Roobet leaderboard period",
    label,
    periodStart,
    periodEnd,
    entryCount: entries.length,
  });
}
