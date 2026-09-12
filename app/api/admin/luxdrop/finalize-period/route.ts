import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { LUXDROP_REWARDS } from '@/lib/luxdrop/leaderboard-rewards'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface LuxdropAffiliateEntry {
  username?: string
  name?: string
  wagered?: number
  wagerAmount?: number
  totalWagered?: number
}

// POST — manually close out a LuxDrop leaderboard period: fetches final
// standings for the given date range, ranks them, and posts a
// reward_claims row (category='leaderboard') for each rank that has a
// prize, matching the automatic Roobet weekly cron's behavior. Since
// LuxDrop has no automated weekly cutover, an admin triggers this once
// a period actually ends.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { startDate, endDate, periodLabel } = body as {
    startDate?: string
    endDate?: string
    periodLabel?: string
  }

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 })
  }
  const label = periodLabel?.trim() || `${startDate} – ${endDate}`

  const affiliatesRes = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/luxdrop/affiliates?startDate=${startDate}&endDate=${endDate}`,
    { cache: 'no-store' }
  )
  if (!affiliatesRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch LuxDrop standings' }, { status: 502 })
  }
  const affiliatesJson = await affiliatesRes.json()
  const raw: LuxdropAffiliateEntry[] = Array.isArray(affiliatesJson) ? affiliatesJson : (affiliatesJson?.data ?? [])

  const entries = raw
    .map((e) => ({
      username: e.username ?? e.name ?? '',
      wagered: e.wagered ?? e.wagerAmount ?? e.totalWagered ?? 0,
    }))
    .filter((e) => e.username)
    .sort((a, b) => b.wagered - a.wagered)

  const supabase = getSupabase()
  const created: { username: string; rank: number; amount: number }[] = []
  const skipped: { username: string; rank: number; reason: string }[] = []

  for (let i = 0; i < entries.length && i < LUXDROP_REWARDS.length; i++) {
    const rank = i + 1
    const amount = LUXDROP_REWARDS[i]
    if (!amount) continue
    const { username } = entries[i]

    const { data: existing } = await supabase
      .from('reward_claims')
      .select('id')
      .eq('platform', 'luxdrop')
      .eq('username', username)
      .eq('category', 'leaderboard')
      .eq('period_label', label)
      .maybeSingle()

    if (existing) {
      skipped.push({ username, rank, reason: 'already posted for this period' })
      continue
    }

    const { error } = await supabase.from('reward_claims').insert({
      platform: 'luxdrop',
      username,
      category: 'leaderboard',
      title: `Monthly Leaderboard — Rank #${rank}`,
      amount,
      status: 'pending',
      period_label: label,
    })

    if (error) {
      skipped.push({ username, rank, reason: error.message })
      continue
    }
    created.push({ username, rank, amount })
  }

  return NextResponse.json({ created, skipped })
}
