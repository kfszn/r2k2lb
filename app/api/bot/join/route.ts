import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

// Cache the user list for 5 minutes to avoid excessive API calls
let cachedUsers: AcebetUser[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getAcebetUsers(): Promise<AcebetUser[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (cachedUsers && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedUsers;
  }

  if (!ACEBET_TOKEN) {
    console.warn("ACEBET_API_TOKEN not configured");
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
      console.error("Acebet API error:", response.status);
      return cachedUsers || [];
    }

    const data: AcebetResponse = await response.json();
    cachedUsers = data.Users || [];
    cacheTimestamp = now;
    return cachedUsers;
  } catch (error) {
    console.error("Error fetching Acebet users:", error);
    return cachedUsers || [];
  }
}

async function validateAcebetUser(username: string): Promise<{ valid: boolean; user?: AcebetUser }> {
  if (!ACEBET_TOKEN) {
    console.warn("ACEBET_API_TOKEN not configured, skipping validation");
    return { valid: true };
  }

  const users = await getAcebetUsers();
  const user = users.find(u => u.name.toLowerCase() === username.toLowerCase());
  
  return { valid: !!user, user };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kickUsername, acebetUsername, botSecret } = body;

    // Validate bot secret (optional security measure)
    if (process.env.BOT_SECRET && botSecret !== process.env.BOT_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!kickUsername || !acebetUsername) {
      return NextResponse.json(
        { 
          success: false,
          message: "Usage: !enter <acebet_username>" 
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find active tournament in registration
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("status", "registration")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json({
        success: false,
        message: "No tournament is currently accepting registrations.",
      });
    }

    // Check if tournament is full
    const { count } = await supabase
      .from("tournament_players")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", tournament.id);

    if (count !== null && count >= tournament.max_players) {
      return NextResponse.json({
        success: false,
        message: "Tournament is full! Better luck next time.",
      });
    }

    // Check if player already registered (by Kick or Acebet username)
    const { data: existingPlayer } = await supabase
      .from("tournament_players")
      .select("id")
      .eq("tournament_id", tournament.id)
      .or(`acebet_username.eq.${acebetUsername.toLowerCase()},kick_username.eq.${kickUsername.toLowerCase()}`)
      .single();

    if (existingPlayer) {
      return NextResponse.json({
        success: false,
        message: `@${kickUsername} You're already registered for this tournament!`,
      });
    }

    // Validate Acebet username and get user data
    const { valid: isValid, user: acebetUser } = await validateAcebetUser(acebetUsername);
    if (!isValid && ACEBET_TOKEN) {
      return NextResponse.json({
        success: false,
        message: `@${kickUsername} Entry DENIED - Not under code R2K2. Sign up at acebet.com with code R2K2!`,
      });
    }

    // Check if user meets requirements
    if (acebetUser && ACEBET_TOKEN) {
      // Check active requirement
      if (tournament.require_active && !acebetUser.active) {
        return NextResponse.json({
          success: false,
          message: `@${kickUsername} Entry DENIED - You must be active under code R2K2 to enter.`,
        });
      }

      // Check minimum wager requirement
      if (tournament.min_wager && acebetUser.wagered < tournament.min_wager) {
        return NextResponse.json({
          success: false,
          message: `@${kickUsername} Entry DENIED - Not enough wager. You need $${tournament.min_wager.toLocaleString()} wagered (you have $${acebetUser.wagered.toLocaleString()}).`,
        });
      }
    }

    // Register player with Acebet data
    const { error: playerError } = await supabase
      .from("tournament_players")
      .insert({
        tournament_id: tournament.id,
        acebet_username: acebetUser?.name || acebetUsername,
        kick_username: kickUsername.toLowerCase(),
        display_name: kickUsername,
        status: "registered",
        acebet_wager: acebetUser?.wagered || 0,
        acebet_active: acebetUser?.active || false,
      });

    if (playerError) {
      console.error("Error registering player:", playerError);
      return NextResponse.json({
        success: false,
        message: `@${kickUsername} Failed to register. Please try again.`,
      });
    }

    // Log the registration
    await supabase.from("tournament_chat_log").insert({
      tournament_id: tournament.id,
      kick_username: kickUsername,
      command: "join",
      message: acebetUsername,
    });

    // Get updated player count
    const { count: newCount } = await supabase
      .from("tournament_players")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", tournament.id);

    return NextResponse.json({
      success: true,
      message: `@${kickUsername} Entry ACCEPTED! You're in ${tournament.name}! (${newCount}/${tournament.max_players} players)`,
    });
  } catch (error) {
    console.error("Error in bot join:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
