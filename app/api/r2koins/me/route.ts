import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Returns the signed-in user's R2Koins balance, linked platforms,
// and expiration history. RLS restricts rows to the user's own.
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [balanceRes, linksRes, expiredRes] = await Promise.all([
    supabase
      .from("r2koins_balance")
      .select("balance, updated_at")
      .eq("kick_user_id", user.id)
      .maybeSingle(),
    supabase
      .from("linked_accounts")
      .select("platform, platform_username, linked_at")
      .eq("kick_user_id", user.id),
    supabase
      .from("r2koins_expired_log")
      .select("expired_amount, expired_at")
      .eq("kick_user_id", user.id)
      .order("expired_at", { ascending: false })
      .limit(12),
  ]);

  return NextResponse.json({
    balance: Number(balanceRes.data?.balance ?? 0),
    links: linksRes.data ?? [],
    expirations: expiredRes.data ?? [],
  });
}
