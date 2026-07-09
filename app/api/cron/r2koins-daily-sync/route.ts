import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { fetchAcebetUserList, fetchLuxdropUserList } from "@/lib/r2koins/platforms";

export const maxDuration = 300;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface LinkRow {
  id: string;
  kick_user_id: string;
  platform: string;
  platform_username: string;
  wager_credits: {
    last_counted_wager: number;
    total_coins_awarded: number;
  } | null;
}

export async function GET(request: NextRequest) {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const results = { synced: 0, awarded: 0, skipped: 0, failed: [] as string[] };

  // Load all links with their credit baselines
  const { data: links, error: linksError } = await supabase
    .from("linked_accounts")
    .select(`
      id, kick_user_id, platform, platform_username,
      wager_credits ( last_counted_wager, total_coins_awarded )
    `);

  if (linksError) {
    return NextResponse.json({ error: linksError.message }, { status: 500 });
  }
  if (!links || links.length === 0) {
    return NextResponse.json({ message: "No linked accounts to sync", ...results });
  }

  // Load conversion rates
  const { data: rates } = await supabase
    .from("platform_rates")
    .select("platform, coins_per_dollar");
  const rateMap = new Map<string, number>(
    (rates ?? []).map((r) => [r.platform, Number(r.coins_per_dollar)])
  );

  // Fetch each platform's user list ONCE (not per user) to minimize API calls
  const platforms = [...new Set(links.map((l) => l.platform))];
  const platformData = new Map<string, Map<string, number> | null>();

  for (const platform of platforms) {
    if (platform === "acebet") {
      const users = await fetchAcebetUserList();
      platformData.set(
        platform,
        users === null
          ? null
          : new Map(users.filter((u) => u.name).map((u) => [u.name.toLowerCase(), Number(u.wagered) || 0]))
      );
    } else if (platform === "luxdrop") {
      const entries = await fetchLuxdropUserList();
      platformData.set(
        platform,
        entries === null
          ? null
          : new Map(
              entries
                .filter((e) => e.username ?? e.name)
                .map((e) => [
                  String(e.username ?? e.name).toLowerCase(),
                  // LuxDrop wagered is in cents — convert to dollars
                  Number(e.wagered ?? e.wagerAmount ?? e.totalWagered ?? 0) / 100,
                ])
            )
      );
    } else {
      platformData.set(platform, null);
    }
  }

  const nowIso = new Date().toISOString();

  // Process each link independently — one failure never stops the job
  for (const link of links as unknown as LinkRow[]) {
    try {
      const userMap = platformData.get(link.platform);

      if (userMap === null || userMap === undefined) {
        // Platform API failed entirely — log and skip, do NOT touch baselines
        results.failed.push(`${link.platform}:${link.platform_username} (platform API unavailable)`);
        continue;
      }

      const currentWager = userMap.get(link.platform_username.toLowerCase());

      if (currentWager === undefined) {
        // User missing from affiliate list this cycle — skip, keep baseline
        results.failed.push(`${link.platform}:${link.platform_username} (not in affiliate list)`);
        continue;
      }

      const credits = link.wager_credits;
      const lastCounted = Number(credits?.last_counted_wager ?? 0);
      const rate = rateMap.get(link.platform) ?? 0;

      // Negative deltas (refunds, corrections, API glitches) are treated as 0 —
      // never subtract coins from a user's balance
      const newWager = Math.max(0, currentWager - lastCounted);
      const coinsToAward = Math.round(newWager * rate);

      if (coinsToAward > 0) {
        // 1. Increment balance
        const { data: balRow } = await supabase
          .from("r2koins_balance")
          .select("balance")
          .eq("kick_user_id", link.kick_user_id)
          .maybeSingle();

        const newBalance = Number(balRow?.balance ?? 0) + coinsToAward;
        await supabase
          .from("r2koins_balance")
          .upsert({ kick_user_id: link.kick_user_id, balance: newBalance, updated_at: nowIso });

        // 2. Advance baseline + lifetime total
        await supabase
          .from("wager_credits")
          .update({
            last_counted_wager: currentWager,
            total_coins_awarded: Number(credits?.total_coins_awarded ?? 0) + coinsToAward,
            last_synced_at: nowIso,
          })
          .eq("linked_account_id", link.id);

        // 3. Audit trail
        await supabase.from("coin_award_log").insert({
          kick_user_id: link.kick_user_id,
          platform: link.platform,
          wager_delta: newWager,
          coins_awarded: coinsToAward,
        });

        results.awarded += coinsToAward;
      } else {
        // No coins this cycle — still stamp the sync time
        await supabase
          .from("wager_credits")
          .update({ last_synced_at: nowIso })
          .eq("linked_account_id", link.id);
        results.skipped++;
      }

      results.synced++;
    } catch (error) {
      results.failed.push(
        `${link.platform}:${link.platform_username} (${error instanceof Error ? error.message : "unknown error"})`
      );
    }
  }

  return NextResponse.json(results);
}
