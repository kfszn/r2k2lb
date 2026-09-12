// Server-side helper for fetching admin-editable Wager Milestone tiers from
// the database. Single source of truth for both the /perks tier pages and
// the /account Rewards panel — editing a tier in /admin's Rewards tab
// updates everywhere this is called.

import { createClient } from "@/lib/supabase/server";
import type { MilestoneTier } from "@/components/milestones/milestone-tier-row";

export type TierPlatform = "roobet" | "luxdrop";

/**
 * Fetch active tiers for a platform, sorted ascending, shaped for
 * <MilestoneTracker tiers={...} />. Returns an empty array on failure so
 * pages degrade gracefully instead of crashing (locked/empty state).
 */
export async function getMilestoneTiers(platform: TierPlatform): Promise<MilestoneTier[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wager_milestone_tiers")
    .select("*")
    .eq("platform", platform)
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];

  return data.map((row, i) => ({
    tier: row.sort_order ?? i + 1,
    label: row.tier_name,
    wager: Number(row.wager_threshold),
    payout: Number(row.reward_amount),
    claimable: row.claimable_amount != null ? Number(row.claimable_amount) : undefined,
  }));
}
