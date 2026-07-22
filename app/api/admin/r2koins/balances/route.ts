import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET — every site user with their current R2Koins balance
export async function GET() {
  const supabase = getSupabase();

  const [{ data: profiles, error: profErr }, { data: balances, error: balErr }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, kick_username, email, kick_avatar, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("r2koins_balance").select("kick_user_id, balance, updated_at"),
    ]);

  if (profErr || balErr) {
    return NextResponse.json(
      { error: profErr?.message ?? balErr?.message },
      { status: 500 }
    );
  }

  const balanceMap = new Map(
    (balances ?? []).map((b) => [b.kick_user_id, b])
  );

  const users = (profiles ?? []).map((p) => {
    const bal = balanceMap.get(p.id);
    return {
      id: p.id,
      kick_username: p.kick_username,
      email: p.email,
      kick_avatar: p.kick_avatar,
      balance: Number(bal?.balance ?? 0),
      balance_updated_at: bal?.updated_at ?? null,
    };
  });

  return NextResponse.json({ users });
}
