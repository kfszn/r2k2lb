import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";

// Same proxy-agent pattern as /app/api/acebet/validate/route.ts —
// routes outbound calls through the whitelisted static IP.
const proxyAgent = process.env.PROXY_URL
  ? new HttpsProxyAgent(process.env.PROXY_URL)
  : undefined;

const ACEBET_TOKEN = process.env.ACEBET_API_TOKEN;
const LUXDROP_API_KEY = process.env.LUXDROP_API_KEY;
const LUXDROP_AFFILIATE_CODES = process.env.LUXDROP_AFFILIATE_CODES ?? "R2K2";

// Acebet detailed-summary from the earliest date = lifetime totals under the affiliate
const ACEBET_LIFETIME_START = "2025-12-26";
// LuxDrop lifetime window start (before the affiliate program existed)
const LUXDROP_LIFETIME_START = "2024-01-01";

interface AcebetUser {
  name: string;
  wagered: number;
  active: boolean;
}

interface LuxdropEntry {
  username?: string;
  name?: string;
  wagered?: number;
  wagerAmount?: number;
  totalWagered?: number;
}

/**
 * Fetch the full Acebet affiliate user list (lifetime window).
 * Returns null on failure so callers can distinguish "API down" from "user not found".
 */
export async function fetchAcebetUserList(): Promise<AcebetUser[] | null> {
  if (!ACEBET_TOKEN) return null;
  try {
    const url = `https://api.acebet.co/affiliates/detailed-summary/v2/${ACEBET_LIFETIME_START}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "application/json",
        Referer: "https://acebet.co/",
        Authorization: `Bearer ${ACEBET_TOKEN}`,
      },
      // @ts-ignore node-fetch agent typing
      agent: proxyAgent,
    });
    if (!response.ok) return null;
    const data = await response.json().catch(() => null);
    return Array.isArray(data) ? (data as AcebetUser[]) : null;
  } catch {
    return null;
  }
}

/**
 * Fetch the full LuxDrop affiliate entry list (lifetime window).
 * Returns null on failure.
 */
export async function fetchLuxdropUserList(): Promise<LuxdropEntry[] | null> {
  if (!LUXDROP_API_KEY) return null;
  try {
    const endDate = new Date().toISOString().slice(0, 10);
    const upstream = new URL("https://api.luxdrop.com/external/affiliates");
    upstream.searchParams.set("codes", LUXDROP_AFFILIATE_CODES);
    upstream.searchParams.set("startDate", `${LUXDROP_LIFETIME_START}T00:00:00.000Z`);
    upstream.searchParams.set("endDate", `${endDate}T23:59:59.999Z`);

    const response = await fetch(upstream.toString(), {
      headers: {
        "x-api-key": LUXDROP_API_KEY,
        Accept: "application/json",
      },
      // @ts-ignore node-fetch agent typing
      agent: proxyAgent,
    });
    if (!response.ok) return null;
    const raw = await response.json().catch(() => null);
    if (Array.isArray(raw)) return raw as LuxdropEntry[];
    if (raw && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;
      for (const key of ["data", "affiliates", "results", "leaderboard", "entries"]) {
        if (Array.isArray(obj[key])) return obj[key] as LuxdropEntry[];
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Look up a single user's lifetime wager total in DOLLARS on a platform.
 * Returns:
 *  - number  → the wager total in dollars
 *  - "not_found" → API reached, user not in the affiliate list
 *  - null    → API failure (do not treat as zero)
 */
export async function fetchPlatformWagerTotal(
  platform: string,
  platformUsername: string
): Promise<number | "not_found" | null> {
  const uname = platformUsername.toLowerCase();

  if (platform === "acebet") {
    const users = await fetchAcebetUserList();
    if (users === null) return null;
    const user = users.find((u) => u.name && u.name.toLowerCase() === uname);
    if (!user) return "not_found";
    // Acebet wagered is already in dollars
    return Number(user.wagered) || 0;
  }

  if (platform === "luxdrop") {
    const entries = await fetchLuxdropUserList();
    if (entries === null) return null;
    const entry = entries.find((e) => {
      const name = e.username ?? e.name;
      return name && name.toLowerCase() === uname;
    });
    if (!entry) return "not_found";
    // LuxDrop wagered is in cents — convert to dollars
    const cents = Number(entry.wagered ?? entry.wagerAmount ?? entry.totalWagered ?? 0);
    return cents / 100;
  }

  return null;
}
