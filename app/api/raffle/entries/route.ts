import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// ─── In-memory cache to avoid hammering external APIs ───
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ─── Acebet helpers (same logic as /api/leaderboard) ───
const ACEBET_TOKEN = process.env.ACEBET_API_TOKEN ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoicGFzcyIsInNjb3BlIjoiYWZmaWxpYXRlcyIsInVzZXJJZCI6MzU3Mjc3LCJpYXQiOjE3NjY5NTc5MTEsImV4cCI6MTkyNDc0NTkxMX0.s8OUGHAUUSUmpsZJy5NlPjMJvnVqaYixB1J94PZGB7A";
const PACKDRAW_API_KEY = "edadb58b-ea99-4c27-9b91-60b84c095ee9";

function toISODate(d: Date) { return d.toISOString().slice(0, 10); }

function* dateRangeUTC(startISO: string, endISO: string) {
  const start = new Date(`${startISO}T00:00:00Z`);
  const end   = new Date(`${endISO}T00:00:00Z`);
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 86400000)) {
    yield toISODate(d);
  }
}

async function fetchAcebetDay(dayISO: string) {
  const url = `https://api.acebet.com/affiliates/detailed-summary/v2/${dayISO}`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${ACEBET_TOKEN}` },
    cache: 'no-store',
  });
  if (!r.ok) return [];
  const j = await r.json().catch(() => null);
  return Array.isArray(j) ? j : [];
}

async function getAcebetWagers(startDate: string, endDate: string) {
  const users = new Map<number, { name: string; min: number; max: number }>();
  for (const day of dateRangeUTC(startDate, endDate)) {
    const rows = await fetchAcebetDay(day);
    for (const r of rows) {
      const userId = r?.userId;
      if (userId == null) continue;
      const wagered = Number(r?.wagered ?? 0);
      const name = r?.name ?? '';
      const u = users.get(userId) || { name, min: wagered, max: wagered };
      u.min = Math.min(u.min, wagered);
      u.max = Math.max(u.max, wagered);
      u.name = r?.name ?? u.name;
      users.set(userId, u);
    }
  }
  return [...users.values()]
    .map(u => ({ username: u.name, wager_amount: u.max - u.min }))
    .filter(u => u.username && u.wager_amount > 0)
    .sort((a, b) => b.wager_amount - a.wager_amount);
}

async function getPackdrawWagers(startDate: string) {
  const [y, m, d] = startDate.split('-');
  const afterParam = `${parseInt(m)}-${parseInt(d)}-${y}`;
  const url = `https://packdraw.com/api/v1/affiliates/leaderboard?after=${encodeURIComponent(afterParam)}&apiKey=${encodeURIComponent(PACKDRAW_API_KEY)}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => null);
  if (!data) return [];
  const list = data.leaderboard || data.data || (Array.isArray(data) ? data : []);
  return list
    .map((u: any) => ({ username: u.username || u.name || '', wager_amount: u.wagerAmount || u.wagered || 0 }))
    .filter((u: any) => u.username && u.wager_amount > 0)
    .sort((a: any, b: any) => b.wager_amount - a.wager_amount);
}

// ─── Cached fetch: only hit external APIs every 5 min ───
async function getCachedWagers(platform: string, startDate: string, endDate: string) {
  const cacheKey = `${platform}-${startDate}-${endDate}`;
  const cached = cache[cacheKey];

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  let wagers: { username: string; wager_amount: number }[] = [];
  try {
    if (platform === 'acebet') {
      wagers = await getAcebetWagers(startDate, endDate);
    } else if (platform === 'packdraw') {
      wagers = await getPackdrawWagers(startDate);
    }
  } catch (err) {
    console.error(`[v0] Error fetching ${platform} wagers:`, err);
    // Return stale cache if available
    if (cached) return cached.data;
  }

  cache[cacheKey] = { data: wagers, timestamp: Date.now() };
  return wagers;
}

// ─── Main GET handler ───
export async function GET(request: NextRequest) {
  try {
    const platform = request.nextUrl.searchParams.get('platform') || 'acebet';
    const supabase = await createClient();

    // 1. Load config from admin panel
    const { data: configData } = await supabase
      .from('raffle_config')
      .select('*')
      .eq('platform', platform)
      .maybeSingle();

    const minWager    = configData?.min_wager    ?? 50;
    const prizeAmount = configData?.prize_amount ?? 1000;
    const maxEntries  = configData?.max_entries  ?? 10000;
    const startDate   = configData?.start_date   ?? '2026-02-14';
    const endDate     = configData?.end_date     ?? '2026-02-21';

    // 2. Pull wager data (cached, refreshes every 5 min)
    const allWagers = await getCachedWagers(platform, startDate, endDate);

    // 3. Filter by min wager threshold
    const eligible = allWagers
      .filter(u => u.wager_amount >= minWager)
      .slice(0, maxEntries);

    // 4. Sync eligible users to raffle_entries table
    if (eligible.length > 0) {
      const { data: existing } = await supabase
        .from('raffle_entries')
        .select('username')
        .eq('platform', platform)
        .eq('week_start', startDate);

      const existingNames = new Set((existing || []).map(e => e.username));
      const toInsert = eligible.filter(u => !existingNames.has(u.username));

      if (toInsert.length > 0) {
        await supabase.from('raffle_entries').insert(
          toInsert.map(u => ({
            platform,
            username: u.username,
            wager_amount: u.wager_amount,
            week_start: startDate,
            entered: true,
            entry_date: new Date().toISOString(),
          }))
        );
      }

      // Update wager amounts for existing entries
      for (const u of eligible.filter(u => existingNames.has(u.username))) {
        await supabase
          .from('raffle_entries')
          .update({ wager_amount: u.wager_amount })
          .eq('platform', platform)
          .eq('week_start', startDate)
          .eq('username', u.username);
      }
    }

    // 5. Return all entries for this raffle period
    const { data: entries } = await supabase
      .from('raffle_entries')
      .select('*')
      .eq('platform', platform)
      .eq('week_start', startDate)
      .limit(maxEntries);

    return NextResponse.json({
      entries: entries || [],
      count: entries?.length || 0,
      totalPrize: prizeAmount,
      minWager,
      maxEntries,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('[v0] Raffle entries error:', error);
    return NextResponse.json({
      entries: [],
      count: 0,
      totalPrize: 0,
      minWager: 50,
      maxEntries: 10000,
      startDate: '2026-02-14',
      endDate: '2026-02-21',
      error: 'Failed to fetch raffle entries',
    }, { status: 500 });
  }
}
