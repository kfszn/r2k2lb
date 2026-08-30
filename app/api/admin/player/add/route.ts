import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchRoobetUserList } from "@/lib/r2koins/platforms";

interface RoobetUser {
  name: string;
  wagered: number;
  active: boolean;
}

// Cache the affiliate list for 5 minutes
let cachedUsers: RoobetUser[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000;

async function fetchRoobetUsers(): Promise<RoobetUser[]> {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedUsers && now - cacheTimestamp < CACHE_DURATION) {
    return cachedUsers;
  }

  const entries = await fetchRoobetUserList();
  if (entries === null) {
    console.error("[v0] Failed to fetch Roobet affiliate list");
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

async function validateRoobetUser(username: string) {
  try {
    const users = await fetchRoobetUsers();

    const user = users.find(
      (u) => u.name && u.name.toLowerCase() === username.toLowerCase()
    );

    if (!user) {
      return { valid: false, user: null, error: `User "${username}" not found under R2K2 affiliate` };
    }

    return { valid: true, user };
  } catch (error) {
    console.error("[v0] Error validating user:", error instanceof Error ? error.message : error);
    return { valid: false, user: null, error: "Validation error" };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, roobetUsername, kickUsername } = body;

    // At least one username must be provided
    if (!tournamentId || (!roobetUsername && !kickUsername)) {
      return NextResponse.json(
        { error: "At least one username (Roobet or Kick) is required" },
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

    // Check if player already registered
    const { data: existingPlayer, error: checkError } = await supabase
      .from("tournament_players")
      .select("id")
      .eq("tournament_id", tournamentId)
      .or(`roobet_username.eq.${roobetUsername?.toLowerCase() || ''}, kick_username.eq.${kickUsername?.toLowerCase() || ''}`)
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

    // If Roobet username provided, validate and get stats
    let roobetStats = { wagered: 0, active: false };
    let roobetValidated = false;

    if (roobetUsername) {
      const { valid: isValid, user: roobetUser, error: validationError } = await validateRoobetUser(roobetUsername);
      if (!isValid) {
        return NextResponse.json(
          { error: `Invalid Roobet username - ${validationError || "user not found under R2K2 affiliate"}` },
          { status: 400 }
        );
      }
      roobetStats = {
        wagered: roobetUser?.wagered || 0,
        active: roobetUser?.active || false,
      };
      roobetValidated = true;
    }

    // Add player
    const { data: player, error: playerError } = await supabase
      .from("tournament_players")
      .insert({
        tournament_id: tournamentId,
        roobet_username: roobetUsername ? roobetUsername.toLowerCase() : null,
        kick_username: kickUsername?.toLowerCase() || roobetUsername?.toLowerCase(),
        display_name: kickUsername || roobetUsername,
        status: "registered",
        roobet_wager: roobetStats.wagered,
        roobet_active: roobetStats.active,
        roobet_validated: roobetValidated,
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
