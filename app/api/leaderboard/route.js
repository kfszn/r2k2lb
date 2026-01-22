// api/leaderboard.js — Vercel Serverless Function (Acebet) + FAST CACHE
// Builds leaderboard totals by day: total = (max - min) per user across date range.
// Supports:
//   - ?start_at=YYYY-MM-DD&end_at=YYYY-MM-DD
//   - ?prev=1  (previous window same length)
//   - ?fresh=1 (force recompute; bypass cache)
// Adds CORS and returns JSON sorted by wagered desc.

// ===============================
// 🔥 DROP YOUR TOKEN HERE
// ===============================
const HARDCODED_ACEBET_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoicGFzcyIsInNjb3BlIjoiYWZmaWxpYXRlcyIsInVzZXJJZCI6MzU3Mjc3LCJpYXQiOjE3NjY5NTc5MTEsImV4cCI6MTkyNDc0NTkxMX0.s8OUGHAUUSUmpsZJy5NlPjMJvnVqaYixB1J94PZGB7A";

// ===============================
// ✅ EDIT DEFAULT DATES HERE
// ===============================
const DEFAULT_START = "2025-12-26";
const DEFAULT_END = "2026-01-25"; // set "" to use today UTC

// ===============================
// ⚡ SPEED / SAFETY KNOBS
// ===============================
// Reduce delay to speed up first computation. If Acebet rate-limits you, raise it.
const DEFAULT_DELAY_MS = 0;

// Safety cap (days)
const DEFAULT_MAX_DAYS = 180;

// Cache TTL (ms). 5 minutes for faster responses
const CACHE_TTL_MS = 5 * 60 * 1000;

// OPTIONAL: If you want the response cacheable by CDNs too
// (still safe because you are not returning private token, only aggregated results)
const ENABLE_EDGE_CACHE_HEADERS = true;

// ------------------------------
// Simple in-memory cache (persists while the lambda stays warm)
// ------------------------------
let CACHE = {
  key: "",
  ts: 0,
  payload: null,
  inflight: null, // Promise to de-dupe concurrent requests
};

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

async function fetchDayAcebet(dayISO, token) {
  const url = `https://api.acebet.com/affiliates/detailed-summary/v2/${dayISO}`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!r.ok) return [];
  const j = await r.json().catch(() => null);
  return Array.isArray(j) ? j : [];
}

function makeCacheKey({ start_at, end_at, prev }) {
  return `${start_at}|${end_at}|${prev ? "1" : "0"}`;
}

async function computeLeaderboard({ start_at, end_at, token }) {
  const totalDays = daysBetweenInclusive(start_at, end_at);

  const users = new Map();

  for (const day of dateRangeUTC(start_at, end_at)) {
    const rows = await fetchDayAcebet(day, token);

    for (const r of rows) {
      const userId = r?.userId;
      if (userId == null) continue;

      const wagered = Number(r?.wagered ?? 0);
      const deposited = Number(r?.deposited ?? 0);
      const earned = Number(r?.earned ?? 0);
      const xp = Number(r?.xp ?? 0);

      const u = users.get(userId) || {
        userId,
        role: r?.role ?? null,
        name: r?.name ?? null,
        avatar: r?.avatar ?? null,
        badge: r?.badge ?? null,
        isPrivate: Boolean(r?.isPrivate),
        premiumUntil: r?.premiumUntil ?? null,
        active: Boolean(r?.active),

        firstSeen: day,
        lastSeen: day,
        min: { wagered, deposited, earned, xp },
        max: { wagered, deposited, earned, xp },
      };

      u.lastSeen = day;

      u.min.wagered = Math.min(u.min.wagered, wagered);
      u.min.deposited = Math.min(u.min.deposited, deposited);
      u.min.earned = Math.min(u.min.earned, earned);
      u.min.xp = Math.min(u.min.xp, xp);

      u.max.wagered = Math.max(u.max.wagered, wagered);
      u.max.deposited = Math.max(u.max.deposited, deposited);
      u.max.earned = Math.max(u.max.earned, earned);
      u.max.xp = Math.max(u.max.xp, xp);

      // keep latest metadata
      u.role = r?.role ?? u.role;
      u.name = r?.name ?? u.name;
      u.avatar = r?.avatar ?? u.avatar;
      u.badge = r?.badge ?? u.badge;
      u.isPrivate = Boolean(r?.isPrivate);
      u.premiumUntil = r?.premiumUntil ?? u.premiumUntil;
      u.active = Boolean(r?.active);

      users.set(userId, u);
    }

    if (DEFAULT_DELAY_MS > 0) await sleep(DEFAULT_DELAY_MS);
  }

  const data = [...users.values()].map((u) => ({
    userId: u.userId,
    name: u.name,
    avatar: u.avatar,
    badge: u.badge,
    role: u.role,
    active: u.active,
    isPrivate: u.isPrivate,
    premiumUntil: u.premiumUntil,

    wagered: (u.max.wagered - u.min.wagered) || 0,
    deposited: (u.max.deposited - u.min.deposited) || 0,
    earned: (u.max.earned - u.min.earned) || 0,
    xp: (u.max.xp - u.min.xp) || 0,

    firstSeen: u.firstSeen,
    lastSeen: u.lastSeen,
  }));

  data.sort((a, b) => (b.wagered || 0) - (a.wagered || 0));

  return {
    ok: true,
    range: { start_at, end_at, days: totalDays },
    count: data.length,
    data,
  };
}

export async function GET(req) {
  // CORS headers
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

    let start_at = isISODate(qsStart) ? qsStart : DEFAULT_START;

    let end_at;
    if (isISODate(qsEnd)) end_at = qsEnd;
    else if (isISODate(DEFAULT_END) && DEFAULT_END !== "") end_at = DEFAULT_END;
    else end_at = toISODateUTC(new Date());

    if (!isISODate(start_at) || !isISODate(end_at)) {
      return Response.json(
        {
          error: "bad_dates",
          detail: "Use YYYY-MM-DD for start_at and end_at (or set DEFAULT_END to a valid date / empty string).",
        },
        { status: 400, headers }
      );
    }

    // Ensure start <= end
    if (new Date(`${start_at}T00:00:00Z`) > new Date(`${end_at}T00:00:00Z`)) {
      const tmp = start_at;
      start_at = end_at;
      end_at = tmp;
    }

    // prev window (same length)
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

    // Serve from cache if fresh and not forced
    const cacheFresh = CACHE.payload && CACHE.key === key && (Date.now() - CACHE.ts) < CACHE_TTL_MS;
    const forceFresh = fresh && fresh !== "0";

    if (!forceFresh && cacheFresh) {
      return Response.json(CACHE.payload, { headers });
    }

    // De-dupe concurrent requests
    if (!forceFresh && CACHE.inflight && CACHE.key === key) {
      const payload = await CACHE.inflight;
      return Response.json(payload, { headers });
    }

    // Compute and cache
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
