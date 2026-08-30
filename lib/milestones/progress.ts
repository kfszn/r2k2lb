// Milestone progress — reuses the SAME internal affiliate routes and parsing
// the public leaderboards use, so a user's tracked wager always matches what
// they see on the leaderboard. We do NOT re-implement upstream fetching here.

export type MilestonePlatform = "acebet" | "luxdrop" | "roobet";

// Roobet's leaderboard runs on a rolling 7-day period computed from an
// anchor date — mirrors app/leaderboard/roobet/page.tsx (PERIOD_ANCHOR/PERIOD_DAYS)
// and app/api/cron/roobet-weekly-archive exactly, so milestone progress
// resets in lockstep with the public leaderboard.
const ROOBET_PERIOD_ANCHOR = "2026-08-28";
const ROOBET_PERIOD_DAYS = 7;

// One-off end-date override — mirrors app/leaderboard/roobet/page.tsx and
// app/api/cron/roobet-weekly-archive exactly. The cycle starting on
// ROOBET_PERIOD_ANCHOR runs long and ends 9/5/2026 instead of the standard
// 7-day cadence. Every subsequent period resumes the normal cadence.
const ROOBET_PERIOD_END_OVERRIDES: Record<string, string> = {
  "2026-08-28": "2026-09-05",
};

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function roobetPeriodEndFor(start: string): string {
  return ROOBET_PERIOD_END_OVERRIDES[start] ?? addDays(start, ROOBET_PERIOD_DAYS - 1);
}

function roobetCurrentPeriod(): { start: string; end: string } {
  const today = new Date().toISOString().slice(0, 10);
  let start = ROOBET_PERIOD_ANCHOR;
  let end = roobetPeriodEndFor(start);
  while (addDays(end, 1) <= today) {
    start = addDays(end, 1);
    end = roobetPeriodEndFor(start);
  }
  return { start, end };
}

/**
 * Leaderboard windows — these MUST match the per-platform leaderboard pages so
 * milestone progress "resets with the leaderboard".
 *   - "acebet": legacy platform key — app/api/leaderboard/route.js
 *     (DEFAULT_START/END). That route is now Roobet-backed under the hood.
 *   - LuxDrop:  app/leaderboard/luxdrop/page.tsx (START_DATE/END_DATE)
 *   - Roobet:   app/leaderboard/roobet/page.tsx (rolling 7-day period)
 */
const STATIC_WINDOWS: Record<"acebet" | "luxdrop", { start: string; end: string }> = {
  acebet: { start: "2026-07-30", end: "2026-08-31" },
  luxdrop: { start: "2026-07-07", end: "2026-08-08" },
};

export function getLeaderboardWindow(platform: MilestonePlatform): { start: string; end: string } {
  if (platform === "roobet") return roobetCurrentPeriod();
  return STATIC_WINDOWS[platform];
}

// Backward-compatible static snapshot (roobet resolved at import time — prefer
// getLeaderboardWindow(platform) for anything that needs the live value).
export const LEADERBOARD_WINDOWS: Record<
  MilestonePlatform,
  { start: string; end: string }
> = {
  ...STATIC_WINDOWS,
  roobet: roobetCurrentPeriod(),
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
  /** Legacy "acebet" platform key only — the numeric userId (legacy_acebet_id_suffix); the reliable match key. */
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
  const win = getLeaderboardWindow(platform);
  if (!win) return null;

  const username = (lookup.username ?? "").trim();
  const acebetUserId = (lookup.acebetUserId ?? "").trim();
  if (!username && !acebetUserId) return "not_found";

  try {
    if (platform === "acebet") {
      // Legacy platform key — /api/leaderboard is now backed by Roobet's
      // affiliate API under the hood (see app/api/leaderboard/route.js).
      const url = `${origin}/api/leaderboard?start_at=${win.start}&end_at=${win.end}&fresh=1`;
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) return null;
      const json = await r.json().catch(() => null);
      const rows = normalizeEntries(json?.data ?? json);
      // Prefer exact userId match, fall back to name.
      const entry =
        (acebetUserId &&
          rows.find((e) => String(e?.userId ?? "") === acebetUserId)) ||
        (username && rows.find((e) => eq(entryName(e), username)));
      if (!entry) return "not_found";
      // The route normalizes to CENTS regardless of upstream provider → convert to dollars.
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
      return Number(entry.weightedWagered ?? entry.wagered ?? entry.wagerAmount ?? entry.totalWagered ?? 0) || 0;
    }

    if (platform === "roobet") {
      const url = `${origin}/api/roobet/affiliates?startDate=${win.start}&endDate=${win.end}`;
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) return null;
      const json = await r.json().catch(() => null);
      const rows = normalizeEntries(json);
      const entry = username && rows.find((e) => eq(entryName(e), username));
      if (!entry) return "not_found";
      // Roobet's weighted-wager value is already in dollars (NOT cents) —
      // mirrors app/leaderboard/roobet/page.tsx's getEntryWagered().
      return Number(entry.weightedWagered ?? entry.wagered ?? entry.wagerAmount ?? entry.totalWagered ?? 0) || 0;
    }

    return null;
  } catch {
    return null;
  }
}
