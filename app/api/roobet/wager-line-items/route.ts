import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";

// Never cache — this is an admin verification tool, always pull live data.
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
// NOTE: This endpoint only returns one aggregated total per player for
// whatever date window you query — there is no native "line item" / daily
// breakdown. To reconstruct a day-by-day history for a single player, we
// call the endpoint once per calendar day in the requested range and pull
// that player's row out of each day's response.
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

function getRawWagered(e: any): number {
  return Number(e.wagered ?? e.wagerAmount ?? e.totalWagered ?? 0) || 0;
}

function getWeightedWagered(e: any): number {
  const weighted = Number(e.weightedWagered);
  if (Number.isFinite(weighted)) return weighted;
  return getRawWagered(e);
}

async function fetchDay(dayISO: string) {
  const upstream = new URL(ROOBET_ENDPOINT);
  upstream.searchParams.set("userId", ROOBET_AFFILIATE_USER_ID);
  upstream.searchParams.set("startDate", `${dayISO}T00:00:00.000Z`);
  upstream.searchParams.set("endDate", `${dayISO}T23:59:59.999Z`);

  try {
    const r = await fetch(upstream.toString(), {
      headers: {
        Authorization: `Bearer ${ROOBET_API_KEY}`,
        Accept: "application/json",
      },
      // @ts-ignore — node-fetch agent type vs built-in fetch
      agent: proxyAgent,
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "no body");
      console.log(`[v0] wager-line-items ${dayISO}: not ok (${r.status}): ${text.slice(0, 200)}`);
      return { day: dayISO, rows: [] as any[], error: `upstream_${r.status}` };
    }

    const json = await r.json().catch(() => null);
    return { day: dayISO, rows: normalizeEntries(json), error: null as string | null };
  } catch (err) {
    console.log(`[v0] wager-line-items ${dayISO}: error`, err instanceof Error ? err.message : err);
    return { day: dayISO, rows: [] as any[], error: "network_error" };
  }
}

export async function GET(request: NextRequest) {
  if (!ROOBET_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "missing_token", detail: "Set ROOBET_API_KEY in Vercel env vars." },
      { status: 500 }
    );
  }

  const { searchParams } = request.nextUrl;
  const username = (searchParams.get("username") ?? "").trim();
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  if (!username) {
    return NextResponse.json(
      { ok: false, error: "missing_username", detail: "Provide a Roobet username." },
      { status: 400 }
    );
  }

  if (!isISODate(startParam) || !isISODate(endParam)) {
    return NextResponse.json(
      { ok: false, error: "bad_dates", detail: "Provide start and end as YYYY-MM-DD." },
      { status: 400 }
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
      {
        ok: false,
        error: "range_too_large",
        detail: `Range spans ${days.length} days; max is ${MAX_RANGE_DAYS}. Narrow the date range.`,
      },
      { status: 400 }
    );
  }

  const results: { day: string; rows: any[]; error: string | null }[] = [];
  for (let i = 0; i < days.length; i += CONCURRENCY) {
    const batch = days.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(fetchDay));
    results.push(...batchResults);
  }

  const lowerUsername = username.toLowerCase();
  let anyUpstreamError = false;

  const lineItems = results.map(({ day, rows, error }) => {
    if (error) anyUpstreamError = true;

    const row = rows.find((r) => {
      const name = r?.username ?? r?.name;
      return typeof name === "string" && name.toLowerCase() === lowerUsername;
    });

    if (!row) {
      return {
        date: day,
        found: false,
        userId: null,
        wagered: 0,
        weightedWagered: 0,
        favoriteGameId: null,
        favoriteGameTitle: null,
        rankLevel: null,
        rankLevelImage: null,
        highestMultiplier: null,
        highestMultiplierGame: null,
      };
    }

    // Roobet sends highestMultiplier as a nested object:
    // { multiplier, wagered, payout, gameId, gameTitle }
    const hm = row.highestMultiplier;
    const highestMultiplier =
      hm && typeof hm === "object" && Number.isFinite(Number(hm.multiplier))
        ? Number(hm.multiplier)
        : Number.isFinite(Number(hm))
          ? Number(hm)
          : null;
    const highestMultiplierGame =
      hm && typeof hm === "object" ? hm.gameTitle ?? hm.gameId ?? null : null;

    return {
      date: day,
      found: true,
      userId: row.userId ?? row.uid ?? row.id ?? null,
      wagered: getRawWagered(row),
      weightedWagered: getWeightedWagered(row),
      favoriteGameId: row.favoriteGameId ?? null,
      favoriteGameTitle: row.favoriteGameTitle ?? null,
      rankLevel: row.rankLevel ?? null,
      rankLevelImage: row.rankLevelImage ?? null,
      highestMultiplier,
      highestMultiplierGame,
      raw: row,
    };
  });

  const totals = lineItems.reduce(
    (acc, item) => {
      acc.wagered += item.wagered;
      acc.weightedWagered += item.weightedWagered;
      acc.activeDays += item.found ? 1 : 0;
      if (item.highestMultiplier != null && item.highestMultiplier > acc.highestMultiplier) {
        acc.highestMultiplier = item.highestMultiplier;
        acc.highestMultiplierGame = item.highestMultiplierGame;
        acc.highestMultiplierDate = item.date;
      }
      return acc;
    },
    {
      wagered: 0,
      weightedWagered: 0,
      activeDays: 0,
      highestMultiplier: 0,
      highestMultiplierGame: null as string | null,
      highestMultiplierDate: null as string | null,
    }
  );

  return NextResponse.json(
    {
      ok: true,
      username,
      start,
      end,
      days: days.length,
      partialUpstreamError: anyUpstreamError,
      totals,
      lineItems,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
