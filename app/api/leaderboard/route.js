// api/leaderboard.js — Vercel Serverless Function (Roobet) + FAST CACHE
// Builds the leaderboard from Roobet's official "Affiliate Stats API" for a
// given window. Supports:
//   - ?start_at=YYYY-MM-DD&end_at=YYYY-MM-DD
//   - ?prev=1  (previous window same length)
//   - ?fresh=1 (force recompute; bypass cache)
// Adds CORS and returns JSON sorted by wagered desc.
//
// NOTE ON UNITS: Roobet's API returns wager amounts in DOLLARS, but every
// existing consumer of this route (dynamic-race-track, wager-verification,
// milestones/progress.ts, total-wager-stats, raffle-manager) was built
// against the legacy AceBet contract, which returned amounts in PENNIES.
// To avoid touching every consumer, this route keeps returning "wagered",
// "deposited", "earned" in penny-equivalent units (dollars * 100) so the
// response shape is unchanged even though the upstream provider is now Roobet.
//
// Cycle: 2026-07-30 → 2026-08-31 | Prize pool: $20,000

// ===============================
// 🔥 PROXY + FETCH SETUP FOR CLOUDFLARE BYPASS
// ===============================
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

const proxyAgent = process.env.PROXY_URL ? new HttpsProxyAgent(process.env.PROXY_URL) : undefined;
const ROOBET_API_KEY = process.env.ROOBET_API_KEY;

// Per Roobet's official "Affiliate Stats API" OpenAPI spec:
//   Base URL: https://roobetconnect.com
//   GET /affiliate/v2/stats?userId=...&startDate=...&endDate=...
const ROOBET_ENDPOINT = 'https://roobetconnect.com/affiliate/v2/stats';
// Our Roobet affiliate account's userId (identifies OUR affiliate account,
// not an individual customer) — same one used by app/api/roobet/affiliates.
const ROOBET_AFFILIATE_USER_ID = '51b44ea5-f07c-41c8-9daf-9a35718b459e';

// ===============================
// ⚡ UTILITY FUNCTIONS (MUST BE FIRST)
// ===============================
function toISODateUTC(d) {
  return d.toISOString().slice(0, 10);
}

function isISODate(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function daysBetweenInclusive(startISO, endISO) {
  const s = new Date(`${startISO}T00:00:00Z`).getTime();
  const e = new Date(`${endISO}T00:00:00Z`).getTime();
  return Math.floor((e - s) / 86400000) + 1;
}

function shiftRangeBack(startISO, endISO) {
  const len = daysBetweenInclusive(startISO, endISO);
  const s = new Date(`${startISO}T00:00:00Z`);
  const e = new Date(`${endISO}T00:00:00Z`);
  s.setUTCDate(s.getUTCDate() - len);
  e.setUTCDate(e.getUTCDate() - len);
  return { start_at: toISODateUTC(s), end_at: toISODateUTC(e) };
}

// ✅ LEADERBOARD TIMING: 7/30/2026 → 8/31/2026 (starts 3pm EST)
const DEFAULT_START = "2026-07-30";
const DEFAULT_END = "2026-08-31";

// ===============================
// ⚡ SPEED / SAFETY KNOBS
// ===============================
const DEFAULT_MAX_DAYS = 180;
const CACHE_TTL_MS = 5 * 60 * 1000;
const ENABLE_EDGE_CACHE_HEADERS = true;

// ------------------------------
// Simple in-memory cache
// ------------------------------
let CACHE = {
  key: "",
  ts: 0,
  payload: null,
  inflight: null,
};

function normalizeEntries(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    for (const key of ['data', 'affiliates', 'results', 'leaderboard', 'entries']) {
      if (Array.isArray(raw[key])) return raw[key];
    }
  }
  return [];
}

async function fetchRoobetWindow(startISO, endISO) {
  const upstream = new URL(ROOBET_ENDPOINT);
  upstream.searchParams.set("userId", ROOBET_AFFILIATE_USER_ID);
  upstream.searchParams.set("startDate", `${startISO}T00:00:00.000Z`);
  upstream.searchParams.set("endDate", `${endISO}T23:59:59.999Z`);

  try {
    console.log(`[v0] fetchRoobetWindow ${startISO}..${endISO}: calling ${upstream.toString()}`);
    const r = await fetch(upstream.toString(), {
      headers: {
        Authorization: `Bearer ${ROOBET_API_KEY}`,
        Accept: 'application/json',
      },
      agent: proxyAgent,
    });
    console.log(`[v0] fetchRoobetWindow ${startISO}..${endISO}: status ${r.status}`);
    if (!r.ok) {
      const text = await r.text().catch(() => 'no body');
      console.log(`[v0] fetchRoobetWindow ${startISO}..${endISO}: not ok (${r.status}), body: ${text.slice(0, 200)}`);
      return [];
    }
    const j = await r.json().catch((err) => {
      console.log(`[v0] fetchRoobetWindow ${startISO}..${endISO}: json parse error:`, err);
      return null;
    });
    const result = normalizeEntries(j);
    console.log(`[v0] fetchRoobetWindow ${startISO}..${endISO}: returning ${result.length} rows`);
    return result;
  } catch (err) {
    console.log(`[v0] fetchRoobetWindow ${startISO}..${endISO}: error:`, err.message, err.stack);
    return [];
  }
}

function makeCacheKey({ start_at, end_at, prev }) {
  return `${start_at}|${end_at}|${prev ? "1" : "0"}`;
}

function getEntryWagered(e) {
  const weighted = Number(e.weightedWagered);
  if (Number.isFinite(weighted)) return weighted;
  return Number(e.wagered ?? e.wagerAmount ?? e.totalWagered ?? 0) || 0;
}

async function computeLeaderboard({ start_at, end_at }) {
  console.log(`[v0] computeLeaderboard: start=${start_at} end=${end_at}`);

  const rows = await fetchRoobetWindow(start_at, end_at);
  console.log(`[v0] computeLeaderboard: got ${rows.length} rows from Roobet`);

  const data = rows
    .filter((r) => (r?.username ?? r?.name ?? r?.userId ?? r?.id) != null)
    .map((r) => {
      // Roobet returns dollars — convert to penny-equivalent units to match
      // the legacy contract every consumer of this route expects.
      const wageredDollars = getEntryWagered(r);
      return {
        userId: r.userId ?? r.id ?? null,
        name: r.username ?? r.name ?? null,
        avatar: r.rankLevelImage ?? r.avatar ?? null,
        badge: r.badge ?? null,
        role: r.role ?? null,
        active: Boolean(r.active ?? wageredDollars > 0),
        isPrivate: Boolean(r.isPrivate),
        premiumUntil: r.premiumUntil ?? null,
        wagered: Math.round(wageredDollars * 100),
        deposited: Math.round((Number(r.deposited) || 0) * 100),
        earned: Math.round((Number(r.earned) || 0) * 100),
        xp: Number(r.xp ?? 0),
        firstSeen: start_at,
        lastSeen: end_at,
      };
    })
    .filter((r) => r.name);

  data.sort((a, b) => (b.wagered || 0) - (a.wagered || 0));
  console.log(`[v0] computeLeaderboard: returning ${data.length} users`);

  return {
    ok: true,
    range: { start_at, end_at },
    count: data.length,
    data,
  };
}

export async function GET(req) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (ENABLE_EDGE_CACHE_HEADERS) {
    headers["Cache-Control"] = "public, s-maxage=60, stale-while-revalidate=300";
  } else {
    headers["Cache-Control"] = "no-store";
  }

  try {
    if (!ROOBET_API_KEY) {
      return Response.json(
        {
          error: "missing_token",
          detail: "Set ROOBET_API_KEY in Vercel env vars.",
        },
        { status: 500, headers }
      );
    }

    const { searchParams } = new URL(req.url);
    const prev = searchParams.get("prev");
    const fresh = searchParams.get("fresh");
    const qsStart = searchParams.get("start_at");
    const qsEnd = searchParams.get("end_at");

    const todayISO = toISODateUTC(new Date());

    let start_at = isISODate(qsStart) ? qsStart : DEFAULT_START;

    // Cap end_at to today
    let end_at;
    if (isISODate(qsEnd)) end_at = qsEnd < todayISO ? qsEnd : todayISO;
    else if (isISODate(DEFAULT_END) && DEFAULT_END !== "") end_at = DEFAULT_END < todayISO ? DEFAULT_END : todayISO;
    else end_at = todayISO;

    console.log(`[v0] leaderboard GET: start=${start_at} end=${end_at} today=${todayISO}`);

    if (!isISODate(start_at) || !isISODate(end_at)) {
      return Response.json(
        {
          error: "bad_dates",
          detail: "Use YYYY-MM-DD for start_at and end_at.",
        },
        { status: 400, headers }
      );
    }

    if (new Date(`${start_at}T00:00:00Z`) > new Date(`${end_at}T00:00:00Z`)) {
      const tmp = start_at;
      start_at = end_at;
      end_at = tmp;
    }

    if (prev) {
      const shifted = shiftRangeBack(start_at, end_at);
      start_at = shifted.start_at;
      end_at = shifted.end_at;
    }

    const totalDays = daysBetweenInclusive(start_at, end_at);
    if (totalDays > DEFAULT_MAX_DAYS) {
      return Response.json(
        {
          error: "range_too_large",
          detail: `Date range is ${totalDays} days (cap ${DEFAULT_MAX_DAYS}). Shorten the window or raise DEFAULT_MAX_DAYS.`,
        },
        { status: 400, headers }
      );
    }

    const key = makeCacheKey({ start_at, end_at, prev });

    const cacheFresh = CACHE.payload && CACHE.key === key && (Date.now() - CACHE.ts) < CACHE_TTL_MS;
    const forceFresh = fresh && fresh !== "0";

    if (!forceFresh && cacheFresh) {
      return Response.json(CACHE.payload, { headers });
    }

    if (!forceFresh && CACHE.inflight && CACHE.key === key) {
      const payload = await CACHE.inflight;
      return Response.json(payload, { headers });
    }

    CACHE.key = key;
    CACHE.inflight = (async () => {
      const payload = await computeLeaderboard({ start_at, end_at });
      CACHE.payload = payload;
      CACHE.ts = Date.now();
      CACHE.inflight = null;
      return payload;
    })();

    const payload = await CACHE.inflight;
    return Response.json(payload, { headers });
  } catch (e) {
    console.log("[v0] leaderboard GET error:", e.message, e.stack);
    CACHE.inflight = null;
    return Response.json(
      { error: "leaderboard_failed", detail: String(e) },
      { status: 500, headers: { ...headers, "Cache-Control": "no-store" } }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
