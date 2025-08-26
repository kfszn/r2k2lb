import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// set this in Railway → Variables
const RAINBET_KEY = process.env.RAINBET_KEY;

// 18th → 18th monthly window
function getCycleDates() {
  const now = new Date();
  let end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 18, 23, 59, 59, 999));
  if (now > end) end.setUTCMonth(end.getUTCMonth() + 1, 18);
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 1, 18, 0, 0, 0, 0));
  const fmt = d => d.toISOString().slice(0, 10);
  return { startISO: fmt(start), endISO: fmt(end) };
}

// CORS (so your frontend can call this service from anywhere)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// optional tiny cache to reduce Rainbet calls
let cache = null;
let cacheTs = 0;
const CACHE_MS = 60 * 1000;

app.get("/api/leaderboard", async (req, res) => {
  try {
    const start_at = req.query.start_at;
    const end_at = req.query.end_at;
    const dates = (!start_at || !end_at) ? getCycleDates() : { startISO: start_at, endISO: end_at };

    // serve from cache
    if (cache && Date.now() - cacheTs < CACHE_MS && !start_at && !end_at) {
      return res.json(cache);
    }

    if (!RAINBET_KEY) return res.status(500).json({ error: "RAINBET_KEY not set" });

    const url = `https://services.rainbet.com/v1/external/affiliates?start_at=${dates.startISO}&end_at=${dates.endISO}&key=${encodeURIComponent(RAINBET_KEY)}`;

    const upstream = await fetch(url, { cache: "no-store" });
    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      return res.status(upstream.status).json({ error: "Rainbet error", detail: text });
    }
    const data = await upstream.json();

    if (!start_at && !end_at) { cache = data; cacheTs = Date.now(); }
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Proxy failed", detail: String(e) });
  }
});

app.get("/health", (_, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`API on :${PORT}`));