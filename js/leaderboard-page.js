/* ===== R2K2 Leaderboard Page =====
   - Uses Rainbet API directly
   - Window: 18th (00:00 UTC) → next 18th (23:59 UTC)
   - DOM IDs expected:
       #top3-cards, #leaderboard-rows, #countdown
*/

const RAINBET_KEY = "OjwJ62YWj7gveE0OkmkrCvRM4U3Omh16";
const roobetLogo = '/assets/rainbetlogo.png';
const rewards = [200, 100, 50, 20, 15, 10, 5];
const top3Glows = ['0 0 40px #C0C0C0', '0 0 40px #FFD700', '0 0 40px #CD7F32'];

/* ==== Date Helpers ==== */
function getCurrentCycle() {
  const now = new Date();
  let end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 18, 23, 59, 59, 999));
  if (now > end) end.setUTCMonth(end.getUTCMonth() + 1, 18);
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 1, 18, 0, 0, 0, 0));
  const fmt = d => d.toISOString().slice(0, 10);
  return { startISO: fmt(start), endISO: fmt(end), endDate: end };
}

function getPreviousCycle() {
  const { startISO: curStartISO } = getCurrentCycle();
  const curStart = new Date(curStartISO + "T00:00:00Z");
  const prevEnd = new Date(Date.UTC(curStart.getUTCFullYear(), curStart.getUTCMonth(), 18, 23, 59, 59, 999));
  const prevStart = new Date(Date.UTC(prevEnd.getUTCFullYear(), prevEnd.getUTCMonth() - 1, 18, 0, 0, 0, 0));
  const fmt = d => d.toISOString().slice(0, 10);
  return { startISO: fmt(prevStart), endISO: fmt(prevEnd) };
}

const { startISO, endISO, endDate } = getCurrentCycle();
const { startISO: prevStartISO, endISO: prevEndISO } = getPreviousCycle();

const CURRENT_API_URL  = `https://services.rainbet.com/v1/external/affiliates?start_at=${startISO}&end_at=${endISO}&key=${encodeURIComponent(RAINBET_KEY)}`;
const PREVIOUS_API_URL = `https://services.rainbet.com/v1/external/affiliates?start_at=${prevStartISO}&end_at=${prevEndISO}&key=${encodeURIComponent(RAINBET_KEY)}`;

/* ==== Countdown ==== */
function updateCountdown() {
  const el = document.getElementById("countdown");
  const diff = endDate - new Date();
  if (diff <= 0) { el.textContent = "Ended"; return; }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  el.textContent = `${d}d ${h}h ${m}m ${s}s`;
}
setInterval(updateCountdown, 1000);
updateCountdown();

/* ==== Fetch + Render ==== */
async function loadLeaderboard(apiURL = CURRENT_API_URL) {
  try {
    const res = await fetch(apiURL, { cache: "no-store" });
    const json = await res.json();

    // Normalize to [{ username, wagered }]
    let rows = Array.isArray(json)
      ? json
      : (json.affiliates || []).map(a => ({
          username: a.username,
          wagered: Number(a.wagered_amount || 0)
        }));

    rows = rows.filter(r => r.wagered > 0)
               .sort((a, b) => b.wagered - a.wagered)
               .slice(0, 10);

    const top3Container = document.getElementById("top3-cards");
    const rowsContainer = document.getElementById("leaderboard-rows");
    top3Container.innerHTML = '';
    rowsContainer.innerHTML = '';

    rows.forEach((entry, index) => {
      const place = index + 1;
      const reward = index < rewards.length ? `$${rewards[index]}` : '$0';
      const wagered = `$${entry.wagered.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
      const username = entry.username || "Unknown";

      if (index < 3) {
        const card = document.createElement('div');
        card.className = 'css-jehefp';
        card.style.boxShadow = top3Glows[index] || '';
        card.style.position = 'relative';
        if (index === 1) card.style.transform = 'translateY(25px) scale(1.2)';
        if (index === 2) card.style.transform = 'translateY(25px)';
        card.innerHTML = `
          <img src="${roobetLogo}" style="width: 96px; height: auto; border-radius: 12px;">
          <div class="css-hca0vm"><span class="css-15a1lq3" style="font-weight:bold;">${username}</span></div>
          <div class="css-7ahevu ejrykqo0"><span class="css-1vqddgv">Wagered: </span>
            <span class="css-18icuxn"><div class="css-1y0ox2o"><span class="css-114dvlx">${wagered}</span></div></span>
          </div>
          <span class="css-v4675v"><div class="css-1y0ox2o"><span class="css-114dvlx glow">${reward}</span></div></span>
        `;
        top3Container.appendChild(card);
      } else {
        const row = document.createElement('div');
        row.className = 'row list row-cols-5';
        row.innerHTML = `
          <div class="hide-mobile col-2"><b style="font-size: 18px;">#${place}</b></div>
          <div class="col-5">
            <img src="${roobetLogo}" width="22" style="margin-right: 8px;">
            <span style="font-weight:bold; font-size: 16px;">${username}</span>
          </div>
          <div class="col-2">
            <div class="price-wrapper glow" style="font-weight:bold; font-size: 15px;">${reward}</div>
          </div>
          <div class="col-3">
            <div class="price-wrapper" style="color: #FFF; font-weight:bold; font-size: 15px;">${wagered}</div>
          </div>
        `;
        const wrapper = document.createElement("div");
        wrapper.className = "leaderboard-row-wrapper";
        wrapper.appendChild(row);
        rowsContainer.appendChild(wrapper);
      }
    });
  } catch (err) {
    console.error("Failed to load leaderboard:", err);
    document.getElementById("leaderboard-rows").innerHTML =
      "<p style='color:red;'>Error loading leaderboard.</p>";
  }
}

/* ==== Toggle Current vs Previous ==== */
const prevBtn = document.getElementById("prevLeaderboardBtn");
const currBtn = document.getElementById("currentLeaderboardBtn");
const countdownWrapper = document.getElementById("countdownWrapper");

prevBtn?.addEventListener("click", () => {
  loadLeaderboard(PREVIOUS_API_URL);
  prevBtn.style.display = "none";
  currBtn.style.display = "inline-flex";
  countdownWrapper.style.visibility = "hidden";
  countdownWrapper.style.height = "0";
  countdownWrapper.style.overflow = "hidden";
});

currBtn?.addEventListener("click", () => {
  loadLeaderboard(CURRENT_API_URL);
  currBtn.style.display = "none";
  prevBtn.style.display = "inline-flex";
  countdownWrapper.style.visibility = "visible";
  countdownWrapper.style.height = "auto";
  countdownWrapper.style.overflow = "visible";
});

/* ==== Initial Load ==== */
loadLeaderboard();
