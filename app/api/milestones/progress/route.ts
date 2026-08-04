import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchWindowedWager,
  LEADERBOARD_WINDOWS,
  type MilestonePlatform,
} from "@/lib/milestones/progress";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID: MilestonePlatform[] = ["acebet", "luxdrop", "csbattle"];

// GET /api/milestones/progress?platform=acebet|luxdrop|csbattle
// Returns the signed-in user's linked username + wager for the platform's
// current leaderboard window.
export async function GET(request: NextRequest) {
  const platform = request.nextUrl.searchParams.get("platform") as MilestonePlatform | null;

  if (!platform || !VALID.includes(platform)) {
    return NextResponse.json({ error: "invalid_platform" }, { status: 400 });
  }

  const window = LEADERBOARD_WINDOWS[platform];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not signed in — the page prompts the visitor to log in.
  if (!user) {
    return NextResponse.json({ authenticated: false, linked: false, window });
  }

  // Resolve the linked platform username. linked_accounts (admin/Discord link)
  // is canonical for all three platforms; AceBet also supports self-serve
  // linking on the account page via profiles.acebet_username + acebet_id_suffix.
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
      .select("acebet_username, acebet_id_suffix")
      .eq("id", user.id)
      .maybeSingle();
    // Self-serve AceBet link stores the exact userId suffix — the reliable
    // match key — plus the resolved display name.
    acebetUserId = profile?.acebet_id_suffix ?? null;
    if (!username) username = profile?.acebet_username ?? null;
  }

  if (!username && !acebetUserId) {
    return NextResponse.json({ authenticated: true, linked: false, window });
  }

  const origin = request.nextUrl.origin;
  const wager = await fetchWindowedWager(
    platform,
    { username, acebetUserId },
    origin
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
