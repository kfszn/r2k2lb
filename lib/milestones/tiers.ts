// Server-side helper for fetching admin-editable Wager Milestone tiers from
// the database. Single source of truth for both the /perks tier pages and
// the /account Rewards panel — editing a tier in /admin's Rewards tab
// updates everywhere this is called.

import { createClient } from "@/lib/supabase/server";
import type { MilestoneTier } from "@/components/milestones/milestone-tier-row";
import { getMilestoneWindow, type MilestoneCycle } from "@/lib/milestones/progress";

export type TierPlatform = "roobet" | "luxdrop";

function toStartISO(s: string) {
  return s.includes("T") ? s : `${s}T00:00:00.000Z`;
}
function toEndISO(s: string) {
  return s.includes("T") ? s : `${s}T23:59:59.999Z`;
}

/**
 * Fetch active tiers for a platform, sorted ascending, shaped for
 * <MilestoneTracker tiers={...} />. Returns an empty array on failure so
 * pages degrade gracefully instead of crashing (locked/empty state).
 *
 * When `username` is provided, each tier is also annotated with `claimed` —
 * true once the sum of that user's approved/paid wager_milestone reward_claims
 * *within the current cycle window* reaches this tier's cumulative payout.
 * Scoping to the current window matters because claims persist forever in
 * reward_claims, but tiers should become claimable again once a new cycle
 * starts — without the window filter, a tier claimed in a past cycle would
 * show "Claimed" forever.
 */
export async function getMilestoneTiers(
  platform: TierPlatform,
  username?: string | null,
  cycle: MilestoneCycle = "leaderboard"
): Promise<MilestoneTier[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wager_milestone_tiers")
    .select("*")
    .eq("platform", platform)
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];

  let claimedTotal = 0;
  if (username) {
    const window = getMilestoneWindow(platform, cycle);
    const { data: claims } = await supabase
      .from("reward_claims")
      .select("amount, status")
      .eq("platform", platform)
      .eq("category", "wager_milestone")
      .ilike("username", username)
      .in("status", ["approved", "paid"])
      .gte("created_at", toStartISO(window.start))
      .lte("created_at", toEndISO(window.end));

    for (const claim of claims ?? []) {
      claimedTotal += Number(claim.amount) || 0;
    }
  }

  return data.map((row, i) => {
    const payout = Number(row.reward_amount);
    return {
      tier: row.sort_order ?? i + 1,
      label: row.tier_name,
      wager: Number(row.wager_threshold),
      payout,
      claimable: row.claimable_amount != null ? Number(row.claimable_amount) : undefined,
      claimed: username ? claimedTotal >= payout : undefined,
    };
  });
}
