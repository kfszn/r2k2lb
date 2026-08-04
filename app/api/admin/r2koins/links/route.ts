import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { fetchPlatformWagerTotal, fetchAcebetByUserId } from "@/lib/r2koins/platforms";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET — list all linked accounts with user + credit info
export async function GET() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("linked_accounts")
    .select(`
      id, kick_user_id, platform, platform_username, linked_by_admin,
      discord_ticket_ref, initial_wager_baseline, linked_at,
      profiles ( kick_username, email ),
      wager_credits ( last_counted_wager, total_coins_awarded, last_synced_at )
    `)
    .order("linked_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ links: data ?? [] });
}

// POST — create a new link (admin only, prompted by Discord ticket)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kick_user_id, platform, platform_username, acebet_id, discord_ticket_ref, linked_by_admin } = body;

    // For AceBet, an AB-<id> may be supplied instead of / alongside a username.
    // The numeric ID is the reliable key and avoids "user not found" from
    // display-name mismatches.
    const acebetIdSuffix =
      platform === "acebet" && acebet_id
        ? String(acebet_id).trim().replace(/^AB-/i, "")
        : "";

    if (!kick_user_id || !platform || (!platform_username && !acebetIdSuffix)) {
      return NextResponse.json(
        { error: "kick_user_id, platform, and either a platform username or AceBet ID are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Verify the site user exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, kick_username")
      .eq("id", kick_user_id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Site user not found" }, { status: 404 });
    }

    // Check for an existing link on this platform
    const { data: existing } = await supabase
      .from("linked_accounts")
      .select("id")
      .eq("kick_user_id", kick_user_id)
      .eq("platform", platform)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `User already has a ${platform} account linked` },
        { status: 409 }
      );
    }

    // Fetch CURRENT lifetime wager from the platform — becomes the baseline.
    // Prefer AceBet ID lookup (reliable) when an AB-<id> was supplied.
    let wagerTotal: number | "not_found" | null;
    let resolvedUsername = platform_username?.trim() ?? "";

    if (acebetIdSuffix) {
      const byId = await fetchAcebetByUserId(acebetIdSuffix);
      if (byId === null) {
        wagerTotal = null;
      } else if (byId === "not_found") {
        wagerTotal = "not_found";
      } else {
        wagerTotal = byId.wagered;
        // Use the platform's real display name; fall back to the ID label.
        resolvedUsername = resolvedUsername || byId.username;
      }
    } else {
      wagerTotal = await fetchPlatformWagerTotal(platform, resolvedUsername);
    }

    if (wagerTotal === null) {
      return NextResponse.json(
        { error: `Failed to reach the ${platform} API. Try again shortly.` },
        { status: 502 }
      );
    }
    if (wagerTotal === "not_found") {
      const label = acebetIdSuffix ? `AB-${acebetIdSuffix}` : `"${resolvedUsername}"`;
      return NextResponse.json(
        { error: `${label} not found under the R2K2 affiliate on ${platform}` },
        { status: 404 }
      );
    }

    // Create the link with the baseline
    const { data: link, error: linkError } = await supabase
      .from("linked_accounts")
      .insert({
        kick_user_id,
        platform,
        platform_username: resolvedUsername || `AB-${acebetIdSuffix}`,
        linked_by_admin: linked_by_admin ?? null,
        discord_ticket_ref: discord_ticket_ref ?? null,
        initial_wager_baseline: wagerTotal,
      })
      .select("id")
      .single();

    if (linkError || !link) {
      return NextResponse.json(
        { error: linkError?.message ?? "Failed to create link" },
        { status: 500 }
      );
    }

    // Mirror baseline into wager_credits
    const { error: creditError } = await supabase.from("wager_credits").insert({
      linked_account_id: link.id,
      last_counted_wager: wagerTotal,
      total_coins_awarded: 0,
    });

    if (creditError) {
      // Roll back the link so we never have a link without a baseline row
      await supabase.from("linked_accounts").delete().eq("id", link.id);
      return NextResponse.json({ error: creditError.message }, { status: 500 });
    }

    // Ensure the user has a balance row
    await supabase
      .from("r2koins_balance")
      .upsert({ kick_user_id }, { onConflict: "kick_user_id", ignoreDuplicates: true });

    return NextResponse.json({
      success: true,
      link_id: link.id,
      baseline: wagerTotal,
    });
  } catch (error) {
    console.error("[v0] Error creating r2koins link:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — remove a link (wager_credits cascades)
export async function DELETE(request: NextRequest) {
  try {
    const { link_id } = await request.json();
    if (!link_id) {
      return NextResponse.json({ error: "link_id is required" }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase.from("linked_accounts").delete().eq("id", link_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
