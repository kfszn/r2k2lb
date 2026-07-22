import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST — manually adjust a user's R2Koins balance.
// body: { kick_user_id, amount, mode: "add" | "set" }
//   add  → delta = amount (can be negative to subtract)
//   set  → delta = amount - currentBalance
export async function POST(request: NextRequest) {
  try {
    const { kick_user_id, amount, mode = "add" } = await request.json();

    if (!kick_user_id) {
      return NextResponse.json({ error: "kick_user_id is required" }, { status: 400 });
    }
    const value = Number(amount);
    if (!Number.isFinite(value)) {
      return NextResponse.json({ error: "amount must be a number" }, { status: 400 });
    }

    const supabase = getSupabase();

    // Verify the user exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", kick_user_id)
      .maybeSingle();
    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Resolve the delta to apply
    let delta = value;
    if (mode === "set") {
      const { data: bal } = await supabase
        .from("r2koins_balance")
        .select("balance")
        .eq("kick_user_id", kick_user_id)
        .maybeSingle();
      delta = value - Number(bal?.balance ?? 0);
    }

    if (delta === 0) {
      const { data: bal } = await supabase
        .from("r2koins_balance")
        .select("balance")
        .eq("kick_user_id", kick_user_id)
        .maybeSingle();
      return NextResponse.json({ success: true, balance: Number(bal?.balance ?? 0) });
    }

    // Atomic, overdraft-guarded mutation
    const { data: newBalance, error: rpcError } = await supabase.rpc("adjust_r2koins", {
      p_user: kick_user_id,
      p_delta: delta,
    });

    if (rpcError) {
      const msg = rpcError.message?.includes("INSUFFICIENT_FUNDS")
        ? "That would put the balance below zero."
        : rpcError.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Log the manual adjustment for auditing
    await supabase.from("coin_award_log").insert({
      kick_user_id,
      coins_awarded: delta,
      wager_delta: 0,
      platform: "manual",
    });

    return NextResponse.json({ success: true, balance: Number(newBalance) });
  } catch (error) {
    console.error("[v0] Error adjusting r2koins:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
