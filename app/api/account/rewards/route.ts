import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { fetchPlatformWagerRangeTotal } from '@/lib/r2koins/platforms'
import { getCurrentRoobetPeriod, getCurrentRoobetMonthStartISO } from '@/lib/roobet/period'
import { CURRENT_LUXDROP_PERIOD } from '@/lib/luxdrop/period'

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
  wagerTotal: number | null
  wagerTotalError: boolean
  tiers: TierRow[]
  currentTier: TierRow | null
  nextTier: TierRow | null
  amountToNextTier: number | null
  periodLabel: string
}

async function buildPlatformProgress(
  platform: 'roobet' | 'luxdrop',
  username: string,
  tiers: TierRow[]
): Promise<PlatformProgress> {
  let startISO: string
  let endISO: string
  let periodLabel: string

  if (platform === 'roobet') {
    const period = getCurrentRoobetPeriod()
    startISO = getCurrentRoobetMonthStartISO()
    endISO = period.endISO
    periodLabel = `${period.endDate.slice(0, 7)} monthly wager`
  } else {
    startISO = `${CURRENT_LUXDROP_PERIOD.startDate}T00:00:00.000Z`
    endISO = CURRENT_LUXDROP_PERIOD.endISO
    periodLabel = 'Current LuxDrop leaderboard'
  }

  const result = await fetchPlatformWagerRangeTotal(platform, username, startISO, endISO)
  const wagerTotal = result === 'not_found' ? 0 : result === null ? null : result
  const wagerTotalError = result === null

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
    tiers: platformTiers,
    currentTier,
    nextTier,
    amountToNextTier,
    periodLabel,
  }
}

export async function GET() {
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

  const progress: { roobet: PlatformProgress | null; luxdrop: PlatformProgress | null } = {
    roobet: null,
    luxdrop: null,
  }

  const progressPromises: Promise<void>[] = []
  if (roobetUsername) {
    progressPromises.push(
      buildPlatformProgress('roobet', roobetUsername, tiers).then((p) => {
        progress.roobet = p
      })
    )
  }
  if (luxdropUsername) {
    progressPromises.push(
      buildPlatformProgress('luxdrop', luxdropUsername, tiers).then((p) => {
        progress.luxdrop = p
      })
    )
  }
  await Promise.all(progressPromises)

  return NextResponse.json({ claims, progress })
}
