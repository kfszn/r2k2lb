// api/leaderboard.js — Vercel Serverless Function (Acebet) + FAST CACHE
// Builds leaderboard by aggregating day-by-day data from the Acebet detailed-summary API.
// Supports:
//   - ?start_at=YYYY-MM-DD&end_at=YYYY-MM-DD
//   - ?prev=1  (previous window same length)
//   - ?fresh=1 (force recompute; bypass cache)
// Adds CORS and returns JSON sorted by wagered desc.
// Cycle: 2026-06-29 → 2026-07-30 | Prize pool: $20,000

// ===============================
// 🔥 PROXY + FETCH SETUP FOR CLOUDFLARE BYPASS
// ===============================
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

const proxyAgent = process.env.PROXY_URL ? new HttpsProxyAgent(process.env.PROXY_URL) : undefined;
const HARDCODED_ACEBET_TOKEN = process.env.ACEBET_API_TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoicGFzcyIsInNjb3BlIjoiYWZmaWxpYXRlcyIsInVzZXJJZCI6MzU3Mjc3LCJpYXQiOjE3NjY5NTc5MTEsImV4cCI6MTkyNDc0NTkxMX0.s8OUGHAUUSUmpsZJy5NlPjMJvnVqaYixB1J94PZGB7A";

// ===============================
// ⚡ UTILITY FUNCTIONS (MUST BE FIRST)
// ===============================
function toISODateUTC(d) {
  return d.toISOString().slice(0, 10);
}

function isISODate(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function* dateRangeUTC(startISO, endISO) {
  const start = new Date(`${startISO}T00:00:00Z`);
  const end = new Date(`${endISO}T00:00:00Z`);
  for (let d = start; d <= end; d = new Date(d.getTime() + 86400000)) {
    yield toISODateUTC(d);
  }
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

// ✅ LEADERBOARD TIMING: 6/29/2026 → 7/30/2026 (31 days, starts 3pm EST)
const DEFAULT_START = "2026-06-29";
const DEFAULT_END = "2026-07-30";

// ===============================
// ⚡ SPEED / SAFETY KNOBS
// ===============================
const DEFAULT_DELAY_MS = 0;
const DEFAULT_MAX_DAYS = 180;
const CACHE_TTL_MS = 5 * 60 * 1000;
const ENABLE_EDGE_CACHE_HEADERS = true;

// Cloudflare bypass headers — required or Acebet returns 403
const CF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Referer": "https://acebet.co/",
};

// ------------------------------
// Simple in-memory cache
// ------------------------------
let CACHE = {
  key: "",
  ts: 0,
  payload: null,
  inflight: null,
};

// The AceBet detailed-summary API is cumulative from a start date —
// one call with start_at returns all wager data from that date to now.
async function fetchAcebetSince(start_at, token) {
  const url = `https://api.acebet.co/affiliates/detailed-summary/v2/${start_at}`;
  try {
    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...CF_HEADERS,
      },
      agent: proxyAgent,
    });
    if (!r.ok) return [];
    const j = await r.json().catch(() => null);
    if (!j) return [];
    if (Array.isArray(j)) return j;
    if (Array.isArray(j?.data)) return j.data;
    if (Array.isArray(j?.records)) return j.records;
    if (Array.isArray(j?.results)) return j.results;
    return [];
  } catch {
    return [];
  }
}

function makeCacheKey({ start_at, end_at, prev }) {
  return `${start_at}|${end_at}|${prev ? "1" : "0"}`;
}

async function computeLeaderboard({ start_at, end_at, token }) {
  // Single API call — AceBet returns cumulative data from start_at to present
  const rows = await fetchAcebetSince(start_at, token);

  const data = rows
    .filter((r) => r?.userId != null)
    .map((r) => ({
      userId: r.userId,
      name: r.name ?? null,
      avatar: r.avatar ?? null,
      badge: r.badge ?? null,
      role: r.role ?? null,
      active: Boolean(r.active),
      isPrivate: Boolean(r.isPrivate),
      premiumUntil: r.premiumUntil ?? null,
      wagered: Number(r.wagered ?? 0),
      deposited: Number(r.deposited ?? 0),
      earned: Number(r.earned ?? 0),
      xp: Number(r.xp ?? 0),
    }))
    .sort((a, b) => (b.wagered || 0) - (a.wagered || 0));

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
    const token = process.env.ACEBET_API_TOKEN || HARDCODED_ACEBET_TOKEN;
    if (!token) {
      return Response.json(
        {
          error: "missing_token",
          detail: "Paste token into HARDCODED_ACEBET_TOKEN (top of file) or set ACEBET_API_TOKEN in Vercel env vars.",
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

    // Use the cycle end date as-is — AceBet's API is cumulative from start_at
    let end_at;
    if (isISODate(qsEnd)) end_at = qsEnd;
    else if (isISODate(DEFAULT_END) && DEFAULT_END !== "") end_at = DEFAULT_END;
    else end_at = todayISO;

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
      const payload = await computeLeaderboard({
        start_at,
        end_at,
        token,
      });
      CACHE.payload = payload;
      CACHE.ts = Date.now();
      CACHE.inflight = null;
      return payload;
    })();

    const payload = await CACHE.inflight;
    return Response.json(payload, { headers });
  } catch (e) {
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
