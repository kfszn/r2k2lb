import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";

// Never cache — this feeds the live raffle draw, always pull fresh data.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

const proxyAgent = process.env.PROXY_URL
  ? new HttpsProxyAgent(process.env.PROXY_URL)
  : undefined;

const ROOBET_API_KEY = process.env.ROOBET_API_KEY;

// Our Roobet affiliate account's userId (per Roobet's Affiliate Stats API spec —
// this identifies OUR affiliate account, not an individual customer).
const ROOBET_AFFILIATE_USER_ID = "51b44ea5-f07c-41c8-9daf-9a35718b459e";

// Per Roobet's official "Affiliate Stats API" OpenAPI spec:
//   Base URL: https://roobetconnect.com
//   GET /affiliate/v2/stats?userId=...&startDate=...&endDate=...
// NOTE: This endpoint only returns ONE aggregated "highestMultiplier" per
// player for whatever date window you query — it does not expose every
// qualifying bet. Querying the full raffle window in one shot means a
// player's single biggest multiplier hit for the whole week is the only one
// ever seen, and if THAT ONE bet happened to be a tiny stake, the min-bet-size
// filter wrongly disqualifies the player entirely — even if they also cleared
// the threshold on a much bigger bet on a different day. We query day-by-day
// and track each player's best multiplier hit that independently clears both
// the threshold AND the min bet size on that day, so a disqualifying tiny bet
// on one day can never hide a qualifying bet on another day.
const ROOBET_ENDPOINT = "https://roobetconnect.com/affiliate/v2/stats";

const MAX_RANGE_DAYS = 92; // ~3 months — bounds how many upstream calls we make
const CONCURRENCY = 5; // how many days we fetch in parallel per batch

function isISODate(s: string | null): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function toISODateUTC(d: Date) {
  return d.toISOString().slice(0, 10);
}

function enumerateDaysInclusive(startISO: string, endISO: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${startISO}T00:00:00.000Z`);
  const end = new Date(`${endISO}T00:00:00.000Z`);
  while (cursor.getTime() <= end.getTime()) {
    days.push(toISODateUTC(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

function normalizeEntries(raw: unknown): any[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    for (const key of ["data", "affiliates", "results", "leaderboard", "entries"]) {
      const val = (raw as Record<string, unknown>)[key];
      if (Array.isArray(val)) return val;
    }
  }
  return [];
}

const MAX_ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// A day that fails after every retry is reported as failed instead of being
// treated as "no hits", so a rate limit or timeout can never silently drop
// qualifying players from the draw.
async function fetchDay(
  dayISO: string,
): Promise<{ day: string; rows: any[]; failed: boolean }> {
  const upstream = new URL(ROOBET_ENDPOINT);
  upstream.searchParams.set("userId", ROOBET_AFFILIATE_USER_ID);
  upstream.searchParams.set("startDate", `${dayISO}T00:00:00.000Z`);
  upstream.searchParams.set("endDate", `${dayISO}T23:59:59.999Z`);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const r = await fetch(upstream.toString(), {
        headers: {
          Authorization: `Bearer ${ROOBET_API_KEY}`,
          Accept: "application/json",
        },
        // @ts-ignore — node-fetch agent type vs built-in fetch
        agent: proxyAgent,
        signal: AbortSignal.timeout(10_000),
      });

      if (r.ok) {
        const json = await r.json().catch(() => null);
        return { day: dayISO, rows: normalizeEntries(json), failed: false };
      }
      console.log(`[v0] multiplier-eligibility ${dayISO}: not ok (${r.status}) attempt ${attempt}`);
    } catch (err) {
      console.log(
        `[v0] multiplier-eligibility ${dayISO}: error attempt ${attempt}`,
        err instanceof Error ? err.message : err,
      );
    }
    if (attempt < MAX_ATTEMPTS) await sleep(500 * attempt);
  }

  return { day: dayISO, rows: [], failed: true };
}

export async function GET(request: NextRequest) {
  if (!ROOBET_API_KEY) {
    return NextResponse.json(
      { error: "Roobet API key is not configured" },
      { status: 500 },
    );
  }

  const { searchParams } = request.nextUrl;
  const startParam = searchParams.get("startDate");
  const endParam = searchParams.get("endDate");
  const threshold = Number(searchParams.get("threshold") ?? 200);
  const minBetSize = Number(searchParams.get("minBetSize") ?? 0);

  if (!isISODate(startParam) || !isISODate(endParam)) {
    return NextResponse.json(
      { error: "Provide startDate and endDate as YYYY-MM-DD" },
      { status: 400 },
    );
  }

  let start = startParam;
  let end = endParam;
  if (new Date(`${start}T00:00:00Z`).getTime() > new Date(`${end}T00:00:00Z`).getTime()) {
    [start, end] = [end, start];
  }

  // Never look past today (UTC) — the API can't return future data anyway.
  const todayISO = toISODateUTC(new Date());
  if (end > todayISO) end = todayISO;

  const days = enumerateDaysInclusive(start, end);

  if (days.length > MAX_RANGE_DAYS) {
    return NextResponse.json(
      { error: `Range spans ${days.length} days; max is ${MAX_RANGE_DAYS}. Narrow the date range.` },
      { status: 400 },
    );
  }

  const dayResults: { day: string; rows: any[]; failed: boolean }[] = [];
  for (let i = 0; i < days.length; i += CONCURRENCY) {
    const batch = days.slice(i, i + CONCURRENCY);
    dayResults.push(...(await Promise.all(batch.map(fetchDay))));
  }

  const best = new Map<
    string,
    { multiplier: number; wagered: number; gameTitle: string | null; date: string }
  >();

  for (const { day, rows } of dayResults) {
    for (const row of rows) {
      const username = row?.username;
      if (!username) continue;

      const hm = row?.highestMultiplier;
      const multiplier = hm && typeof hm === "object" ? Number(hm.multiplier) : Number(hm);
      const wagered = hm && typeof hm === "object" ? Number(hm.wagered) : NaN;

      if (!Number.isFinite(multiplier) || multiplier < threshold) continue;
      if (!Number.isFinite(wagered) || wagered < minBetSize) continue;

      const existing = best.get(username);
      if (!existing || multiplier > existing.multiplier) {
        best.set(username, {
          multiplier,
          wagered,
          gameTitle: hm && typeof hm === "object" ? (hm.gameTitle ?? hm.gameId ?? null) : null,
          date: day,
        });
      }
    }
  }

  const users = Array.from(best.entries()).map(([username, b]) => ({
    username,
    highestMultiplier: {
      multiplier: b.multiplier,
      wagered: b.wagered,
      gameTitle: b.gameTitle,
      date: b.date,
    },
  }));

  const failedDays = dayResults.filter((d) => d.failed).map((d) => d.day);

  return NextResponse.json(
    { users, days: days.length, start, end, failedDays },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
