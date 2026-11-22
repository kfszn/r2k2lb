import { fetchPlatformWagerRangeTotal, fetchRoobetEntriesForRange } from "@/lib/r2koins/platforms";
import { getCurrentRoobetPeriod } from "@/lib/roobet/period";

/**
 * Tournament wagers are the player's Roobet weighted wager (in dollars) for the
 * current leaderboard period — the same window the Roobet leaderboard shows —
 * not their lifetime total.
 */

/** Returns the player's current-period wager, 0 if they haven't wagered this period, or null on API failure. */
export async function getCurrentPeriodRoobetWager(username: string): Promise<number | null> {
  const period = getCurrentRoobetPeriod();
  const total = await fetchPlatformWagerRangeTotal("roobet", username, period.startISO, period.endISO);
  if (total === null) return null;
  return total === "not_found" ? 0 : total;
}

/** Lowercased username → current-period weighted wager for every affiliate. Null on API failure. */
export async function getCurrentPeriodRoobetWagerMap(): Promise<{
  wagers: Map<string, number>;
  period: { startISO: string; endISO: string };
} | null> {
  const period = getCurrentRoobetPeriod();
  const entries = await fetchRoobetEntriesForRange(period.startISO, period.endISO);
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
  return { wagers, period: { startISO: period.startISO, endISO: period.endISO } };
}
