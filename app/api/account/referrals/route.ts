import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { computeReferralPayout, getCurrentReferralPeriod, type Platform } from '@/lib/referrals/compute'

// Never cache — live monthly referral progress must always be fresh.
export const dynamic = 'force-dynamic'
export const revalidate = 0

function mask(username: string): string {
  if (username.length <= 4) return `${username[0] ?? ''}***`
  return `${username.slice(0, 3)}***${username.slice(-3)}`
}

const PLATFORMS: Platform[] = ['roobet', 'luxdrop']

// GET — for the logged-in player as referrer, their referred players
// (masked usernames) and a per-referred-player breakdown of this month's
// raw/capped earnings against the $200-per-referral cap, per platform.
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

  const { data: referralLinks, error: linksError } = await admin
    .from('referrals')
    .select('id')
    .eq('referrer_profile_id', session.user.id)

  if (linksError) return NextResponse.json({ error: linksError.message }, { status: 500 })

  const { periodLabel } = { periodLabel: getCurrentReferralPeriod().label }

  if (!referralLinks || referralLinks.length === 0) {
    return NextResponse.json({
      hasReferrals: false,
      periodLabel,
      platforms: { roobet: null, luxdrop: null },
    })
  }

  const platforms: Record<
    Platform,
    { totalPayout: number; totalReferrals: number; commissionPercent: number; breakdown: { username: string; rawEarnings: number; cappedContribution: number }[] } | null
  > = {
    roobet: null,
    luxdrop: null,
  }

  await Promise.all(
    PLATFORMS.map(async (platform) => {
      const result = await computeReferralPayout(admin, session.user.id, platform)
      platforms[platform] = {
        totalPayout: result.totalPayout,
        totalReferrals: result.breakdown.length,
        commissionPercent: 10,
        breakdown: result.breakdown.map((row) => ({
          username: mask(row.referredUsername),
          rawEarnings: row.rawEarnings,
          cappedContribution: row.cappedContribution,
        })),
      }
    })
  )

  return NextResponse.json({ hasReferrals: true, periodLabel, platforms })
}
