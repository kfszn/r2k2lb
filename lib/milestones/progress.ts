import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";

// Routes outbound calls through the whitelisted static IP (same pattern as the
// AceBet / LuxDrop affiliate routes).
const proxyAgent = process.env.PROXY_URL
  ? new HttpsProxyAgent(process.env.PROXY_URL)
  : undefined;

const ACEBET_TOKEN = process.env.ACEBET_API_TOKEN;
const LUXDROP_API_KEY = process.env.LUXDROP_API_KEY;
const LUXDROP_AFFILIATE_CODES = process.env.LUXDROP_AFFILIATE_CODES ?? "R2K2";
const CSBATTLE_LEADERBOARD_ID =
  process.env.CSBATTLE_LEADERBOARD_ID ?? "a450042c-7dde-4fc3-9656-dca50d671cd8";
const CSBATTLE_API_KEY = process.env.CSBATTLE_API_KEY;

export type MilestonePlatform = "acebet" | "luxdrop" | "csbattle";

/**
 * Leaderboard windows — these MUST match the per-platform leaderboard pages so
 * milestone progress "resets with the leaderboard".
 *   - AceBet:   app/api/leaderboard/route.js (DEFAULT_START/END) + countdown
 *   - CSBattle: app/leaderboard/csbattle/page.tsx (START_DATE/END_DATE)
 *   - LuxDrop:  app/leaderboard/luxdrop/page.tsx (START_DATE/END_DATE)
 */
export const LEADERBOARD_WINDOWS: Record<
  MilestonePlatform,
  { start: string; end: string }
> = {
  acebet: { start: "2026-07-30", end: "2026-08-31" },
  csbattle: { start: "2026-07-25", end: "2026-08-25" },
  luxdrop: { start: "2026-07-07", end: "2026-08-08" },
};

const CF_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "application/json",
  Referer: "https://acebet.co/",
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ── AceBet ──────────────────────────────────────────────────────────────────
// The detailed-summary API returns cumulative totals from :date to present.
// For the CURRENT cycle the start-date totals ARE the window totals; for a
// closed cycle we subtract the cumulative captured the day after it ended.
async function fetchAcebetDay(dayISO: string): Promise<any[] | null> {
  if (!ACEBET_TOKEN) return null;
  try {
    const url = `https://api.acebet.co/affiliates/detailed-summary/v2/${dayISO}`;
    const r = await fetch(url, {
      headers: { ...CF_HEADERS, Authorization: `Bearer ${ACEBET_TOKEN}` },
      // @ts-ignore node-fetch agent typing
      agent: proxyAgent,
    });
    if (!r.ok) return null;
    const j = await r.json().catch(() => null);
    if (Array.isArray(j)) return j;
    if (j && typeof j === "object") {
      for (const key of ["data", "records", "results"]) {
        if (Array.isArray((j as any)[key])) return (j as any)[key];
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function acebetWindowedWager(
  username: string,
  start: string,
  end: string
): Promise<number | "not_found" | null> {
  const uname = username.toLowerCase();
  const startRows = await fetchAcebetDay(start);
  if (startRows === null) return null;

  const startUser = startRows.find(
    (r) => r?.name && String(r.name).toLowerCase() === uname
  );
  if (!startUser) return "not_found";

  const startWager = Number(startUser.wagered) || 0;

  // Current / ongoing cycle → start totals are the window totals.
  if (end >= todayISO()) return startWager;

  // Closed cycle → subtract cumulative from the day after it ended.
  const dayAfter = new Date(`${end}T00:00:00Z`);
  dayAfter.setUTCDate(dayAfter.getUTCDate() + 1);
  const endRows = await fetchAcebetDay(dayAfter.toISOString().slice(0, 10));
  const endUser = endRows?.find(
    (r) => r?.name && String(r.name).toLowerCase() === uname
  );
  const endWager = endUser ? Number(endUser.wagered) || 0 : 0;
  return Math.max(0, startWager - endWager);
}

// ── LuxDrop ─────────────────────────────────────────────────────────────────
async function luxdropWindowedWager(
  username: string,
  start: string,
  end: string
): Promise<number | "not_found" | null> {
  if (!LUXDROP_API_KEY) return null;
  try {
    const upstream = new URL("https://api.luxdrop.com/external/affiliates");
    upstream.searchParams.set("codes", LUXDROP_AFFILIATE_CODES);
    upstream.searchParams.set("startDate", `${start}T00:00:00.000Z`);
    upstream.searchParams.set("endDate", `${end}T23:59:59.999Z`);

    const r = await fetch(upstream.toString(), {
      headers: { "x-api-key": LUXDROP_API_KEY, Accept: "application/json" },
      // @ts-ignore node-fetch agent typing
      agent: proxyAgent,
    });
    if (!r.ok) return null;
    const raw = await r.json().catch(() => null);

    let rows: any[] = [];
    if (Array.isArray(raw)) rows = raw;
    else if (raw && typeof raw === "object") {
      for (const key of ["data", "affiliates", "results", "leaderboard", "entries"]) {
        if (Array.isArray((raw as any)[key])) {
          rows = (raw as any)[key];
          break;
        }
      }
    }

    const uname = username.toLowerCase();
    const entry = rows.find((e) => {
      const name = e?.username ?? e?.name;
      return name && String(name).toLowerCase() === uname;
    });
    if (!entry) return "not_found";
    // LuxDrop wagered is in cents → convert to dollars.
    const cents = Number(
      entry.wagered ?? entry.wagerAmount ?? entry.totalWagered ?? 0
    );
    return cents / 100;
  } catch {
    return null;
  }
}

// ── CSBattle ────────────────────────────────────────────────────────────────
async function csbattleWindowedWager(
  username: string,
  start: string,
  end: string
): Promise<number | "not_found" | null> {
  try {
    const from = encodeURIComponent(`${start} 00:00:00`);
    const to = encodeURIComponent(`${end} 23:59:59`);
    const url =
      `https://api.csbattle.com/leaderboards/affiliates/${CSBATTLE_LEADERBOARD_ID}` +
      `?from=${from}&to=${to}`;

    const r = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(CSBATTLE_API_KEY ? { "x-api-key": CSBATTLE_API_KEY } : {}),
      },
      cache: "no-store",
    });
    if (!r.ok) return null;
    const raw = await r.json().catch(() => null);
    if (!raw) return null;

    const rows: any[] = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as any).users)
      ? (raw as any).users
      : [];

    const uname = username.toLowerCase();
    const entry = rows.find((e) => {
      const name = e?.username ?? e?.name;
      return name && String(name).toLowerCase() === uname;
    });
    if (!entry) return "not_found";
    // CSBattle wager is already in dollars.
    return Number(entry.wager ?? entry.wagered ?? entry.totalWagered ?? 0) || 0;
  } catch {
    return null;
  }
}

/**
 * Fetch a linked user's wager (in DOLLARS) for the platform's current
 * leaderboard window.
 *   number        → wager total in dollars
 *   "not_found"   → API reached but the username isn't in the affiliate list
 *   null          → API failure (do not treat as zero)
 */
export async function fetchWindowedWager(
  platform: MilestonePlatform,
  username: string
): Promise<number | "not_found" | null> {
  const win = LEADERBOARD_WINDOWS[platform];
  if (!win) return null;
  const uname = username.trim();
  if (!uname) return "not_found";

  if (platform === "acebet") return acebetWindowedWager(uname, win.start, win.end);
  if (platform === "luxdrop") return luxdropWindowedWager(uname, win.start, win.end);
  if (platform === "csbattle") return csbattleWindowedWager(uname, win.start, win.end);
  return null;
}
