import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;
const SELF_URL = "https://r2k2data.onrender.com/leaderboard/top14";
const API_KEY = "9emj7LErCZydUlTRZpHCuiWdn64atsNF";

let cachedData = [];

// ✅ CORS headers manually
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

function maskUsername(username) {
  if (username.length <= 4) return username;
  return username.slice(0, 2) + "***" + username.slice(-2);
}

function getDynamicApiUrl() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0-indexed

  // If today is before the 23rd, use 23rd of previous month to 22nd of this one
  const start = new Date(Date.UTC(year, month - (now.getUTCDate() < 23 ? 1 : 0), 23));
  const end = new Date(Date.UTC(year, month + (now.getUTCDate() < 23 ? 0 : 1), 22));

  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  return `https://services.rainbet.com/v1/external/affiliates?start_at=${startStr}&end_at=${endStr}&key=${API_KEY}`;
}


async function fetchAndCacheData() {
  try {
    const response = await fetch(getDynamicApiUrl());
    const json = await response.json();
    if (!json.affiliates) throw new Error("No data");

    const sorted = json.affiliates.sort(
      (a, b) => parseFloat(b.wagered_amount) - parseFloat(a.wagered_amount)
    );

    const top10 = sorted.slice(0, 10);
    if (top10.length >= 2) [top10[0], top10[1]] = [top10[1], top10[0]];

    cachedData = top10.map(entry => ({
      username: maskUsername(entry.username),
      wagered: Math.round(parseFloat(entry.wagered_amount)),
      weightedWager: Math.round(parseFloat(entry.wagered_amount)),
    }));

    console.log(`[✅] Leaderboard updated`);
  } catch (err) {
    console.error("[❌] Failed to fetch Rainbet data:", err.message);
  }
}

fetchAndCacheData();
setInterval(fetchAndCacheData, 5 * 60 * 1000); // every 5 minutes

app.get("/leaderboard/top14", (req, res) => {
  res.json(cachedData);
});
app.get("/leaderboard/prev", async (req, res) => {
  try {
    const now = new Date();
    const currentStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (now.getUTCDate() < 23 ? 1 : 0), 23));
    
    const prevStart = new Date(currentStart);
    prevStart.setUTCMonth(prevStart.getUTCMonth() - 1);
    const prevEnd = new Date(currentStart);
    prevEnd.setUTCDate(22);
    prevEnd.setUTCMonth(prevEnd.getUTCMonth() - 0);

    const startStr = prevStart.toISOString().slice(0, 10);
    const endStr = prevEnd.toISOString().slice(0, 10);

    const url = `https://services.rainbet.com/v1/external/affiliates?start_at=${startStr}&end_at=${endStr}&key=${API_KEY}`;
    const response = await fetch(url);
    const json = await response.json();

    if (!json.affiliates) throw new Error("No previous data");

    const sorted = json.affiliates.sort(
      (a, b) => parseFloat(b.wagered_amount) - parseFloat(a.wagered_amount)
    );

    const top10 = sorted.slice(0, 10);
    if (top10.length >= 2) [top10[0], top10[1]] = [top10[1], top10[0]];

    const processed = top10.map(entry => ({
      username: maskUsername(entry.username),
      wagered: Math.round(parseFloat(entry.wagered_amount)),
      weightedWager: Math.round(parseFloat(entry.wagered_amount)),
    }));

    res.json(processed);
  } catch (err) {
    console.error("[❌] Failed to fetch previous leaderboard:", err.message);
    res.status(500).json({ error: "Failed to fetch previous leaderboard data." });
  }
});



setInterval(() => {
  fetch(SELF_URL)
    .then(() => console.log(`[🔁] Self-pinged ${SELF_URL}`))
    .catch(err => console.error("[⚠️] Self-ping failed:", err.message));
}, 270000); // every 4.5 mins

app.listen(PORT, () => console.log(`🚀 Running on port ${PORT}`));
