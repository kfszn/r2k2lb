

// ===============================
// 🔥 DROP YOUR TOKEN HERE
// ===============================
const HARDCODED_ACEBET_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoicGFzcyIsInNjb3BlIjoiYWZmaWxpYXRlcyIsInVzZXJJZCI6MzU3Mjc3LCJpYXQiOjE3NjY5NTc5MTEsImV4cCI6MTkyNDc0NTkxMX0.s8OUGHAUUSUmpsZJy5NlPjMJvnVqaYixB1J94PZGB7A"; // paste JWT (no "Bearer ")

// ===============================
// ✅ EDIT DEFAULT DATES HERE
// ===============================
const DEFAULT_START = "2025-12-26";
const DEFAULT_END   = "2026-01-20"; // <-- change this with DEFAULT_START (or set to "" to use today UTC)

// Other knobs
const DEFAULT_DELAY_MS = 120;
const DEFAULT_MAX_DAYS = 180;

function toISODateUTC(d) { return d.toISOString().slice(0, 10); }
function isISODate(s) { return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

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
  const j = await r.json();
  return Array.isArray(j) ? j : [];
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const token = process.env.ACEBET_TOKEN || HARDCODED_ACEBET_TOKEN;
    if (!token || token === "PASTE_YOUR_BEARER_TOKEN_HERE") {
      return res.status(500).json({
        error: "missing_token",
        detail: "Paste token into HARDCODED_ACEBET_TOKEN (top of file) or set ACEBET_TOKEN in Vercel env vars.",
      });
    }

    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const prev = urlObj.searchParams.get("prev");
    const qsStart = urlObj.searchParams.get("start_at");
    const qsEnd = urlObj.searchParams.get("end_at");

    // ✅ Use querystring if provided; otherwise use DEFAULT_START/DEFAULT_END
    let start_at = isISODate(qsStart) ? qsStart : DEFAULT_START;

    let end_at;
    if (isISODate(qsEnd)) {
      end_at = qsEnd;
    } else if (isISODate(DEFAULT_END) && DEFAULT_END !== "") {
      end_at = DEFAULT_END;
    } else {
      end_at = toISODateUTC(new Date()); // fallback = today UTC
    }

    if (!isISODate(start_at) || !isISODate(end_at)) {
      return res.status(400).json({
        error: "bad_dates",
        detail: "Use YYYY-MM-DD for start_at and end_at (or set DEFAULT_END to a valid date / empty string).",
      });
    }

    // Ensure start <= end
    if (new Date(`${start_at}T00:00:00Z`) > new Date(`${end_at}T00:00:00Z`)) {
      const tmp = start_at; start_at = end_at; end_at = tmp;
    }

    // prev window (same length)
    if (prev) {
      const shifted = shiftRangeBack(start_at, end_at);
      start_at = shifted.start_at;
      end_at = shifted.end_at;
    }

    const totalDays = daysBetweenInclusive(start_at, end_at);
    if (totalDays > DEFAULT_MAX_DAYS) {
      return res.status(400).json({
        error: "range_too_large",
        detail: `Date range is ${totalDays} days (cap ${DEFAULT_MAX_DAYS}). Shorten the window or raise DEFAULT_MAX_DAYS.`,
      });
    }

    // Per-user tracker
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

    const data = [...users.values()].map(u => ({
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

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).send(JSON.stringify({
      ok: true,
      range: { start_at, end_at, days: totalDays },
      count: data.length,
      data
    }, null, 2));
  } catch (e) {
    return res.status(500).json({ error: "leaderboard_failed", detail: String(e) });
  }
}
