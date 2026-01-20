import { createApiClient } from "@/lib/supabase/api";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client"; // Import createClient

const ACEBET_API_URL = "https://api.acebet.com/affiliates/detailed-summary/v2";
const ACEBET_TOKEN = process.env.ACEBET_API_TOKEN;

interface AcebetUser {
  userId: number;
  name: string;
  avatar: string;
  badge: string | null;
  role: string;
  active: boolean;
  isPrivate: boolean;
  premiumUntil: string | null;
  wagered: number;
  deposited: number;
  earned: number;
  xp: number;
  firstSeen: string;
  lastSeen: string;
}

interface AcebetResponse {
  Users: AcebetUser[];
}

// Cache for Acebet users
let cachedUsers: AcebetUser[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getAcebetUsers(): Promise<AcebetUser[]> {
  const now = Date.now();
  
  if (cachedUsers && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedUsers;
  }

  if (!ACEBET_TOKEN) {
    return [];
  }

  try {
    const response = await fetch(ACEBET_API_URL, {
      headers: {
        Authorization: `Bearer ${ACEBET_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return cachedUsers || [];
    }

    const data: AcebetResponse = await response.json();
    cachedUsers = data.Users || [];
    cacheTimestamp = now;
    return cachedUsers;
  } catch {
    return cachedUsers || [];
  }
}

// GET endpoint for Botrix $(customapi) calls
// URL: /api/botrix/enter?kick=KICKUSER&acebet=ACEBETUSER
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const kickUsername = searchParams.get("kick");
    const acebetUsername = searchParams.get("acebet");

    if (!kickUsername || !acebetUsername) {
      return new NextResponse("Usage: !enter YourAcebetName", { status: 200 });
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

    // Validate Acebet user (case insensitive)
    const users = await getAcebetUsers();
    const acebetUser = users.find(u => u.name.toLowerCase() === acebetUsername.toLowerCase());

    if (!acebetUser && ACEBET_TOKEN) {
      return new NextResponse(`@${kickUsername} Entry DENIED - "${acebetUsername}" not found under code R2K2. Sign up at acebet.com with code R2K2!`, { status: 200 });
    }

    // Check requirements
    if (acebetUser && ACEBET_TOKEN) {
      if (tournament.require_active && !acebetUser.active) {
        return new NextResponse(`@${kickUsername} Entry DENIED - You must be active under code R2K2.`, { status: 200 });
      }

      if (tournament.min_wager && acebetUser.wagered < tournament.min_wager) {
        return new NextResponse(`@${kickUsername} Entry DENIED - Need $${tournament.min_wager.toLocaleString()} wagered (you have $${acebetUser.wagered.toLocaleString()}).`, { status: 200 });
      }
    }

    // Register player
    const { error: insertError } = await supabase
      .from("tournament_players")
      .insert({
        tournament_id: tournament.id,
        acebet_username: acebetUser?.name || acebetUsername,
        kick_username: kickUsername,
        display_name: kickUsername,
        status: "registered",
        acebet_wager: acebetUser?.wagered || 0,
        acebet_active: acebetUser?.active || false,
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
