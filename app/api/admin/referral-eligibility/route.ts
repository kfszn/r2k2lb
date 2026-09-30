import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { computeReferralAvailable } from '@/lib/referrals/compute'

// GET — given a referrer's platform username, compute their referral payout
// eligibility for the current calendar month: a per-referred-player
// breakdown (each capped at $200/mo), the summed total, what's already been
// posted, and what's still available. Mirrors wager-bonus-eligibility's
// shape so the admin New Claim modal can reuse the same box layout.
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

  try {
    const result = await computeReferralAvailable(admin, username, platform)
    if (!result) {
      return NextResponse.json({ error: 'No player found with that username on this platform.' }, { status: 404 })
    }
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Lookup failed' }, { status: 500 })
  }
}
