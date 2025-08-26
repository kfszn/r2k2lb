// api/leaderboard.js — Vercel Serverless Function
// Proxies Rainbet → adds CORS → supports 18→18 cycles + ?prev=1 + explicit dates.

function fmt(d) { return d.toISOString().slice(0, 10); }

// Current cycle: 18th 00:00:00 UTC → next 18th 23:59:59.999 UTC
function getCurrentCycle18to18() {
  const now = new Date();
  let end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 18, 23, 59, 59, 999));
  if (now > end) end.setUTCMonth(end.getUTCMonth() + 1, 18);
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 1, 18, 0, 0, 0, 0));
  return { start_at: fmt(start), end_at: fmt(end) };
}

// Previous 18→18 cycle
function getPreviousCycle18to18() {
  const { start_at: curStartISO } = getCurrentCycle18to18();
  const curStart = new Date(curStartISO + "T00:00:00Z");
  const prevEnd = new Date(Date.UTC(curStart.getUTCFullYear(), curStart.getUTCMonth(), 18, 23, 59, 59, 999));
  const prevStart = new Date(Date.UTC(prevEnd.getUTCFullYear(), prevEnd.getUTCMonth() - 1, 18, 0, 0, 0, 0));
  return { start_at: fmt(prevStart), end_at: fmt(prevEnd) };
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
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const prev = urlObj.searchParams.get("prev");
    const start_at = urlObj.searchParams.get("start_at");
    const end_at = urlObj.searchParams.get("end_at");

    let dates;
    if (start_at && end_at) {
      dates = { start_at, end_at };
    } else if (prev) {
      dates = getPreviousCycle18to18();
    } else {
      dates = getCurrentCycle18to18();
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
