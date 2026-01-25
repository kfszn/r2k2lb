import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

// Cache the user list for 5 minutes
let cachedUsers: AcebetUser[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000;

// Start date for counting wagers: 12/26/2025 EST (12am UTC)
const WAGER_WINDOW_START = "2025-12-26";

async function fetchAcebetUsers(): Promise<AcebetUser[]> {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedUsers && now - cacheTimestamp < CACHE_DURATION) {
    console.log("[v0] Returning cached Acebet users");
    return cachedUsers;
  }

  if (!ACEBET_TOKEN) {
    console.error("[v0] ACEBET_API_TOKEN not configured");
    return [];
  }

  try {
    // Use the wager window start date to get cumulative wager data
    const url = `https://api.acebet.com/affiliates/detailed-summary/v2/${WAGER_WINDOW_START}`;

    console.log("[v0] Fetching Acebet users from:", url);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${ACEBET_TOKEN}`,
      },
      cache: "no-store",
    });

    console.log("[v0] Acebet API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("[v0] Acebet API error:", response.status, errorText);
      return cachedUsers || [];
    }

    const data = await response.json().catch(() => null);
    console.log("[v0] Acebet API response - data type:", typeof data, "is array:", Array.isArray(data));

    cachedUsers = Array.isArray(data) ? data : [];
    cacheTimestamp = now;

    console.log("[v0] Cached", cachedUsers.length, "Acebet users");
    return cachedUsers;
  } catch (error) {
    console.error("[v0] Error fetching Acebet users:", error instanceof Error ? error.message : error);
    return cachedUsers || [];
  }
}

async function validateAcebetUser(username: string) {
  try {
    console.log("[v0] Validating Acebet username:", username);

    const users = await fetchAcebetUsers();
    console.log("[v0] Total users available:", users.length);

    const user = users.find(
      (u) => u.name && u.name.toLowerCase() === username.toLowerCase()
    );

    if (!user) {
      console.log("[v0] User not found:", username);
      return { valid: false, user: null, error: `User "${username}" not found under R2K2 affiliate` };
    }

    console.log("[v0] User found:", user.name, "active:", user.active);
    return { valid: true, user };
  } catch (error) {
    console.error("[v0] Error validating user:", error instanceof Error ? error.message : error);
    return { valid: false, user: null, error: "Validation error" };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, acebetUsername, kickUsername } = body;

    // At least one username must be provided
    if (!tournamentId || (!acebetUsername && !kickUsername)) {
      return NextResponse.json(
        { error: "At least one username (Acebet or Kick) is required" },
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

    if (!["pending", "registration"].includes(tournament.status)) {
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

    // Use Acebet username as unique identifier if provided, otherwise Kick username
    const uniqueIdentifier = acebetUsername || kickUsername;

    // Check if player already registered
    const { data: existingPlayer, error: checkError } = await supabase
      .from("tournament_players")
      .select("id")
      .eq("tournament_id", tournamentId)
      .or(`acebet_username.eq.${acebetUsername?.toLowerCase() || ''}, kick_username.eq.${kickUsername?.toLowerCase() || ''}`)
      .maybeSingle();

    if (checkError) {
      console.error("[v0] Error checking existing player:", checkError);
    }

    if (existingPlayer) {
      return NextResponse.json(
        { error: "Player already registered" },
        { status: 400 }
      );
    }

    // If Acebet username provided, validate and get stats
    let acebetStats = { wagered: 0, active: false };
    let aceValidated = false;

    if (acebetUsername) {
      const { valid: isValid, user: acebetUser, error: validationError } = await validateAcebetUser(acebetUsername);
      if (!isValid) {
        return NextResponse.json(
          { error: `Invalid Acebet username - ${validationError || "user not found under R2K2 affiliate"}` },
          { status: 400 }
        );
      }
      acebetStats = {
        wagered: acebetUser?.wagered || 0,
        active: acebetUser?.active || false,
      };
      aceValidated = true;
    }

    // Add player
    const { data: player, error: playerError } = await supabase
      .from("tournament_players")
      .insert({
        tournament_id: tournamentId,
        acebet_username: acebetUsername ? acebetUsername.toLowerCase() : null,
        kick_username: kickUsername?.toLowerCase() || acebetUsername?.toLowerCase(),
        display_name: kickUsername || acebetUsername,
        status: "registered",
        acebet_wager: acebetStats.wagered,
        acebet_active: acebetStats.active,
        acebet_validated: aceValidated,
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
