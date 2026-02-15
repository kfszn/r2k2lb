import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, status } = body;

    if (!tournamentId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const validStatuses = ["REGISTERING", "LIVE", "CLOSED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // If marking as LIVE or REGISTERING, set is_current to true and clear other tournaments
    if (["LIVE", "REGISTERING"].includes(status)) {
      // Clear is_current from all other tournaments
      await supabase
        .from("tournaments")
        .update({ is_current: false })
        .neq("id", tournamentId);
      
      // Set this tournament as current
      const { data: tournament, error } = await supabase
        .from("tournaments")
        .update({ status, is_current: true })
        .eq("id", tournamentId)
        .select()
        .single();

      if (error) {
        console.error("Error updating tournament status:", error);
        return NextResponse.json(
          { error: "Failed to update tournament status" },
          { status: 500 }
        );
      }

      return NextResponse.json({ tournament });
    }

    // For CLOSED status, just update status and clear is_current
    const { data: tournament, error } = await supabase
      .from("tournaments")
      .update({ status, is_current: false })
      .eq("id", tournamentId)
      .select()
      .single();

    if (error) {
      console.error("Error updating tournament status:", error);
      return NextResponse.json(
        { error: "Failed to update tournament status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ tournament });
  } catch (error) {
    console.error("Error in update status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
