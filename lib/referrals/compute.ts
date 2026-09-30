import type { SupabaseClient } from '@supabase/supabase-js'

export type Platform = 'roobet' | 'luxdrop'

const REFERRAL_RATE = 0.1
const REFERRAL_CAP_PER_REFERRAL = 200

/** Plain calendar month (UTC) — independent of Roobet's custom weekly-group cycle. */
export function getCurrentReferralPeriod(): { start: Date; end: Date; label: string } {
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0))
  const label = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  return { start, end: now, label }
}

export interface ReferralBreakdownRow {
  referredProfileId: string
  referredUsername: string
  rawEarnings: number
  cappedContribution: number
}

export interface ReferralPayoutResult {
  breakdown: ReferralBreakdownRow[]
  totalPayout: number
  periodLabel: string
}

function usernameColumn(platform: Platform) {
  return platform === 'roobet' ? 'roobet_username' : 'luxdrop_username'
}

/**
 * Sums, per referred player, that single player's wager-milestone rewards
 * (approved/paid) this calendar month on `platform`, takes 10% of that,
 * applies the $200/mo cap PER REFERRED PLAYER, then sums the capped
 * contributions across every player the referrer has referred. The returned
 * totalPayout is NOT capped again at the referrer level — a referrer with 3
 * active referrals can earn up to $600/mo from a single platform.
 */
export async function computeReferralPayout(
  admin: SupabaseClient,
  referrerProfileId: string,
  platform: Platform
): Promise<ReferralPayoutResult> {
  const { start, label } = getCurrentReferralPeriod()

  const { data: links, error: linksError } = await admin
    .from('referrals')
    .select('referred_profile_id, profiles:referred_profile_id(id, roobet_username, luxdrop_username)')
    .eq('referrer_profile_id', referrerProfileId)

  if (linksError) throw new Error(linksError.message)

  const col = usernameColumn(platform)
  const breakdown: ReferralBreakdownRow[] = []

  for (const link of links ?? []) {
    const referredProfile = (link as unknown as { profiles: { id: string; roobet_username: string | null; luxdrop_username: string | null } | null }).profiles
    const referredUsername = referredProfile?.[col as 'roobet_username' | 'luxdrop_username'] ?? null
    if (!referredProfile || !referredUsername) continue

    const { data: claims, error: claimsError } = await admin
      .from('reward_claims')
      .select('amount')
      .eq('platform', platform)
      .eq('category', 'wager_milestone')
      .ilike('username', referredUsername)
      .in('status', ['approved', 'paid'])
      .gte('created_at', start.toISOString())

    if (claimsError) throw new Error(claimsError.message)

    const rawEarnings = (claims ?? []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
    const cappedContribution = Math.min(rawEarnings * REFERRAL_RATE, REFERRAL_CAP_PER_REFERRAL)

    breakdown.push({
      referredProfileId: referredProfile.id,
      referredUsername,
      rawEarnings,
      cappedContribution,
    })
  }

  const totalPayout = breakdown.reduce((sum, row) => sum + row.cappedContribution, 0)

  return { breakdown, totalPayout, periodLabel: label }
}

export interface ReferralAvailableResult extends ReferralPayoutResult {
  alreadyPosted: number
  available: number
  referrerProfileId: string
}

/**
 * Resolves a referrer by their platform username, computes this month's
 * payout (per-referred-player breakdown, each capped at $200), then
 * subtracts whatever has already been posted as a 'referral' claim for
 * that username/platform/period so re-running finalize tops up rather than
 * double-pays.
 */
export async function computeReferralAvailable(
  admin: SupabaseClient,
  referrerUsername: string,
  platform: Platform
): Promise<ReferralAvailableResult | null> {
  const col = usernameColumn(platform)
  const { data: referrerProfile, error: profileError } = await admin
    .from('profiles')
    .select('id')
    .ilike(col, referrerUsername)
    .maybeSingle()

  if (profileError) throw new Error(profileError.message)
  if (!referrerProfile) return null

  const payout = await computeReferralPayout(admin, referrerProfile.id, platform)

  const { data: postedClaims, error: postedError } = await admin
    .from('reward_claims')
    .select('amount')
    .eq('platform', platform)
    .eq('category', 'referral')
    .ilike('username', referrerUsername)
    .eq('period_label', payout.periodLabel)
    .in('status', ['approved', 'paid'])

  if (postedError) throw new Error(postedError.message)

  const alreadyPosted = (postedClaims ?? []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
  const available = Math.max(0, payout.totalPayout - alreadyPosted)

  return { ...payout, alreadyPosted, available, referrerProfileId: referrerProfile.id }
}
