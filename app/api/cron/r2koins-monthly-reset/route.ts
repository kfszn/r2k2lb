import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const nowIso = new Date().toISOString();
  const results = { expired_users: 0, total_expired: 0, failed: [] as string[] };

  // All users with a positive balance
  const { data: balances, error } = await supabase
    .from("r2koins_balance")
    .select("kick_user_id, balance")
    .gt("balance", 0);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!balances || balances.length === 0) {
    return NextResponse.json({ message: "No balances to reset", ...results });
  }

  // IMPORTANT: only the spendable balance resets.
  // wager_credits.last_counted_wager is NEVER touched here — it must stay
  // cumulative against the platform's lifetime wager total, or the next
  // daily sync would massively over-award coins.
  for (const row of balances) {
    try {
      const amount = Number(row.balance);

      // 1. Log the expiration
      const { error: logError } = await supabase.from("r2koins_expired_log").insert({
        kick_user_id: row.kick_user_id,
        expired_amount: amount,
        expired_at: nowIso,
      });
      if (logError) {
        results.failed.push(`${row.kick_user_id} (log: ${logError.message})`);
        continue;
      }

      // 2. Zero the balance
      const { error: resetError } = await supabase
        .from("r2koins_balance")
        .update({ balance: 0, updated_at: nowIso })
        .eq("kick_user_id", row.kick_user_id);
      if (resetError) {
        results.failed.push(`${row.kick_user_id} (reset: ${resetError.message})`);
        continue;
      }

      results.expired_users++;
      results.total_expired += amount;
    } catch (err) {
      results.failed.push(
        `${row.kick_user_id} (${err instanceof Error ? err.message : "unknown error"})`
      );
    }
  }

  return NextResponse.json(results);
}
