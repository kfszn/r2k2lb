// index.js — Express server exposing /leaderboard (18th → 18th UTC)

import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// Use env if set; otherwise fall back to the key you provided
const RAINBET_KEY = process.env.RAINBET_KEY || "OjwJ62YWj7gveE0OkmkrCvRM4U3Omh16";

// 18th → 18th monthly window (UTC)
function getCycleDates() {
  const now = new Date();
  let end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 18, 23, 59, 59, 999));
  if (now > end) end.setUTCMonth(end.getUTCMonth() + 1, 18);
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 1, 18, 0, 0, 0, 0));
  const fmt = d => d.toISOString().slice(0, 10);
  return { startISO: fmt(start), endISO: fmt(end) };
}

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Tiny cache (1 min)
let cache = null;
let cacheTs = 0;
const CACHE_MS = 60 * 1000;

// GET /leaderboard?start_at=YYYY-MM-DD&end_at=YYYY-MM-DD  (optional)
app.get("/leaderboard", async (req, res) => {
  try {
    const { start_at, end_at } = req.query;
    const { startISO, endISO } = (start_at && end_at)
      ? { startISO: start_at, endISO: end_at }
      : getCycleDates();

    if (!start_at && !end_at && cache && Date.now() - cacheTs < CACHE_MS) {
      return res.json(cache);
    }

    if (!RAINBET_KEY) {
      return res.status(500).json({ error: "RAINBET_KEY not set" });
    }

    const url = `https://services.rainbet.com/v1/external/affiliates?start_at=${startISO}&end_at=${endISO}&key=${encodeURIComponent(RAINBET_KEY)}`;

    const upstream = await fetch(url, { cache: "no-store" });
    const text = await upstream.text();
    if (!upstream.ok) {
      return res.status(upstream.status).type("application/json").send(text);
    }

    const data = JSON.parse(text);
    if (!start_at && !end_at) { cache = data; cacheTs = Date.now(); }

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60");
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "Proxy failed", detail: String(e) });
  }
});

app.get("/health", (_, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server running on :${PORT}`);
});