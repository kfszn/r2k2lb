import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getMilestoneWindow, fetchWindowedWager } from '@/lib/milestones/progress'
import { computeEligible, getRateCutoverISO, cutoverFallsInWindow } from '@/lib/milestones/rate-cutover'

// GET — given a platform + username, compute how much Wager Milestone money
// they're currently eligible for vs. how much they've already been paid, so
// admins see the true remaining "available" balance (e.g. eligible $300,
// already claimed $150 -> $150 available) instead of re-paying the full tier.
export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username')?.trim()
  const platform = req.nextUrl.searchParams.get('platform')?.trim()

  if (!username) {
    return NextResponse.json({ error: 'username is required' }, { status: 400 })
  }
  if (platform !== 'roobet' && platform !== 'luxdrop') {
    return NextResponse.json({ error: 'platform must be roobet or luxdrop' }, { status: 400 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const window = getMilestoneWindow(platform, 'rewards')

  const cutoverISO = await getRateCutoverISO(admin, platform)
  const measureCutover = cutoverFallsInWindow(cutoverISO, window.start, window.end)

  const [wagerResult, cutoverWagerResult, tiersRes, claimsRes] = await Promise.all([
    fetchWindowedWager(platform, { username }, req.nextUrl.origin, window),
    measureCutover
      ? fetchWindowedWager(platform, { username }, req.nextUrl.origin, { start: window.start, end: cutoverISO! })
      : Promise.resolve(0 as number | 'not_found' | null),
    admin
      .from('wager_milestone_tiers')
      .select('tier_name, wager_threshold, reward_amount, legacy_reward_amount, sort_order')
      .eq('platform', platform)
      .eq('active', true)
      .order('sort_order', { ascending: true }),
    admin
      .from('reward_claims')
      .select('amount')
      .eq('platform', platform)
      .eq('category', 'wager_milestone')
      .ilike('username', username)
      .in('status', ['approved', 'paid'])
      .gte('created_at', window.start.includes('T') ? window.start : `${window.start}T00:00:00.000Z`)
      .lte('created_at', window.end.includes('T') ? window.end : `${window.end}T23:59:59.999Z`),
  ])

  if (wagerResult === null || cutoverWagerResult === null) {
    return NextResponse.json({ error: 'Could not fetch live wager data right now. Try again shortly.' }, { status: 502 })
  }
  const wagerAtCutover = cutoverWagerResult === 'not_found' ? 0 : cutoverWagerResult

  const wagered = wagerResult === 'not_found' ? 0 : wagerResult
  const tiers = tiersRes.data ?? []
  const claimedTotal = (claimsRes.data ?? []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0)

  // Tiers are checkpoints on a continuous reward curve, NOT discrete steps.
  // computeEligible interpolates between checkpoints and, when a rate change
  // happened mid-cycle, pays the frozen legacy rate up to the cutover wager
  // and the new rate only on wager after it (see lib/milestones/rate-cutover).
  const eligibleTotal = computeEligible(tiers, wagered, wagerAtCutover)

  let tierLabel: string | null = null
  for (const t of tiers) {
    if (wagered >= Number(t.wager_threshold)) tierLabel = t.tier_name
  }

  const available = Math.max(0, eligibleTotal - claimedTotal)

  return NextResponse.json({ wagered, eligibleTotal, claimedTotal, available, tierLabel, wagerAtCutover, cutoverAt: measureCutover ? cutoverISO : null })
}
