// api/leaderboard.js — Vercel Serverless Function
// Proxies Rainbet → adds CORS → supports 18th @ 8PM ET cycles + ?prev=1 + explicit dates.

/** Format Date (UTC) to YYYY-MM-DD */
function fmt(d) { return d.toISOString().slice(0, 10); }

/** Get 'now' in America/New_York parts without external deps */
function nowInNY() {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: false
  });
  const parts = dtf.formatToParts(new Date());
  const get = t => Number(parts.find(p => p.type === t)?.value);
  return {
    year: get('year'),
    month: get('month'), // 1-12
    day: get('day'),     // 1-31
    hour: get('hour'),   // 0-23
    minute: get('minute') || 0,
    second: get('second') || 0,
  };
}

/** Normalize (y, m) so m is 1..12 and adjust y accordingly */
function normYM(y, m) {
  const mm = ((m - 1) % 12 + 12) % 12; // 0..11
  const yy = y + Math.floor((m - 1) / 12);
  return { y: yy, m0: mm, m1: mm + 1 }; // m0=0-based, m1=1-based
}

/**
 * 8PM ET boundary mapping:
 * - Each cycle starts at local NY time: 18th 20:00 ET.
 * - Since Rainbet takes dates (no times), we map that to UTC date = (local 18th) + 1 day.
 *   This holds for both EDT (UTC-4 → 00:00 next day UTC) and EST (UTC-5 → 01:00 next day UTC).
 */
function getCurrentCycle8pmNY_DateOnly() {
  const n = nowInNY();
  // Is "now" before or after this month's boundary (18th 20:00 ET)?
  const beforeBoundary =
    (n.day < 18) ||
    (n.day === 18 && (n.hour < 20 || (n.hour === 20 && (n.minute === 0 && n.second === 0) && false))); // strictly before 20:00

  // Determine the local (NY) month/year of the START boundary (18th 20:00)
  let startYear = n.year;
  let startMonth1 = n.month; // 1..12
  if (beforeBoundary) {
    // Current cycle actually started on the 18th 8PM of the PREVIOUS month
    startMonth1 -= 1;
    if (startMonth1 === 0) { startMonth1 = 12; startYear -= 1; }
  }

  // END boundary is exactly one month after the START boundary
  let endYear = startYear;
  let endMonth1 = startMonth1 + 1;
  if (endMonth1 === 13) { endMonth1 = 1; endYear += 1; }

  // Map each local boundary day (18th) to the UTC date for the API by adding +1 day
  // start_at = (local start boundary date) + 1 day
  // end_at   = (local end boundary date)   + 1 day
  const { y: sY, m0: sM0 } = normYM(startYear, startMonth1);
  const { y: eY, m0: eM0 } = normYM(endYear,   endMonth1);

  const startUTC = new Date(Date.UTC(sY, sM0, 18 + 1, 0, 0, 0, 0)); // 18th+1 → date string for API
  const endUTC   = new Date(Date.UTC(eY, eM0, 18 + 1, 0, 0, 0, 0)); // next 18th+1

  return { start_at: fmt(startUTC), end_at: fmt(endUTC) };
}

function getPreviousCycle8pmNY_DateOnly() {
  // Previous cycle is just "current" shifted back one month
  const n = nowInNY();

  // Compute the local month/year of the PREVIOUS start boundary
  // Start by getting the current cycle start boundary month/year as above,
  // then minus 1 month.
  const beforeBoundary =
    (n.day < 18) || (n.day === 18 && n.hour < 20);

  let curStartYear = n.year;
  let curStartMonth1 = n.month;
  if (beforeBoundary) {
    curStartMonth1 -= 1;
    if (curStartMonth1 === 0) { curStartMonth1 = 12; curStartYear -= 1; }
  }

  // Previous cycle start = curStart - 1 month
  let prevStartYear = curStartYear;
  let prevStartMonth1 = curStartMonth1 - 1;
  if (prevStartMonth1 === 0) { prevStartMonth1 = 12; prevStartYear -= 1; }

  // Previous cycle end   = curStart (the current cycle's start boundary)
  const { y: psY, m0: psM0 } = normYM(prevStartYear, prevStartMonth1);
  const { y: peY, m0: peM0 } = normYM(curStartYear,  curStartMonth1);

  const prevStartUTC = new Date(Date.UTC(psY, psM0, 18 + 1, 0, 0, 0, 0));
  const prevEndUTC   = new Date(Date.UTC(peY, peM0, 18 + 1, 0, 0, 0, 0));

  return { start_at: fmt(prevStartUTC), end_at: fmt(prevEndUTC) };
}

// Prefer setting this in Vercel → Settings → Environment Variables → RAINBET_KEY
const DEFAULT_KEY = "OjwJ62YWj7gveE0OkmkrCvRM4U3Omh16";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const urlObj  = new URL(req.url, `http://${req.headers.host}`);
    const prev    = urlObj.searchParams.get("prev");
    const startAt = urlObj.searchParams.get("start_at");
    const endAt   = urlObj.searchParams.get("end_at");

    let dates;
    if (startAt && endAt) {
      // Explicit override via query string
      dates = { start_at: startAt, end_at: endAt };
    } else if (prev) {
      dates = getPreviousCycle8pmNY_DateOnly();
    } else {
      dates = getCurrentCycle8pmNY_DateOnly();
    }

    const key = process.env.RAINBET_KEY || DEFAULT_KEY;
    const upstreamUrl =
      `https://services.rainbet.com/v1/external/affiliates` +
      `?start_at=${encodeURIComponent(dates.start_at)}` +
      `&end_at=${encodeURIComponent(dates.end_at)}` +
      `&key=${encodeURIComponent(key)}`;

    const upstream = await fetch(upstreamUrl, { cache: "no-store" });
    const bodyText = await upstream.text();

    res.status(upstream.status);
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json; charset=utf-8");
    return res.send(bodyText);
  } catch (e) {
    return res.status(500).json({ error: "proxy_failed", detail: String(e) });
  }
}