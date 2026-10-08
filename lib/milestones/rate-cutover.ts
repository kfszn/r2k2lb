// Wager milestone rate changes (e.g. Roobet $50 -> $75 per $10k).
//
// Tiers are checkpoints on a continuous reward curve. When the rate changes we
// keep the old payouts frozen in `legacy_reward_amount` and record the instant
// of the change in `wager_milestone_rate_cutovers`. A player's eligible amount
// is then:
//
//   legacy curve at the wager they had at the cutover
//   + new curve value of everything wagered since (new(now) - new(at cutover))
//
// Old claims are never touched, and nobody is double-paid or retro-topped-up.

export interface RateTier {
  tier_name?: string | null
  wager_threshold: number | string
  reward_amount: number | string
  legacy_reward_amount?: number | string | null
}

type RewardPicker = (t: RateTier) => number

// Piecewise-linear interpolation through (0,0) and every tier checkpoint,
// extrapolating with the final segment's slope above the top tier.
function curveValue(tiers: RateTier[], wagered: number, pick: RewardPicker): number {
  if (tiers.length === 0 || wagered <= 0) return 0

  const points = [{ wager: 0, reward: 0 }, ...tiers.map((t) => ({ wager: Number(t.wager_threshold), reward: pick(t) }))]

  let lower = points[0]
  let upper = points[points.length - 1]
  for (let i = 0; i < points.length - 1; i++) {
    if (wagered >= points[i].wager) {
      lower = points[i]
      upper = points[i + 1]
    }
  }

  if (upper.wager > lower.wager) {
    const rate = (upper.reward - lower.reward) / (upper.wager - lower.wager)
    return Math.max(0, lower.reward + (wagered - lower.wager) * rate)
  }
  return lower.reward
}

const currentReward: RewardPicker = (t) => Number(t.reward_amount) || 0
const legacyReward: RewardPicker = (t) =>
  t.legacy_reward_amount != null ? Number(t.legacy_reward_amount) || 0 : Number(t.reward_amount) || 0

/**
 * Total eligible for `wagered` this cycle. `wagerAtCutover` is how much the
 * player had wagered in this same cycle at the instant the rate changed
 * (0 when the cycle started after the cutover, so only the new rate applies).
 */
export function computeEligible(tiers: RateTier[], wagered: number, wagerAtCutover = 0): number {
  const cut = Math.min(Math.max(0, wagerAtCutover), Math.max(0, wagered))
  const legacyAtCut = curveValue(tiers, cut, legacyReward)
  const newNow = curveValue(tiers, wagered, currentReward)
  const newAtCut = curveValue(tiers, cut, currentReward)
  return Math.max(0, legacyAtCut + newNow - newAtCut)
}

interface CutoverReader {
  from: (table: string) => any
}

/** Returns the platform's rate-change instant as an ISO string, or null if none is configured. */
export async function getRateCutoverISO(client: CutoverReader, platform: string): Promise<string | null> {
  const { data } = await client
    .from('wager_milestone_rate_cutovers')
    .select('cutover_at')
    .eq('platform', platform)
    .maybeSingle()
  if (!data?.cutover_at) return null
  return new Date(data.cutover_at).toISOString()
}

/**
 * True when the cutover happened inside the cycle window, i.e. the player's
 * pre-cutover wager needs to be measured. Cycles starting after the cutover
 * simply use the new rate.
 */
export function cutoverFallsInWindow(cutoverISO: string | null, windowStart: string, windowEnd: string): cutoverISO is string {
  if (!cutoverISO) return false
  const toMs = (s: string) => new Date(s.includes('T') ? s : `${s}T00:00:00.000Z`).getTime()
  const cut = new Date(cutoverISO).getTime()
  return cut > toMs(windowStart) && cut < toMs(windowEnd)
}
