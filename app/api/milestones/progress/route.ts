import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchWindowedWager,
  getMilestoneWindow,
  type MilestoneCycle,
  type MilestonePlatform,
} from "@/lib/milestones/progress";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID: MilestonePlatform[] = ["acebet", "luxdrop", "roobet"];

// GET /api/milestones/progress?platform=acebet|luxdrop|roobet&cycle=leaderboard|rewards
// Returns the signed-in user's linked username + wager for the platform's
// current tracking window. "cycle" defaults to the weekly leaderboard window;
// pass cycle=rewards for Roobet's independent 30-day Wager Rewards cycle.
export async function GET(request: NextRequest) {
  const platform = request.nextUrl.searchParams.get("platform") as MilestonePlatform | null;
  const cycle = (request.nextUrl.searchParams.get("cycle") as MilestoneCycle | null) ?? "leaderboard";

  if (!platform || !VALID.includes(platform)) {
    return NextResponse.json({ error: "invalid_platform" }, { status: 400 });
  }

  const window = getMilestoneWindow(platform, cycle);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not signed in — the page prompts the visitor to log in.
  if (!user) {
    return NextResponse.json({ authenticated: false, linked: false, window });
  }

  // Resolve the linked platform username. linked_accounts (admin/Discord link)
  // is canonical for all three platforms; Roobet also supports self-serve
  // linking on the account page via profiles.roobet_username. The legacy
  // "acebet" platform key only has historical data under profiles.legacy_acebet_*
  // (self-serve AceBet linking has been retired).
  let username: string | null = null;
  let acebetUserId: string | null = null;

  const { data: link } = await supabase
    .from("linked_accounts")
    .select("platform_username")
    .eq("kick_user_id", user.id)
    .eq("platform", platform)
    .maybeSingle();

  username = link?.platform_username ?? null;

  if (platform === "acebet") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("legacy_acebet_username, legacy_acebet_id_suffix")
      .eq("id", user.id)
      .maybeSingle();
    // Legacy self-serve AceBet link stored the exact userId suffix — the
    // reliable match key — plus the resolved display name.
    acebetUserId = profile?.legacy_acebet_id_suffix ?? null;
    if (!username) username = profile?.legacy_acebet_username ?? null;
  }

  if (platform === "roobet" && !username) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("roobet_username")
      .eq("id", user.id)
      .maybeSingle();
    username = profile?.roobet_username ?? null;
  }

  if (!username && !acebetUserId) {
    return NextResponse.json({ authenticated: true, linked: false, window });
  }

  const origin = request.nextUrl.origin;
  const wager = await fetchWindowedWager(
    platform,
    { username, acebetUserId },
    origin,
    window
  );

  return NextResponse.json({
    authenticated: true,
    linked: true,
    username,
    // number → dollars wagered this cycle; null → live API failed to respond
    wagered: wager === "not_found" ? 0 : wager,
    apiError: wager === null,
    notFound: wager === "not_found",
    window,
  });
}
