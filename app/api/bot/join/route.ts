import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function validateAcebetUser(username: string) {
  try {
    const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/acebet/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    console.log("[v0] Validation API response status:", response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.log("[v0] Validation API error:", error);
      return { valid: false, user: null, error: error.message };
    }

    const data = await response.json();
    console.log("[v0] User validated:", data.user?.name, "active:", data.user?.active);
    return { valid: true, user: data.user };
  } catch (error) {
    console.error("[v0] Error calling validation API:", error instanceof Error ? error.message : error);
    return { valid: false, user: null, error: "Validation service unavailable" };
  }
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

    // Validate Acebet username using validation endpoint
    console.log("[v0] Validating player:", acebetUsername);
    const { valid: isValid, user: acebetUser, error: validationError } = await validateAcebetUser(acebetUsername);

    if (!isValid) {
      console.log("[v0] Validation failed:", validationError);
      return NextResponse.json({
        success: false,
        message: `@${kickUsername} Entry DENIED - ${validationError || "Not under code R2K2. Sign up at acebet.com with code R2K2!"}`,
      });
    }

    console.log("[v0] Player validated successfully");

    // Check active requirement if needed
    if (tournament.require_active && acebetUser && !acebetUser.active) {
      console.log("[v0] Player rejected - not active:", kickUsername);
      return NextResponse.json({
        success: false,
        message: `@${kickUsername} Entry DENIED - You must be active under code R2K2 to enter.`,
      });
    }

    // Check minimum wager requirement if needed
    if (tournament.min_wager && acebetUser && acebetUser.wagered < tournament.min_wager) {
      console.log("[v0] Player rejected - insufficient wager:", kickUsername);
      return NextResponse.json({
        success: false,
        message: `@${kickUsername} Entry DENIED - Not enough wager. You need $${tournament.min_wager.toLocaleString()} wagered (you have $${acebetUser.wagered.toLocaleString()}).`,
      });
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
