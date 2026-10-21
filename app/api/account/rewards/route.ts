import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { fetchPlatformWagerRangeTotal } from '@/lib/r2koins/platforms'
import { getCurrentRoobetRewardsGroupLabel } from '@/lib/roobet/period'
import { computeWagerAvailability } from '@/lib/milestones/wager-availability'

// Never cache — claim history and live wager progress must always be fresh.
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface TierRow {
  id: string
  platform: 'roobet' | 'luxdrop'
  tier_name: string
  wager_threshold: number
  reward_amount: number
  sort_order: number
  active: boolean
}

interface PlatformProgress {
  username: string
  /** This cycle's (calendar month, for Roobet) weighted wager total — the amount eligible for claim. */
  wagerTotal: number | null
  wagerTotalError: boolean
  /** Every weighted wager this player has ever recorded on this platform. */
  allTimeWager: number | null
  tiers: TierRow[]
  currentTier: TierRow | null
  nextTier: TierRow | null
  amountToNextTier: number | null
  periodLabel: string
  /** Total wager-milestone money the player has earned so far this cycle (same math as the admin lookup). */
  monthEligible: number
  /** Approved + paid wager-milestone claims posted this cycle ("Current Month Claim"). */
  monthClaimed: number
  /** What can still be claimed right now ("Currently Available"): eligible minus claimed. */
  monthAvailable: number
  /** Sum of all paid/approved wager-milestone claims ever recorded for this platform. */
  allTimeReward: number
}

async function buildPlatformProgress(
  platform: 'roobet' | 'luxdrop',
  username: string,
  tiers: TierRow[],
  allTimeReward: number,
  allTimeWager: number | null,
  admin: SupabaseClient,
  origin: string
): Promise<PlatformProgress> {
  const periodLabel =
    platform === 'roobet' ? `${getCurrentRoobetRewardsGroupLabel()} monthly wager` : 'Current LuxDrop leaderboard'

  // Same helper the admin eligibility lookup uses, so wager, window, eligible
  // and claimed amounts always match what the admin sees when posting a claim.
  const availability = await computeWagerAvailability(admin, platform, username, origin)
  const wagerTotal = availability ? availability.wagered : null
  const wagerTotalError = availability === null

  const platformTiers = tiers
    .filter((t) => t.platform === platform && t.active)
    .sort((a, b) => a.sort_order - b.sort_order)

  let currentTier: TierRow | null = null
  let nextTier: TierRow | null = null
  if (wagerTotal !== null) {
    for (const tier of platformTiers) {
      if (wagerTotal >= tier.wager_threshold) {
        currentTier = tier
      } else {
        nextTier = tier
        break
      }
    }
  }

  const amountToNextTier = wagerTotal !== null && nextTier ? Math.max(0, nextTier.wager_threshold - wagerTotal) : null

  return {
    username,
    wagerTotal,
    wagerTotalError,
    allTimeWager,
    tiers: platformTiers,
    currentTier,
    nextTier,
    amountToNextTier,
    periodLabel,
    monthEligible: availability?.eligibleTotal ?? 0,
    monthClaimed: availability?.claimedTotal ?? 0,
    monthAvailable: availability?.available ?? 0,
    allTimeReward,
  }
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('roobet_username, luxdrop_username')
    .eq('id', session.user.id)
    .maybeSingle()

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  const roobetUsername: string | null = profile?.roobet_username ?? null
  const luxdropUsername: string | null = profile?.luxdrop_username ?? null

  const { data: tiersData, error: tiersError } = await admin
    .from('wager_milestone_tiers')
    .select('*')
    .order('platform')
    .order('sort_order')

  if (tiersError) return NextResponse.json({ error: tiersError.message }, { status: 500 })
  const tiers = (tiersData ?? []) as TierRow[]

  // Pull claim history for whichever platform usernames are currently linked.
  const usernameFilters: string[] = []
  if (roobetUsername) usernameFilters.push(`and(platform.eq.roobet,username.ilike.${roobetUsername})`)
  if (luxdropUsername) usernameFilters.push(`and(platform.eq.luxdrop,username.ilike.${luxdropUsername})`)

  let claims: unknown[] = []
  if (usernameFilters.length > 0) {
    const { data: claimsData, error: claimsError } = await admin
      .from('reward_claims')
      .select('*')
      .or(usernameFilters.join(','))
      .order('created_at', { ascending: false })

    if (claimsError) return NextResponse.json({ error: claimsError.message }, { status: 500 })
    claims = claimsData ?? []
  }

  // Sum every approved/paid wager-milestone claim ever recorded per platform
  // — the "all time" total. Pending claims are excluded, matching how the
  // admin eligibility lookup counts what has actually been claimed.
  const allTimeRewardByPlatform: Record<'roobet' | 'luxdrop', number> = { roobet: 0, luxdrop: 0 }
  for (const claim of claims as { platform: 'roobet' | 'luxdrop'; category: string; status: string; amount: number }[]) {
    if (claim.category === 'wager_milestone' && (claim.status === 'approved' || claim.status === 'paid')) {
      allTimeRewardByPlatform[claim.platform] += Number(claim.amount) || 0
    }
  }

  // Aggregate totals across every claim ever recorded for this player's
  // linked usernames — powers the "Rewards Summary" panel on the account page.
  const aggregates = { earned: 0, paidOut: 0, claimable: 0, pending: 0 }
  for (const claim of claims as { status: 'pending' | 'approved' | 'paid'; amount: number }[]) {
    const amount = Number(claim.amount) || 0
    aggregates.earned += amount
    if (claim.status === 'paid') aggregates.paidOut += amount
    else if (claim.status === 'approved') aggregates.claimable += amount
    else if (claim.status === 'pending') aggregates.pending += amount
  }

  // All-time wager total across every platform the player has linked —
  // reuses the same fetch helper as milestone progress, just without a
  // start bound, so it sums every wager ever recorded for that username.
  const allTimeWagerByPlatform: Record<'roobet' | 'luxdrop', number | null> = { roobet: null, luxdrop: null }
  const allTimeWagerPromises: Promise<void>[] = []
  if (roobetUsername) {
    allTimeWagerPromises.push(
      fetchPlatformWagerRangeTotal('roobet', roobetUsername, '2000-01-01T00:00:00.000Z', new Date().toISOString()).then((r) => {
        allTimeWagerByPlatform.roobet = r === 'not_found' ? 0 : r
      })
    )
  }
  if (luxdropUsername) {
    allTimeWagerPromises.push(
      fetchPlatformWagerRangeTotal('luxdrop', luxdropUsername, '2000-01-01T00:00:00.000Z', new Date().toISOString()).then((r) => {
        allTimeWagerByPlatform.luxdrop = r === 'not_found' ? 0 : r
      })
    )
  }
  await Promise.all(allTimeWagerPromises)

  const progress: { roobet: PlatformProgress | null; luxdrop: PlatformProgress | null } = {
    roobet: null,
    luxdrop: null,
  }

  const progressPromises: Promise<void>[] = []
  if (roobetUsername) {
    progressPromises.push(
      buildPlatformProgress('roobet', roobetUsername, tiers, allTimeRewardByPlatform.roobet, allTimeWagerByPlatform.roobet, admin, req.nextUrl.origin).then((p) => {
        progress.roobet = p
      })
    )
  }
  if (luxdropUsername) {
    progressPromises.push(
      buildPlatformProgress('luxdrop', luxdropUsername, tiers, allTimeRewardByPlatform.luxdrop, allTimeWagerByPlatform.luxdrop, admin, req.nextUrl.origin).then((p) => {
        progress.luxdrop = p
      })
    )
  }
  await Promise.all(progressPromises)

  return NextResponse.json({ claims, progress, aggregates, allTimeWagerByPlatform })
}
