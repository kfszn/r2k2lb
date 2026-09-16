import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getMilestoneWindow, fetchWindowedWager } from '@/lib/milestones/progress'

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

  const [wagerResult, tiersRes, claimsRes] = await Promise.all([
    fetchWindowedWager(platform, { username }, req.nextUrl.origin, window),
    admin
      .from('wager_milestone_tiers')
      .select('tier_name, wager_threshold, reward_amount, sort_order')
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

  if (wagerResult === null) {
    return NextResponse.json({ error: 'Could not fetch live wager data right now. Try again shortly.' }, { status: 502 })
  }

  const wagered = wagerResult === 'not_found' ? 0 : wagerResult
  const tiers = tiersRes.data ?? []
  const claimedTotal = (claimsRes.data ?? []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0)

  // Tiers are checkpoints on a continuous reward curve (e.g. $50 per $10,000
  // wagered), NOT discrete steps that only pay out once fully crossed. A
  // player between two checkpoints — e.g. $193k wagered, between the $150k
  // ($750) and $200k ($1,000) checkpoints — should be credited the linearly
  // interpolated amount ($965), not snapped down to the last checkpoint they
  // fully cleared ($750). Below the first checkpoint we interpolate from the
  // origin (0, 0); above the last checkpoint we extrapolate using the slope
  // of the final segment so the curve keeps scaling past the top tier.
  let eligibleTotal = 0
  let tierLabel: string | null = null
  if (tiers.length > 0) {
    const points = [{ wager_threshold: 0, reward_amount: 0, tier_name: null as string | null }, ...tiers]

    let lower = points[0]
    let upper = points[points.length - 1]
    for (let i = 0; i < points.length - 1; i++) {
      if (wagered >= Number(points[i].wager_threshold)) {
        lower = points[i]
        upper = points[i + 1]
      }
    }

    const lowerWager = Number(lower.wager_threshold)
    const upperWager = Number(upper.wager_threshold)
    const lowerReward = Number(lower.reward_amount)
    const upperReward = Number(upper.reward_amount)

    if (upperWager > lowerWager) {
      const rate = (upperReward - lowerReward) / (upperWager - lowerWager)
      eligibleTotal = Math.max(0, lowerReward + (wagered - lowerWager) * rate)
    } else {
      eligibleTotal = lowerReward
    }

    // Label shows the highest checkpoint actually reached.
    for (const t of tiers) {
      if (wagered >= Number(t.wager_threshold)) tierLabel = t.tier_name
    }
  }

  const available = Math.max(0, eligibleTotal - claimedTotal)

  return NextResponse.json({ wagered, eligibleTotal, claimedTotal, available, tierLabel })
}
