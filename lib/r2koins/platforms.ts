import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";

// Routes outbound calls through the whitelisted static IP.
const proxyAgent = process.env.PROXY_URL
  ? new HttpsProxyAgent(process.env.PROXY_URL)
  : undefined;

const LUXDROP_API_KEY = process.env.LUXDROP_API_KEY;
const LUXDROP_AFFILIATE_CODES = process.env.LUXDROP_AFFILIATE_CODES ?? "R2K2";
const ROOBET_API_KEY = process.env.ROOBET_API_KEY;

// LuxDrop lifetime window start (before the affiliate program existed)
const LUXDROP_LIFETIME_START = "2024-01-01";
// Roobet lifetime window start (before the affiliate program existed)
const ROOBET_LIFETIME_START = "2024-01-01";

// Same official "Affiliate Stats API" endpoint used by app/api/roobet/affiliates/route.ts
const ROOBET_ENDPOINT = "https://roobetconnect.com/affiliate/v2/stats";
const ROOBET_AFFILIATE_USER_ID = "51b44ea5-f07c-41c8-9daf-9a35718b459e";

interface LuxdropEntry {
  username?: string;
  name?: string;
  wagered?: number;
  weightedWagered?: number;
  wagerAmount?: number;
  totalWagered?: number;
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
 * Fetch the full Roobet affiliate entry list (lifetime window), via the same
 * official "Affiliate Stats API" the leaderboard route calls.
 * Returns null on failure.
 */
export async function fetchRoobetUserList(): Promise<LuxdropEntry[] | null> {
  if (!ROOBET_API_KEY) return null;
  try {
    const endDate = new Date().toISOString().slice(0, 10);
    const upstream = new URL(ROOBET_ENDPOINT);
    upstream.searchParams.set("userId", ROOBET_AFFILIATE_USER_ID);
    upstream.searchParams.set("startDate", `${ROOBET_LIFETIME_START}T00:00:00.000Z`);
    upstream.searchParams.set("endDate", `${endDate}T23:59:59.999Z`);

    const response = await fetch(upstream.toString(), {
      headers: {
        Authorization: `Bearer ${ROOBET_API_KEY}`,
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
 * Fetch a single platform's affiliate entry list for an explicit date range
 * (as opposed to fetchLuxdropUserList/fetchRoobetUserList's fixed lifetime
 * window). Used to compute a single user's wager total for a specific
 * leaderboard period — e.g. the current month for milestone eligibility.
 * Returns null on failure.
 */
async function fetchPlatformEntriesForRange(
  platform: string,
  startISO: string,
  endISO: string
): Promise<LuxdropEntry[] | null> {
  try {
    if (platform === "luxdrop") {
      if (!LUXDROP_API_KEY) return null;
      const upstream = new URL("https://api.luxdrop.com/external/affiliates");
      upstream.searchParams.set("codes", LUXDROP_AFFILIATE_CODES);
      upstream.searchParams.set("startDate", startISO);
      upstream.searchParams.set("endDate", endISO);
      const response = await fetch(upstream.toString(), {
        headers: { "x-api-key": LUXDROP_API_KEY, Accept: "application/json" },
        // @ts-ignore node-fetch agent typing
        agent: proxyAgent,
      });
      if (!response.ok) return null;
      const raw = await response.json().catch(() => null);
      return normalizeAffiliateEntries(raw);
    }

    if (platform === "roobet") {
      if (!ROOBET_API_KEY) return null;
      const upstream = new URL(ROOBET_ENDPOINT);
      upstream.searchParams.set("userId", ROOBET_AFFILIATE_USER_ID);
      upstream.searchParams.set("startDate", startISO);
      upstream.searchParams.set("endDate", endISO);
      const response = await fetch(upstream.toString(), {
        headers: { Authorization: `Bearer ${ROOBET_API_KEY}`, Accept: "application/json" },
        // @ts-ignore node-fetch agent typing
        agent: proxyAgent,
      });
      if (!response.ok) return null;
      const raw = await response.json().catch(() => null);
      return normalizeAffiliateEntries(raw);
    }

    return null;
  } catch {
    return null;
  }
}

function normalizeAffiliateEntries(raw: unknown): LuxdropEntry[] | null {
  if (Array.isArray(raw)) return raw as LuxdropEntry[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const key of ["data", "affiliates", "results", "leaderboard", "entries"]) {
      if (Array.isArray(obj[key])) return obj[key] as LuxdropEntry[];
    }
  }
  return null;
}

/**
 * Look up a single user's wager total in DOLLARS on a platform for an
 * explicit date range (e.g. the current month for Roobet, the current
 * leaderboard period for LuxDrop) — used for live milestone eligibility.
 * Returns:
 *  - number  → the wager total in dollars for that range
 *  - "not_found" → API reached, user not in the affiliate list for that range
 *  - null    → API failure (do not treat as zero)
 */
export async function fetchPlatformWagerRangeTotal(
  platform: string,
  platformUsername: string,
  startISO: string,
  endISO: string
): Promise<number | "not_found" | null> {
  const uname = platformUsername.toLowerCase();
  const entries = await fetchPlatformEntriesForRange(platform, startISO, endISO);
  if (entries === null) return null;
  const entry = entries.find((e) => {
    const name = e.username ?? e.name;
    return name && name.toLowerCase() === uname;
  });
  if (!entry) return "not_found";

  if (platform === "luxdrop") {
    // LuxDrop wagered is in cents — convert to dollars
    const cents = Number(entry.wagered ?? entry.wagerAmount ?? entry.totalWagered ?? 0);
    return cents / 100;
  }

  // Roobet's weighted-wager value is already in dollars (NOT cents)
  return Number(entry.weightedWagered ?? entry.wagered ?? entry.wagerAmount ?? entry.totalWagered ?? 0) || 0;
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

  if (platform === "roobet") {
    const entries = await fetchRoobetUserList();
    if (entries === null) return null;
    const entry = entries.find((e) => {
      const name = e.username ?? e.name;
      return name && name.toLowerCase() === uname;
    });
    if (!entry) return "not_found";
    // Roobet's weighted-wager value is already in dollars (NOT cents) —
    // mirrors app/leaderboard/roobet/page.tsx's getEntryWagered().
    return Number(entry.weightedWagered ?? entry.wagered ?? entry.wagerAmount ?? entry.totalWagered ?? 0) || 0;
  }

  return null;
}
