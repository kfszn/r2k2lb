// api/leaderboard.js — Vercel Serverless Function (Acebet) + FAST CACHE
// Builds leaderboard using cumulative totals from the Acebet detailed-summary API.
// Supports:
//   - ?start_at=YYYY-MM-DD&end_at=YYYY-MM-DD
//   - ?prev=1  (previous window same length)
//   - ?fresh=1 (force recompute; bypass cache)
// Adds CORS and returns JSON sorted by wagered desc.
// Cycle: 2026-04-27 → 2026-05-27 | Prize pool: $20,000

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

// ✅ LEADERBOARD TIMING: 4/27/2026 → 5/27/2026 (30 days, starts 11am EST)
const DEFAULT_START = "2026-04-27";
const DEFAULT_END = "2026-05-27";

function updateDefaultDates() {
  // No-op: dates are hardcoded for this leaderboard cycle
}

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

async function fetchDayAcebet(dayISO, token) {
  const url = `https://api.acebet.co/affiliates/detailed-summary/v2/${dayISO}`;
  try {
    console.log(`[v0] fetchDayAcebet ${dayISO}: calling ${url} with proxy=${proxyAgent ? 'yes' : 'no'}`);
    const r = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://acebet.co/',
      },
      agent: proxyAgent,
    });
    console.log(`[v0] fetchDayAcebet ${dayISO}: status ${r.status}`);
    if (!r.ok) {
      const text = await r.text().catch(() => 'no body');
      console.log(`[v0] fetchDayAcebet ${dayISO}: not ok (${r.status}), body: ${text.slice(0, 200)}`);
      return [];
    }
    const j = await r.json().catch((err) => {
      console.log(`[v0] fetchDayAcebet ${dayISO}: json parse error:`, err);
      return null;
    });
    console.log(`[v0] fetchDayAcebet ${dayISO}: raw response:`, JSON.stringify(j).slice(0, 500));
    
    // Handle different response structures
    let result = [];
    if (Array.isArray(j)) {
      result = j;
    } else if (j && typeof j === 'object' && Array.isArray(j.data)) {
      result = j.data;
    } else if (j && typeof j === 'object' && Array.isArray(j.records)) {
      result = j.records;
    } else if (j && typeof j === 'object' && Array.isArray(j.results)) {
      result = j.results;
    }
    
    console.log(`[v0] fetchDayAcebet ${dayISO}: returning ${result.length} rows`);
    return result;
  } catch (err) {
    console.log(`[v0] fetchDayAcebet ${dayISO}: error:`, err.message, err.stack);
    return [];
  }
}

function makeCacheKey({ start_at, end_at, prev }) {
  return `${start_at}|${end_at}|${prev ? "1" : "0"}`;
}

async function computeLeaderboard({ start_at, end_at, token }) {
  // The Acebet API /affiliates/detailed-summary/v2/:date returns cumulative totals
  // from that date onwards to present. To get stats for a WINDOW (start_at to end_at),
  // we need to fetch the cumulative at start_at and subtract the cumulative at end_at+1.
  // For the CURRENT cycle (end_at is today or future), we just use start_at totals directly.
  
  const todayISO = toISODateUTC(new Date());
  const isCurrentCycle = end_at >= todayISO;
  
  console.log(`[v0] computeLeaderboard: start=${start_at} end=${end_at} isCurrentCycle=${isCurrentCycle}`);

  // Fetch cumulative totals at start_at
  const startRows = await fetchDayAcebet(start_at, token);
  console.log(`[v0] computeLeaderboard: got ${startRows.length} rows from start_at API`);

  if (isCurrentCycle) {
    // For current/ongoing cycle, start_at totals are the window totals
    const data = startRows
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
        firstSeen: start_at,
        lastSeen: start_at,
      }));

    data.sort((a, b) => (b.wagered || 0) - (a.wagered || 0));
    console.log(`[v0] computeLeaderboard: returning ${data.length} users (current cycle)`);

    return {
      ok: true,
      range: { start_at, end_at },
      count: data.length,
      data,
    };
  }

  // For HISTORICAL cycles, we need to subtract: window_total = cumulative_at_start - cumulative_at_end+1
  // The day AFTER end_at gives us what was accumulated AFTER the window closed
  const dayAfterEnd = new Date(`${end_at}T00:00:00Z`);
  dayAfterEnd.setUTCDate(dayAfterEnd.getUTCDate() + 1);
  const dayAfterEndISO = toISODateUTC(dayAfterEnd);
  
  console.log(`[v0] computeLeaderboard: fetching end boundary at ${dayAfterEndISO}`);
  const endRows = await fetchDayAcebet(dayAfterEndISO, token);
  console.log(`[v0] computeLeaderboard: got ${endRows.length} rows from end boundary API`);

  // Build lookup map for end totals
  const endMap = new Map();
  for (const r of endRows) {
    if (r?.userId != null) {
      endMap.set(r.userId, {
        wagered: Number(r.wagered ?? 0),
        deposited: Number(r.deposited ?? 0),
        earned: Number(r.earned ?? 0),
      });
    }
  }

  // Compute window totals by subtraction
  const data = startRows
    .filter((r) => r?.userId != null)
    .map((r) => {
      const endTotals = endMap.get(r.userId) || { wagered: 0, deposited: 0, earned: 0 };
      return {
        userId: r.userId,
        name: r.name ?? null,
        avatar: r.avatar ?? null,
        badge: r.badge ?? null,
        role: r.role ?? null,
        active: Boolean(r.active),
        isPrivate: Boolean(r.isPrivate),
        premiumUntil: r.premiumUntil ?? null,
        wagered: Math.max(0, Number(r.wagered ?? 0) - endTotals.wagered),
        deposited: Math.max(0, Number(r.deposited ?? 0) - endTotals.deposited),
        earned: Math.max(0, Number(r.earned ?? 0) - endTotals.earned),
        xp: Number(r.xp ?? 0),
        firstSeen: start_at,
        lastSeen: end_at,
      };
    })
    .filter((r) => r.wagered > 0); // Only include users who wagered in this window

  data.sort((a, b) => (b.wagered || 0) - (a.wagered || 0));
  console.log(`[v0] computeLeaderboard: returning ${data.length} users (historical window)`);

  return {
    ok: true,
    range: { start_at, end_at },
    count: data.length,
    data,
  };
}

export async function GET(req) {
  // Update dynamic dates at request time
  updateDefaultDates();
  
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

    // Always cap end_at to today — future dates return no data from Acebet API
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
      const payload = await computeLeaderboard({ start_at, end_at, token });
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
