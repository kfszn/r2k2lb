import { getMilestoneWindow, fetchWindowedWager } from '@/lib/milestones/progress'
import { computeEligible, getRateCutoverISO, cutoverFallsInWindow } from '@/lib/milestones/rate-cutover'

// Single source of truth for "how much wager-milestone money does this player
// have eligible / claimed / available right now". Both the admin eligibility
// lookup and the player's account rewards panel call this, so the number an
// admin sees when posting a claim is always the number the player sees.

interface AdminReader {
  from: (table: string) => any
}

export interface WagerAvailability {
  wagered: number
  eligibleTotal: number
  /** Approved + paid wager-milestone claims posted inside this month's window. */
  claimedTotal: number
  available: number
  tierLabel: string | null
  wagerAtCutover: number
  cutoverAt: string | null
}

export async function computeWagerAvailability(
  admin: AdminReader,
  platform: 'roobet' | 'luxdrop',
  username: string,
  origin: string
): Promise<WagerAvailability | null> {
  const window = getMilestoneWindow(platform, 'rewards')

  const cutoverISO = await getRateCutoverISO(admin, platform)
  const measureCutover = cutoverFallsInWindow(cutoverISO, window.start, window.end)

  const [wagerResult, cutoverWagerResult, tiersRes, claimsRes] = await Promise.all([
    fetchWindowedWager(platform, { username }, origin, window),
    measureCutover
      ? fetchWindowedWager(platform, { username }, origin, { start: window.start, end: cutoverISO! })
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

  if (wagerResult === null || cutoverWagerResult === null) return null

  const wagerAtCutover = cutoverWagerResult === 'not_found' ? 0 : cutoverWagerResult
  const wagered = wagerResult === 'not_found' ? 0 : wagerResult
  const tiers = (tiersRes.data ?? []) as { tier_name: string; wager_threshold: number | string; reward_amount: number | string; legacy_reward_amount: number | string | null }[]
  const claimedTotal = ((claimsRes.data ?? []) as { amount: number | string }[]).reduce((sum, c) => sum + (Number(c.amount) || 0), 0)

  // Tiers are checkpoints on a continuous reward curve, NOT discrete steps.
  const eligibleTotal = computeEligible(tiers, wagered, wagerAtCutover)

  let tierLabel: string | null = null
  for (const t of tiers) {
    if (wagered >= Number(t.wager_threshold)) tierLabel = t.tier_name
  }

  return {
    wagered,
    eligibleTotal,
    claimedTotal,
    available: Math.max(0, eligibleTotal - claimedTotal),
    tierLabel,
    wagerAtCutover,
    cutoverAt: measureCutover ? cutoverISO : null,
  }
}
