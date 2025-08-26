// /js/leaderboard-page.js
// Uses your Vercel API routes so the browser never hits Rainbet directly (no CORS issues).

const CURRENT_API_URL  = "/api/leaderboard";        // current 18→18
const PREVIOUS_API_URL = "/api/leaderboard?prev=1"; // previous 18→18

const roobetLogo = "/assets/rainbetlogo.png";
const rewards = [100, 200, 50, 20, 15, 10, 5];
const top3Glows = ["0 0 40px #C0C0C0", "0 0 40px #FFD700", "0 0 40px #CD7F32"];

/* countdown to the end of the current cycle (next 18th @ 23:59:59 UTC) */
(function updateCountdown() {
  const now = new Date();
  let end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 18, 23, 59, 59, 999));
  if (now > end) end.setUTCMonth(end.getUTCMonth() + 1, 18);

  const el = document.getElementById("countdown");
  const diff = end - now;
  if (!el) return;

  if (diff <= 0) { el.textContent = "Ended"; return; }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  el.textContent = `${d}d ${h}h ${m}m ${s}s`;
  setTimeout(updateCountdown, 1000);
})();

/* helpers */
const toNum = v => Number.isFinite(Number(v)) ? Number(v) : 0;

function showError(msg) {
  const container = document.getElementById("leaderboard-rows");
  if (!container) return;
  container.innerHTML = `<div style="color:red; margin:12px 0;">${msg}</div>`;
}

function renderLeaderboard(rows) {
  const top3Container = document.querySelector(".css-gqrafh");
  const rowsContainer = document.getElementById("leaderboard-rows");
  if (!top3Container || !rowsContainer) return;

  top3Container.innerHTML = "";
  rowsContainer.innerHTML = "";

  rows.forEach((entry, index) => {
    const place = index + 1;
    const reward = index < rewards.length ? `$ ${rewards[index]}` : "$ 0";
    const wagered = `$ ${entry.wagered.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const username = entry.username || "Unknown";

    if (index < 3) {
      const card = document.createElement("div");
      card.className = "css-jehefp";
      card.style.boxShadow = top3Glows[index] || "";
      card.style.position = "relative";
      if (index === 1) card.style.transform = "translateY(25px) scale(1.2)";
      if (index === 2) card.style.transform = "translateY(25px)";
      card.innerHTML = `
        <img src="${roobetLogo}" style="width:96px; height:auto; border-radius:12px;">
        <div class="css-hca0vm"><span class="css-15a1lq3" style="font-weight:bold;">${username}</span></div>
        <div class="css-7ahevu ejrykqo0"><span class="css-1vqddgv">Wagered: </span>
          <span class="css-18icuxn"><div class="css-1y0ox2o"><span class="css-114dvlx">${wagered}</span></div></span>
        </div>
        <span class="css-v4675v"><div class="css-1y0ox2o"><span class="css-114dvlx glow">${reward}</span></div></span>
      `;
      top3Container.appendChild(card);
    } else {
      const row = document.createElement("div");
      row.className = "row list row-cols-5";
      row.setAttribute("data-v-1d580398", "");
      row.innerHTML = `
        <div class="hide-mobile col-2"><b style="font-size:18px;">#${place}</b></div>
        <div class="col-5">
          <img src="${roobetLogo}" width="22" style="margin-right:8px;">
          <span style="font-weight:bold; font-size:16px;">${username}</span>
        </div>
        <div class="col-2">
          <div class="price-wrapper glow" style="font-weight:bold; font-size:15px;">${reward}</div>
        </div>
        <div class="col-3">
          <div class="price-wrapper" style="color:#FFF; font-weight:bold; font-size:15px;">${wagered}</div>
        </div>
      `;
      const wrapper = document.createElement("div");
      wrapper.className = "leaderboard-row-wrapper";
      wrapper.appendChild(row);
      rowsContainer.appendChild(wrapper);
    }
  });
}

/* fetch + normalize */
async function loadLeaderboard(apiURL = CURRENT_API_URL) {
  try {
    const res = await fetch(apiURL, { cache: "no-store" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    }

    const json = await res.json();
    // Expect { affiliates: [ { username, wagered_amount }, ... ], cache_updated_at: "..." }
    const list = Array.isArray(json) ? json : (json.affiliates || []);
    const rows = list
      .map(a => ({ username: a.username || "Unknown", wagered: toNum(a.wagered_amount ?? a.wagered) }))
      .filter(r => r.wagered > 0)
      .sort((a, b) => b.wagered - a.wagered)
      .slice(0, 10);

    renderLeaderboard(rows);
  } catch (e) {
    console.error("Leaderboard load error:", e);
    showError("Error loading leaderboard.");
  }
}

/* toggle buttons */
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

// Initial load
loadLeaderboard();