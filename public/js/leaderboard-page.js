// /js/leaderboard-page.js
// Fetches from your Vercel proxy (no CORS), renders Top 10, supports Previous toggle.
// Uses rolling 30-day cycles that start at 8:00 PM America/New_York, anchored at 2025-10-18.

const CURRENT_API_URL  = "/api/leaderboard";        // current rolling 30d @ 8PM ET
const PREVIOUS_API_URL = "/api/leaderboard?prev=1"; // previous rolling 30d

const ANCHOR_DATE = "2026-01-26"; // first 8PM ET reset
const WINDOW_DAYS = 30;

const logoSrc   = "/assets/rainbetlogo.png";
const rewards   = [1000, 600, 400, 300, 250, 150, 120, 90, 60, 30]; // 1st → 10th
const top3Glows = ["0 0 40px #FFD700", "0 0 40px #C0C0C0", "0 0 40px #CD7F32"]; // Gold, Silver, Bronze

/* ===== Countdown (rolling 30d from 8PM ET ANCHOR_DATE) ===== */
(function updateCountdownRolling() {
  const el = document.getElementById("countdown");
  if (!el) return;

  function nyParts(date = new Date()) {
    const f = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", second: "numeric",
      hour12: false
    });
    const parts = f.formatToParts(date);
    const get = t => Number(parts.find(p => p.type === t)?.value);
    return { y: get("year"), m1: get("month"), d: get("day"), hh: get("hour"), mm: get("minute") || 0, ss: get("second") || 0 };
  }

  // Build UTC time corresponding to "y-m1-d at 20:00 ET"
  function boundaryUTC(y, m1, d) {
    // Get what NY "midnight" of that calendar day looks like in UTC:
    const nyMid = nyParts(new Date(`${y}-${String(m1).padStart(2,"0")}-${String(d).padStart(2,"0")}T00:00:00`));
    const baseUTC = Date.UTC(nyMid.y, nyMid.m1 - 1, nyMid.d, 0, 0, 0, 0);
    return new Date(baseUTC + 20 * 3600 * 1000); // +20h → 8PM ET
  }

  const [ay, am1, ad] = ANCHOR_DATE.split("-").map(Number);
  const anchorUTC = boundaryUTC(ay, am1, ad);
  const msWin = WINDOW_DAYS * 86400000;

  const now = new Date();
  let k = Math.floor((now - anchorUTC) / msWin);
  // end of current window (exclusive)
  const nextEndUTC = new Date(anchorUTC.getTime() + (k + 1) * msWin);
  const diff = nextEndUTC - now;

  if (diff <= 0) {
    // Flip to next window: refresh leaderboard + tick again
    loadLeaderboard(CURRENT_API_URL);
    setTimeout(updateCountdownRolling, 1000);
    return;
  }

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  el.textContent = `${d}d ${h}h ${m}m ${s}s`;

  setTimeout(updateCountdownRolling, 1000);
})();

/* ===== Helpers ===== */
const toNum = v => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function showError(msg, detail = "") {
  const rows = document.getElementById("leaderboard-rows");
  if (!rows) return;
  rows.innerHTML = `<div style="color:red; white-space:pre-wrap; margin:12px 0;">${msg}${detail ? `\n${detail}` : ""}</div>`;
}

function currency(n) {
  return `$ ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* Mask usernames: keep first 2 chars + last char, mask the middle with * */
function maskName(name) {
  if (!name) return "Unknown";
  const s = String(name).trim();
  if (s.length <= 3) return s; // too short to meaningfully mask
  const firstTwo = s.slice(0, 2);
  const lastChar = s.slice(-1);
  const middle = "*".repeat(s.length - 3);
  return firstTwo + middle + lastChar;
}

/* ===== Rendering ===== */
function renderLeaderboard(rows) {
  const top3 = document.querySelector(".css-gqrafh");
  const list = document.getElementById("leaderboard-rows");
  if (!top3 || !list) return;

  top3.innerHTML = "";
  list.innerHTML = "";

  rows.forEach((entry, idx) => {
    const place   = idx + 1;
    const user    = entry.username || "Unknown";
    const masked  = maskName(user);
    const wagered = currency(entry.wagered || 0);
    const prize   = idx < rewards.length ? `$ ${rewards[idx]}` : "$ 0";

    if (idx < 3) {
      const card = document.createElement("div");
      card.className = "css-jehefp";
      card.style.boxShadow = top3Glows[idx] || "";
      card.style.position = "relative";
      if (idx === 1) card.style.transform = "translateY(25px) scale(1.2)";
      if (idx === 2) card.style.transform = "translateY(25px)";

      card.innerHTML = `
        <div style="position:absolute;top:8px;left:8px;background:rgba(0,0,0,.45);
                    padding:4px 8px;border-radius:8px;font-weight:700;">#${place}</div>
        <img src="${logoSrc}" style="width:96px;height:auto;border-radius:12px;">
        <div class="css-hca0vm"><span class="css-15a1lq3" style="font-weight:bold;">${masked}</span></div>
        <div class="css-7ahevu ejrykqo0">
          <span class="css-1vqddgv">Wagered: </span>
          <span class="css-18icuxn"><div class="css-1y0ox2o"><span class="css-114dvlx">${wagered}</span></div></span>
        </div>
        <span class="css-v4675v"><div class="css-1y0ox2o"><span class="css-114dvlx glow">${prize}</span></div></span>
      `;
      top3.appendChild(card);
    } else {
      const row = document.createElement("div");
      row.className = "row list row-cols-5";
      row.setAttribute("data-v-1d580398", "");
      row.innerHTML = `
        <div class="hide-mobile col-2"><b style="font-size:18px;">#${place}</b></div>
        <div class="col-5">
          <img src="${logoSrc}" width="22" style="margin-right:8px;">
          <span style="font-weight:bold; font-size:16px;">${masked}</span>
        </div>
        <div class="col-2">
          <div class="price-wrapper glow" style="font-weight:bold; font-size:15px;">${prize}</div>
        </div>
        <div class="col-3">
          <div class="price-wrapper" style="color:#FFF; font-weight:bold; font-size:15px;">${wagered}</div>
        </div>
      `;
      const wrap = document.createElement("div");
      wrap.className = "leaderboard-row-wrapper";
      wrap.appendChild(row);
      list.appendChild(wrap);
    }
  });
}

/* ===== Fetch + Normalize ===== */
async function loadLeaderboard(apiURL = CURRENT_API_URL) {
  try {
    const res = await fetch(apiURL, { cache: "no-store" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText}\n${text.slice(0, 300)}`);
    }
    const json = await res.json();

    // Expect: { affiliates: [ { username, wagered_amount }, ... ], cache_updated_at: "..." }
    const raw = Array.isArray(json) ? json : (json.affiliates || []);
    const rows = raw
      .map(a => ({ username: a.username || "Unknown", wagered: toNum(a.wagered_amount ?? a.wagered) }))
      .filter(r => r.wagered > 0)
      .sort((a, b) => b.wagered - a.wagered) // highest first
      .slice(0, 10);

    renderLeaderboard(rows);
  } catch (err) {
    console.error("Leaderboard load error:", err);
    showError("Error loading leaderboard.", String(err));
  }
}

/* ===== Toggle: Previous / Current ===== */
const prevBtn = document.getElementById("prevLeaderboardBtn");
const currBtn = document.getElementById("currentLeaderboardBtn");
const countdownWrapper = document.getElementById("countdownWrapper");

prevBtn?.addEventListener("click", () => {
  loadLeaderboard(PREVIOUS_API_URL);
  prevBtn.style.display = "none";
  currBtn.style.display = "inline-flex";
  if (countdownWrapper) {
    countdownWrapper.style.visibility = "hidden";
    countdownWrapper.style.height = "0";
    countdownWrapper.style.overflow = "hidden";
  }
});

currBtn?.addEventListener("click", () => {
  loadLeaderboard(CURRENT_API_URL);
  currBtn.style.display = "none";
  prevBtn.style.display = "inline-flex";
  if (countdownWrapper) {
    countdownWrapper.style.visibility = "visible";
    countdownWrapper.style.height = "auto";
    countdownWrapper.style.overflow = "visible";
  }
});

/* ===== Initial Load ===== */
loadLeaderboard();
