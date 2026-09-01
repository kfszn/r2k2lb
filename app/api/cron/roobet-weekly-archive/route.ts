import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Roobet leaderboard: rolling 7-day periods.
// PERIOD_ANCHOR is the start date (UTC) of the current cycle — every subsequent
// period is an exact 7-day multiple offset from this anchor.
const PERIOD_ANCHOR = "2026-08-28";
const PERIOD_DAYS = 7;
const PRIZE_TOTAL = 20000;
const REWARDS: number[] = [8000, 4000, 2400, 1600, 1200, 1000, 800, 600, 300, 100];

// One-off end-date override — mirrors app/leaderboard/roobet/page.tsx exactly.
// The cycle starting on PERIOD_ANCHOR is extended into a monthly-length
// competition and ends 9/29/2026 instead of the standard 7-day cadence.
// Every subsequent period resumes normal cadence.
const PERIOD_END_OVERRIDES: Record<string, string> = {
  "2026-08-28": "2026-09-29",
};

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII"];

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function periodEndFor(start: string): string {
  return PERIOD_END_OVERRIDES[start] ?? addDays(start, PERIOD_DAYS - 1);
}

function monthLabel(dateStr: string): string {
  return new Date(dateStr + "T00:00:00Z").toLocaleString("en-US", { month: "long", timeZone: "UTC" });
}

// Given a period start date, compute its Roman-numeral index within its
// calendar month (I, II, III, ... resets each month).
function romanIndexForPeriod(periodStart: string): number {
  let cursor = PERIOD_ANCHOR;
  let indexInMonth = 0;
  let lastMonth = monthLabel(cursor);

  while (cursor < periodStart) {
    const month = monthLabel(cursor);
    if (month !== lastMonth) {
      indexInMonth = 0;
      lastMonth = month;
    }
    indexInMonth++;
    cursor = addDays(periodEndFor(cursor), 1);
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

  // Determine the most recently completed period ending at/before today (UTC).
  // Walk forward from the anchor, tracking the previous period, so the step
  // back to "the period that just ended" is correct even when a period's
  // length was overridden (contiguous periods — prev end = current start - 1).
  const today = new Date().toISOString().slice(0, 10);
  let periodStart = PERIOD_ANCHOR;
  let periodEnd = periodEndFor(periodStart);
  let prevStart = periodStart;
  let prevEnd = periodEnd;

  while (addDays(periodEnd, 1) <= today) {
    prevStart = periodStart;
    prevEnd = periodEnd;
    periodStart = addDays(periodEnd, 1);
    periodEnd = periodEndFor(periodStart);
  }
  // Step back one period — the one that JUST ended (end date < today)
  if (periodEnd >= today) {
    periodStart = prevStart;
    periodEnd = prevEnd;
  }

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

  // Pull the final snapshot for the completed period
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  let entries: unknown[] = [];
  try {
    const res = await fetch(
      `${origin}/api/roobet/affiliates?startDate=${periodStart}&endDate=${periodEnd}`,
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

  const romanIndex = romanIndexForPeriod(periodStart);
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
