import { createApiClient } from "@/lib/supabase/api";
import { NextRequest, NextResponse } from "next/server";

// GET endpoint for Botrix $(customapi) calls
// URL: /api/botrix/slot?kick=KICKUSER&slot=SLOTNAME&type=super
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const kickUsername = searchParams.get("kick");
    const slotName = searchParams.get("slot");
    const slotType = searchParams.get("type")?.toLowerCase();

    if (!kickUsername || !slotName || !slotType) {
      return new NextResponse("Usage: !slot SlotName super/regular", { status: 200 });
    }

    if (slotType !== "super" && slotType !== "regular") {
      return new NextResponse(`@${kickUsername} Type must be "super" or "regular"`, { status: 200 });
    }

    const supabase = createApiClient();

    // Get active tournament
    const { data: tournament } = await supabase
      .from("tournaments")
      .select("id")
      .eq("status", "live")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!tournament) {
      return new NextResponse(`@${kickUsername} No tournament is currently live.`, { status: 200 });
    }

    // Find player (case insensitive)
    const { data: player } = await supabase
      .from("tournament_players")
      .select("id")
      .eq("tournament_id", tournament.id)
      .ilike("kick_username", kickUsername)
      .maybeSingle();

    if (!player) {
      return new NextResponse(`@${kickUsername} You're not registered in this tournament.`, { status: 200 });
    }

    // Find active match for this player
    const { data: match } = await supabase
      .from("bracket_matches")
      .select("*")
      .eq("tournament_id", tournament.id)
      .eq("status", "in_progress")
      .or(`player1_id.eq.${player.id},player2_id.eq.${player.id}`)
      .maybeSingle();

    if (!match) {
      return new NextResponse(`@${kickUsername} You don't have an active match right now.`, { status: 200 });
    }

    // Update slot info for the player
    const isPlayer1 = match.player1_id === player.id;
    const updateData = isPlayer1
      ? { player1_slot_name: slotName, player1_slot_type: slotType }
      : { player2_slot_name: slotName, player2_slot_type: slotType };

    const { error } = await supabase
      .from("bracket_matches")
      .update(updateData)
      .eq("id", match.id);

    if (error) {
      return new NextResponse(`@${kickUsername} Error saving slot. Try again.`, { status: 200 });
    }

    return new NextResponse(`@${kickUsername} Slot call recorded: ${slotName} (${slotType})`, { status: 200 });
  } catch (error) {
    console.error("Botrix slot error:", error);
    return new NextResponse("Error processing slot call. Try again.", { status: 200 });
  }
}
