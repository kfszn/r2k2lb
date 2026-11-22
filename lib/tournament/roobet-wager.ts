import { fetchPlatformWagerRangeTotal, fetchRoobetEntriesForRange } from "@/lib/r2koins/platforms";
import { getCurrentRoobetPeriod } from "@/lib/roobet/period";

/**
 * Tournament wagers are the player's Roobet weighted wager (in dollars) over the
 * timeframe picked when the tournament was created (`tournaments.wager_timeframe`):
 *   "period" — the live Roobet leaderboard period
 *   "7" | "14" | "30" — the last N days, rolling up to now
 *   "all" — everything since tracking began
 */

export type WagerTimeframe = "period" | "7" | "14" | "30" | "all";

export interface WagerWindow {
  timeframe: WagerTimeframe;
  startISO: string;
  endISO: string;
}

const ALL_TIME_START_ISO = "2026-08-28T00:00:00.000Z";
const DAY_MS = 24 * 60 * 60 * 1000;

export function normalizeTimeframe(value: unknown): WagerTimeframe {
  return value === "7" || value === "14" || value === "30" || value === "all" || value === "period"
    ? value
    : "period";
}

export function getWagerWindow(timeframe: unknown): WagerWindow {
  const tf = normalizeTimeframe(timeframe);
  if (tf === "period") {
    const period = getCurrentRoobetPeriod();
    return { timeframe: tf, startISO: period.startISO, endISO: period.endISO };
  }
  const now = new Date();
  const start = tf === "all" ? new Date(ALL_TIME_START_ISO) : new Date(now.getTime() - Number(tf) * DAY_MS);
  return { timeframe: tf, startISO: start.toISOString(), endISO: now.toISOString() };
}

/** Returns the player's wager for the tournament's timeframe, 0 if none, or null on API failure. */
export async function getTournamentRoobetWager(username: string, timeframe: unknown): Promise<number | null> {
  const window = getWagerWindow(timeframe);
  const total = await fetchPlatformWagerRangeTotal("roobet", username, window.startISO, window.endISO);
  if (total === null) return null;
  return total === "not_found" ? 0 : total;
}

/** Lowercased username → weighted wager for every affiliate in the timeframe. Null on API failure. */
export async function getTournamentRoobetWagerMap(timeframe: unknown): Promise<{
  wagers: Map<string, number>;
  window: WagerWindow;
} | null> {
  const window = getWagerWindow(timeframe);
  const entries = await fetchRoobetEntriesForRange(window.startISO, window.endISO);
  if (entries === null) return null;
  const wagers = new Map<string, number>();
  for (const e of entries) {
    const name = e.username ?? e.name;
    if (!name) continue;
    wagers.set(
      name.toLowerCase(),
      Number(e.weightedWagered ?? e.wagered ?? e.wagerAmount ?? e.totalWagered ?? 0) || 0
    );
  }
  return { wagers, window };
}
