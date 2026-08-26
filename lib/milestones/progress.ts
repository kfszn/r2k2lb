// Milestone progress — reuses the SAME internal affiliate routes and parsing
// the public leaderboards use, so a user's tracked wager always matches what
// they see on the leaderboard. We do NOT re-implement upstream fetching here.

export type MilestonePlatform = "acebet" | "luxdrop";

/**
 * Leaderboard windows — these MUST match the per-platform leaderboard pages so
 * milestone progress "resets with the leaderboard".
 *   - AceBet:   app/api/leaderboard/route.js (DEFAULT_START/END)
 *   - LuxDrop:  app/leaderboard/luxdrop/page.tsx (START_DATE/END_DATE)
 */
export const LEADERBOARD_WINDOWS: Record<
  MilestonePlatform,
  { start: string; end: string }
> = {
  acebet: { start: "2026-07-30", end: "2026-08-31" },
  luxdrop: { start: "2026-07-07", end: "2026-08-08" },
};

// ── Shared parsing (mirrors the leaderboard pages exactly) ───────────────────
function normalizeEntries(raw: unknown): any[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const key of ["users", "data", "affiliates", "results", "leaderboard", "entries"]) {
      if (Array.isArray(obj[key])) return obj[key] as any[];
    }
  }
  return [];
}

function entryName(e: any): string {
  return String(e?.username ?? e?.name ?? "").trim();
}

function eq(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

export interface WagerLookup {
  username: string | null;
  /** AceBet only — the numeric userId (acebet_id_suffix); the reliable match key. */
  acebetUserId?: string | null;
}

/**
 * Fetch a linked user's wager (in DOLLARS) for the platform's current
 * leaderboard window by calling the same internal affiliate route the
 * leaderboard uses.
 *   number        → wager total in dollars
 *   "not_found"   → route reached but the user isn't in the affiliate list
 *   null          → route/API failure (do not treat as zero)
 */
export async function fetchWindowedWager(
  platform: MilestonePlatform,
  lookup: WagerLookup,
  origin: string
): Promise<number | "not_found" | null> {
  const win = LEADERBOARD_WINDOWS[platform];
  if (!win) return null;

  const username = (lookup.username ?? "").trim();
  const acebetUserId = (lookup.acebetUserId ?? "").trim();
  if (!username && !acebetUserId) return "not_found";

  try {
    if (platform === "acebet") {
      const url = `${origin}/api/leaderboard?start_at=${win.start}&end_at=${win.end}&fresh=1`;
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) return null;
      const json = await r.json().catch(() => null);
      const rows = normalizeEntries(json?.data ?? json);
      // Prefer exact userId match (acebet_id_suffix), fall back to name.
      const entry =
        (acebetUserId &&
          rows.find((e) => String(e?.userId ?? "") === acebetUserId)) ||
        (username && rows.find((e) => eq(entryName(e), username)));
      if (!entry) return "not_found";
      // AceBet API returns wagered in CENTS → convert to dollars.
      return (Number(entry.wagered) || 0) / 100;
    }

    if (platform === "luxdrop") {
      const url = `${origin}/api/luxdrop/affiliates?startDate=${win.start}&endDate=${win.end}`;
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) return null;
      const json = await r.json().catch(() => null);
      const rows = normalizeEntries(json);
      const entry = username && rows.find((e) => eq(entryName(e), username));
      if (!entry) return "not_found";
      // LuxDrop wager is already in dollars (NOT cents).
      return Number(entry.wagered ?? entry.wagerAmount ?? entry.totalWagered ?? 0) || 0;
    }

    return null;
  } catch {
    return null;
  }
}
