import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { computeWagerAvailability } from '@/lib/milestones/wager-availability'

// GET — given a platform + username, compute how much Wager Milestone money
// they're currently eligible for vs. how much they've already been paid, so
// admins see the true remaining "available" balance (e.g. eligible $300,
// already claimed $150 -> $150 available) instead of re-paying the full tier.
// The math lives in lib/milestones/wager-availability so the player's account
// panel shows exactly the same numbers.
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

  const availability = await computeWagerAvailability(admin, platform, username, req.nextUrl.origin)
  if (!availability) {
    return NextResponse.json({ error: 'Could not fetch live wager data right now. Try again shortly.' }, { status: 502 })
  }

  return NextResponse.json(availability)
}
