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
    const { tournamentId, acebetUsername, kickUsername } = body;

    if (!tournamentId || !acebetUsername) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check tournament exists and is in registration
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("id", tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    if (tournament.status !== "registration") {
      return NextResponse.json(
        { error: "Tournament is not accepting registrations" },
        { status: 400 }
      );
    }

    // Check if tournament is full
    const { count } = await supabase
      .from("tournament_players")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", tournamentId);

    if (count !== null && count >= tournament.max_players) {
      return NextResponse.json(
        { error: "Tournament is full" },
        { status: 400 }
      );
    }

    // Check if player already registered
    const { data: existingPlayer } = await supabase
      .from("tournament_players")
      .select("id")
      .eq("tournament_id", tournamentId)
      .eq("acebet_username", acebetUsername.toLowerCase())
      .single();

    if (existingPlayer) {
      return NextResponse.json(
        { error: "Player already registered" },
        { status: 400 }
      );
    }

    // Validate Acebet username (optional based on token availability)
    const { valid: isValid } = await validateAcebetUser(acebetUsername);
    if (!isValid && ACEBET_TOKEN) {
      return NextResponse.json(
        { error: "Invalid Acebet username - user not found under R2K2 affiliate" },
        { status: 400 }
      );
    }

    // Add player
    const { data: player, error: playerError } = await supabase
      .from("tournament_players")
      .insert({
        tournament_id: tournamentId,
        acebet_username: acebetUsername.toLowerCase(),
        kick_username: kickUsername || acebetUsername,
        display_name: kickUsername || acebetUsername,
        status: "registered",
      })
      .select()
      .single();

    if (playerError) {
      console.error("Error adding player:", playerError);
      return NextResponse.json(
        { error: "Failed to add player" },
        { status: 500 }
      );
    }

    return NextResponse.json({ player });
  } catch (error) {
    console.error("Error in add player:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
