// /js/leaderboard-page.js
// Fetches from your Vercel proxy (no CORS), renders Top 10, supports Previous toggle.

const CURRENT_API_URL  = "/api/leaderboard";        // current 18→18
const PREVIOUS_API_URL = "/api/leaderboard?prev=1"; // previous 18→18

const logoSrc   = "/assets/rainbetlogo.png";
const rewards   = [200, 100, 50, 20, 15, 10, 5]; // 1st → 7th
const top3Glows = ["0 0 40px #FFD700", "0 0 40px #C0C0C0", "0 0 40px #CD7F32"]; // Gold, Silver, Bronze

/* ===== Countdown (to next 18th 23:59:59 UTC) ===== */
(function updateCountdown() {
  const el = document.getElementById("countdown");
  if (!el) return;

  const now = new Date();
  let end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 18, 23, 59, 59, 999));
  if (now > end) end.setUTCMonth(end.getUTCMonth() + 1, 18);

  const diff = end - now;
  if (diff <= 0) { el.textContent = "Ended"; return; }

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  el.textContent = `${d}d ${h}h ${m}m ${s}s`;

  setTimeout(updateCountdown, 1000);
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
        <div class="css-hca0vm"><span class="css-15a1lq3" style="font-weight:bold;">${user}</span></div>
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
          <span style="font-weight:bold; font-size:16px;">${user}</span>
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