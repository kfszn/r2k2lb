import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchRoobetUserList } from "@/lib/r2koins/platforms";

async function validateRoobetUser(username: string) {
  try {
    const entries = await fetchRoobetUserList();
    if (entries === null) {
      return { valid: false, user: null, error: "Validation service unavailable" };
    }

    const uname = username.toLowerCase();
    const entry = entries.find((e) => {
      const name = e.username ?? e.name;
      return name && name.toLowerCase() === uname;
    });

    if (!entry) {
      console.log("[v0] Roobet user not found under affiliate code:", username);
      return { valid: false, user: null, error: "Not under code R2K2. Sign up at roobet.com with code R2K2!" };
    }

    const wagered = Number(entry.weightedWagered ?? entry.wagered ?? entry.wagerAmount ?? entry.totalWagered ?? 0) || 0;
    console.log("[v0] User validated:", entry.username ?? entry.name, "wagered:", wagered);
    return { valid: true, user: { name: entry.username ?? entry.name ?? username, wagered, active: wagered > 0 } };
  } catch (error) {
    console.error("[v0] Error calling validation API:", error instanceof Error ? error.message : error);
    return { valid: false, user: null, error: "Validation service unavailable" };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kickUsername, roobetUsername, botSecret } = body;

    // Validate bot secret (optional security measure)
    if (process.env.BOT_SECRET && botSecret !== process.env.BOT_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!kickUsername || !roobetUsername) {
      return NextResponse.json(
        { 
          success: false,
          message: "Usage: !enter <roobet_username>" 
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find the current tournament that is explicitly set to registration
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("status", "registration")
      .eq("is_current", true)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json({
        success: false,
        message: "No tournament is currently open for registration.",
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

    // Check if player already registered (by Kick or Roobet username)
    const { data: existingPlayer } = await supabase
      .from("tournament_players")
      .select("id")
      .eq("tournament_id", tournament.id)
      .or(`roobet_username.eq.${roobetUsername.toLowerCase()},kick_username.eq.${kickUsername.toLowerCase()}`)
      .single();

    if (existingPlayer) {
      return NextResponse.json({
        success: false,
        message: `@${kickUsername} You're already registered for this tournament!`,
      });
    }

    // Validate Roobet username against the affiliate list
    console.log("[v0] Validating player:", roobetUsername);
    const { valid: isValid, user: roobetUser, error: validationError } = await validateRoobetUser(roobetUsername);

    if (!isValid) {
      console.log("[v0] Validation failed:", validationError);
      return NextResponse.json({
        success: false,
        message: `@${kickUsername} Entry DENIED - ${validationError || "Not under code R2K2. Sign up at roobet.com with code R2K2!"}`,
      });
    }

    console.log("[v0] Player validated successfully");

    // Check active requirement if needed
    if (tournament.require_active && roobetUser && !roobetUser.active) {
      console.log("[v0] Player rejected - not active:", kickUsername);
      return NextResponse.json({
        success: false,
        message: `@${kickUsername} Entry DENIED - You must be active under code R2K2 to enter.`,
      });
    }

    // Check minimum wager requirement if needed
    if (tournament.min_wager && roobetUser && roobetUser.wagered < tournament.min_wager) {
      console.log("[v0] Player rejected - insufficient wager:", kickUsername);
      return NextResponse.json({
        success: false,
        message: `@${kickUsername} Entry DENIED - Not enough wager. You need $${tournament.min_wager.toLocaleString()} wagered (you have $${roobetUser.wagered.toLocaleString()}).`,
      });
    }

    // Register player with Roobet data
    const { error: playerError } = await supabase
      .from("tournament_players")
      .insert({
        tournament_id: tournament.id,
        roobet_username: roobetUser?.name || roobetUsername,
        kick_username: kickUsername.toLowerCase(),
        display_name: kickUsername,
        status: "registered",
        roobet_wager: roobetUser?.wagered || 0,
        roobet_active: roobetUser?.active || false,
      });

    if (playerError) {
      console.error("[v0] Error registering player:", playerError);
      return NextResponse.json({
        success: false,
        message: `@${kickUsername} Failed to register. Please try again.`,
      });
    }

    console.log("[v0] Player registered successfully:", kickUsername);

    // Log the registration
    await supabase.from("tournament_chat_log").insert({
      tournament_id: tournament.id,
      kick_username: kickUsername,
      command: "join",
      message: roobetUsername,
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
