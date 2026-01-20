import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kickUsername, slotName, slotType, botSecret } = body;

    // Validate bot secret (optional security measure)
    if (process.env.BOT_SECRET && botSecret !== process.env.BOT_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!kickUsername || !slotName || !slotType) {
      return NextResponse.json(
        { 
          success: false,
          message: "Usage: !slot <slot name> <super/regular>" 
        },
        { status: 400 }
      );
    }

    // Validate slot type
    const normalizedSlotType = slotType.toLowerCase();
    if (normalizedSlotType !== "super" && normalizedSlotType !== "regular") {
      return NextResponse.json({
        success: false,
        message: `@${kickUsername} Invalid slot type. Use "super" or "regular".`,
      });
    }

    const supabase = await createClient();

    // Find active tournament (in progress)
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("id, name")
      .eq("status", "in_progress")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json({
        success: false,
        message: `@${kickUsername} No tournament is currently live.`,
      });
    }

    // Find the player by kick username
    const { data: player, error: playerError } = await supabase
      .from("tournament_players")
      .select("id, acebet_username, status")
      .eq("tournament_id", tournament.id)
      .eq("kick_username", kickUsername.toLowerCase())
      .single();

    if (playerError || !player) {
      return NextResponse.json({
        success: false,
        message: `@${kickUsername} You're not registered in this tournament.`,
      });
    }

    if (player.status === "eliminated") {
      return NextResponse.json({
        success: false,
        message: `@${kickUsername} You've been eliminated from the tournament.`,
      });
    }

    // Find the player's current match (in_progress or pending where they are player1 or player2)
    const { data: currentMatch, error: matchError } = await supabase
      .from("bracket_matches")
      .select("*")
      .eq("tournament_id", tournament.id)
      .in("status", ["pending", "in_progress"])
      .or(`player1_id.eq.${player.id},player2_id.eq.${player.id}`)
      .order("round", { ascending: true })
      .limit(1)
      .single();

    if (matchError || !currentMatch) {
      return NextResponse.json({
        success: false,
        message: `@${kickUsername} You don't have an active match right now.`,
      });
    }

    // Determine if player is player1 or player2 in the match
    const isPlayer1 = currentMatch.player1_id === player.id;
    const slotColumn = isPlayer1 ? "player1_slot_name" : "player2_slot_name";
    const typeColumn = isPlayer1 ? "player1_slot_type" : "player2_slot_type";

    // Update the match with the slot call
    const { error: updateError } = await supabase
      .from("bracket_matches")
      .update({
        [slotColumn]: slotName,
        [typeColumn]: normalizedSlotType,
      })
      .eq("id", currentMatch.id);

    if (updateError) {
      console.error("Error updating slot call:", updateError);
      return NextResponse.json({
        success: false,
        message: `@${kickUsername} Failed to submit slot call. Please try again.`,
      });
    }

    // Also update the player's current slot preference
    await supabase
      .from("tournament_players")
      .update({
        slot_name: slotName,
        slot_type: normalizedSlotType,
      })
      .eq("id", player.id);

    // Log the slot call
    await supabase.from("tournament_chat_log").insert({
      tournament_id: tournament.id,
      kick_username: kickUsername,
      command: "slot",
      message: `${slotName} ${normalizedSlotType}`,
    });

    return NextResponse.json({
      success: true,
      message: `@${kickUsername} Slot call recorded: ${slotName} (${normalizedSlotType})`,
    });
  } catch (error) {
    console.error("Error in bot slot:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
