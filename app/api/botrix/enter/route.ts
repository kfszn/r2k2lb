import { createApiClient } from "@/lib/supabase/api";
import { NextRequest, NextResponse } from "next/server";
import { fetchRoobetUserList } from "@/lib/r2koins/platforms";

interface RoobetUser {
  name: string;
  wagered: number;
  active: boolean;
}

// Cache for Roobet affiliate users
let cachedUsers: RoobetUser[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getRoobetUsers(): Promise<RoobetUser[]> {
  const now = Date.now();

  if (cachedUsers && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedUsers;
  }

  const entries = await fetchRoobetUserList();
  if (entries === null) {
    return cachedUsers || [];
  }

  cachedUsers = entries
    .filter((e) => e.username ?? e.name)
    .map((e) => {
      const wagered = Number(e.weightedWagered ?? e.wagered ?? e.wagerAmount ?? e.totalWagered ?? 0) || 0;
      return {
        name: String(e.username ?? e.name),
        wagered,
        active: wagered > 0,
      };
    });
  cacheTimestamp = now;
  return cachedUsers;
}

// GET endpoint for Botrix $(customapi) calls
// URL: /api/botrix/enter?kick=KICKUSER&roobet=ROOBETUSER
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const kickUsername = searchParams.get("kick");
    const roobetUsername = searchParams.get("roobet");

    if (!kickUsername || !roobetUsername) {
      return new NextResponse("Usage: !enter YourRoobetName", { status: 200 });
    }

    const supabase = createApiClient();

    // Get active tournament with registration open
    const { data: tournament } = await supabase
      .from("tournaments")
      .select("*")
      .in("status", ["pending", "registration"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!tournament) {
      return new NextResponse(`@${kickUsername} No tournament is currently open for registration.`, { status: 200 });
    }

    if (tournament.status === "pending") {
      return new NextResponse(`@${kickUsername} Tournament registration hasn't opened yet. Stay tuned!`, { status: 200 });
    }

    // Check if already registered (case insensitive)
    const { data: existingPlayer } = await supabase
      .from("tournament_players")
      .select("id")
      .eq("tournament_id", tournament.id)
      .ilike("kick_username", kickUsername)
      .maybeSingle();

    if (existingPlayer) {
      return new NextResponse(`@${kickUsername} You're already registered for this tournament!`, { status: 200 });
    }

    // Check if tournament is full
    const { count } = await supabase
      .from("tournament_players")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", tournament.id);

    if (count && count >= tournament.max_players) {
      return new NextResponse(`@${kickUsername} Tournament is full! (${count}/${tournament.max_players})`, { status: 200 });
    }

    // Validate Roobet user (case insensitive)
    const users = await getRoobetUsers();
    const roobetUser = users.find(u => u.name.toLowerCase() === roobetUsername.toLowerCase());

    if (!roobetUser) {
      return new NextResponse(`@${kickUsername} Entry DENIED - "${roobetUsername}" not found under code R2K2. Sign up at roobet.com with code R2K2!`, { status: 200 });
    }

    // Check requirements
    if (tournament.require_active && !roobetUser.active) {
      return new NextResponse(`@${kickUsername} Entry DENIED - You must be active under code R2K2.`, { status: 200 });
    }

    if (tournament.min_wager && roobetUser.wagered < tournament.min_wager) {
      return new NextResponse(`@${kickUsername} Entry DENIED - Need $${tournament.min_wager.toLocaleString()} wagered (you have $${roobetUser.wagered.toLocaleString()}).`, { status: 200 });
    }

    // Register player
    const { error: insertError } = await supabase
      .from("tournament_players")
      .insert({
        tournament_id: tournament.id,
        roobet_username: roobetUser.name || roobetUsername,
        kick_username: kickUsername,
        display_name: kickUsername,
        status: "registered",
        roobet_wager: roobetUser.wagered || 0,
        roobet_active: roobetUser.active || false,
      });

    if (insertError) {
      console.error("Error registering player:", insertError);
      return new NextResponse(`@${kickUsername} Error registering. Please try again.`, { status: 200 });
    }

    const newCount = (count || 0) + 1;
    return new NextResponse(`@${kickUsername} Entry ACCEPTED! You're in "${tournament.name}"! (${newCount}/${tournament.max_players})`, { status: 200 });
  } catch (error) {
    console.error("Botrix enter error:", error);
    return new NextResponse("Error processing entry. Try again later.", { status: 200 });
  }
}
