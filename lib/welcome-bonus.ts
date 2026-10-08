import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchPlatformWagerRangeTotal } from '@/lib/r2koins/platforms'
import {
  getCurrentRoobetPeriod,
  getCurrentRoobetMonthStartISO,
  getCurrentRoobetRewardsGroupLabel,
} from '@/lib/roobet/period'

export const WELCOME_BONUS_PLATFORM = 'roobet' as const
export const WELCOME_BONUS_WAGER_REQUIRED = 1000
export const WELCOME_BONUS_AMOUNT = 50

export interface WelcomeBonusStatus {
  platform: typeof WELCOME_BONUS_PLATFORM
  periodLabel: string
  wagerRequired: number
  amount: number
  /** Weighted wager this cycle, or null when the live wager lookup failed. */
  wagered: number | null
  wagerError: boolean
  remaining: number
  claimed: boolean
  claimStatus: 'pending' | 'approved' | 'paid' | null
  canRedeem: boolean
}

/** Shared by the status read and the redeem write so both apply the same rules. */
export async function getWelcomeBonusStatus(
  admin: SupabaseClient,
  username: string
): Promise<WelcomeBonusStatus> {
  const periodLabel = `${getCurrentRoobetRewardsGroupLabel()} Welcome Bonus`
  const result = await fetchPlatformWagerRangeTotal(
    WELCOME_BONUS_PLATFORM,
    username,
    getCurrentRoobetMonthStartISO(),
    getCurrentRoobetPeriod().endISO
  )
  const wagered = result === 'not_found' ? 0 : result
  const wagerError = result === null

  const { data: existing } = await admin
    .from('reward_claims')
    .select('status')
    .eq('platform', WELCOME_BONUS_PLATFORM)
    .eq('category', 'welcome_bonus')
    .eq('period_label', periodLabel)
    .ilike('username', username)
    .limit(1)
    .maybeSingle()

  const claimed = Boolean(existing)
  const remaining = wagered === null ? WELCOME_BONUS_WAGER_REQUIRED : Math.max(0, WELCOME_BONUS_WAGER_REQUIRED - wagered)

  return {
    platform: WELCOME_BONUS_PLATFORM,
    periodLabel,
    wagerRequired: WELCOME_BONUS_WAGER_REQUIRED,
    amount: WELCOME_BONUS_AMOUNT,
    wagered,
    wagerError,
    remaining,
    claimed,
    claimStatus: (existing?.status as WelcomeBonusStatus['claimStatus']) ?? null,
    canRedeem: !claimed && wagered !== null && wagered >= WELCOME_BONUS_WAGER_REQUIRED,
  }
}
