import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET — list all platform rates
export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("platform_rates")
    .select("platform, coins_per_dollar, updated_at")
    .order("platform");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ rates: data ?? [] });
}

// PATCH — update a platform's rate (no redeploy needed)
export async function PATCH(request: NextRequest) {
  try {
    const { platform, coins_per_dollar } = await request.json();

    if (!platform || coins_per_dollar === undefined || coins_per_dollar === null) {
      return NextResponse.json(
        { error: "platform and coins_per_dollar are required" },
        { status: 400 }
      );
    }

    const rate = Number(coins_per_dollar);
    if (!Number.isFinite(rate) || rate < 0) {
      return NextResponse.json(
        { error: "coins_per_dollar must be a non-negative number" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from("platform_rates")
      .update({ coins_per_dollar: rate, updated_at: new Date().toISOString() })
      .eq("platform", platform);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
