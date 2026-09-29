import type { SupabaseClient } from "@supabase/supabase-js";
import { roobetPrizeForRank } from "@/lib/roobet/leaderboard-rewards";
import { getEntryName, normalizeRoobetEntries, sortByWeightedWager } from "@/lib/roobet/rank";

export interface LeaderboardClaimResult {
  username: string;
  rank: number;
  amount: number;
}

export interface LeaderboardClaimSkip {
  username: string;
  rank: number;
  reason: string;
}

/**
 * Posts pending `reward_claims` rows for every ranked Roobet player within
 * the paid positions, for a single archived period. Shared by the weekly
 * archive cron (runs once, right when a period ends) and the admin backfill
 * action (re-runnable any time afterward).
 *
 * Claims are posted for every paid username regardless of whether a profile
 * is linked yet — a claim is just a row keyed by `username`, and the account
 * rewards API matches claims to a player by `username ILIKE` against
 * whichever platform username they currently have linked. So a player who
 * links their Roobet account well after the period was archived still sees
 * (and can claim) every reward they're owed automatically; nothing needs to
 * be created retroactively for them.
 *
 * Re-running this for the same period is always safe: it's a no-op for any
 * rank that already has a claim, and only inserts for ranks that don't yet
 * have one.
 */
export async function createLeaderboardClaimsForPeriod(
  supabase: SupabaseClient,
  entries: unknown[],
  label: string
): Promise<{ created: LeaderboardClaimResult[]; skipped: LeaderboardClaimSkip[] }> {
  const rankedEntries = sortByWeightedWager(normalizeRoobetEntries(entries))
    .map((e) => ({ username: getEntryName(e) }))
    .filter((e) => e.username && e.username !== "Unknown");

  const created: LeaderboardClaimResult[] = [];
  const skipped: LeaderboardClaimSkip[] = [];

  for (let i = 0; i < rankedEntries.length; i++) {
    const rank = i + 1;
    const prize = roobetPrizeForRank(rank);
    if (prize <= 0) break; // ranks are sorted, so nothing further is paid
    const { username } = rankedEntries[i];

    const { data: existingClaim } = await supabase
      .from("reward_claims")
      .select("id")
      .eq("platform", "roobet")
      .ilike("username", username)
      .eq("category", "leaderboard")
      .eq("period_label", label)
      .maybeSingle();
    if (existingClaim) {
      skipped.push({ username, rank, reason: "already posted for this period" });
      continue;
    }

    const { error: claimError } = await supabase.from("reward_claims").insert({
      platform: "roobet",
      username,
      category: "leaderboard",
      title: `Weekly Leaderboard — Rank #${rank}`,
      amount: prize,
      status: "pending",
      period_label: label,
    });
    if (claimError) {
      skipped.push({ username, rank, reason: claimError.message });
      continue;
    }
    created.push({ username, rank, amount: prize });
  }

  return { created, skipped };
}
