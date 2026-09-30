import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { computeReferralAvailable, getCurrentReferralPeriod, type Platform } from '@/lib/referrals/compute'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const PLATFORMS: Platform[] = ['roobet', 'luxdrop']

interface CreatedRow {
  referrerUsername: string
  platform: Platform
  amount: number
}
interface SkippedRow {
  referrerUsername: string
  platform: Platform
  reason: string
}

// POST — one-click monthly referral payout run. For every distinct
// referrer, computes their available referral payout per platform (each
// referred player's contribution already capped at $200/mo individually)
// and posts a 'referral' reward_claims row. Idempotent per
// (platform, username, 'referral', periodLabel) — re-running mid-month
// tops up rather than double-pays, matching computeReferralAvailable's
// already-posted subtraction.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const periodLabelOverride: string | undefined = body?.periodLabel

  const admin = getSupabase()
  const period = getCurrentReferralPeriod()
  const periodLabel = periodLabelOverride?.trim() || period.label

  const { data: referrers, error } = await admin
    .from('referrals')
    .select('referrer:referrer_profile_id(id, roobet_username, luxdrop_username)')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const seen = new Map<string, { id: string; roobet_username: string | null; luxdrop_username: string | null }>()
  for (const row of referrers ?? []) {
    const referrer = (row as unknown as { referrer: { id: string; roobet_username: string | null; luxdrop_username: string | null } | null }).referrer
    if (referrer) seen.set(referrer.id, referrer)
  }

  const created: CreatedRow[] = []
  const skipped: SkippedRow[] = []

  for (const referrer of seen.values()) {
    for (const platform of PLATFORMS) {
      const username = platform === 'roobet' ? referrer.roobet_username : referrer.luxdrop_username
      if (!username) {
        skipped.push({ referrerUsername: referrer.roobet_username ?? referrer.luxdrop_username ?? referrer.id, platform, reason: `no linked ${platform} username` })
        continue
      }

      try {
        const result = await computeReferralAvailable(admin, username, platform)
        if (!result || result.available <= 0) {
          skipped.push({ referrerUsername: username, platform, reason: result ? 'no available payout this period' : 'profile not found' })
          continue
        }

        const noteLines = result.breakdown
          .filter((r) => r.cappedContribution > 0)
          .map((r) => `${r.referredUsername}: $${r.rawEarnings.toFixed(2)} wagered rewards -> $${r.cappedContribution.toFixed(2)} (capped at $200)`)

        const { error: insertError } = await admin.from('reward_claims').insert({
          platform,
          username,
          category: 'referral',
          title: `Referral Bonus — ${periodLabel}`,
          amount: result.available,
          status: 'pending',
          period_label: periodLabel,
          notes: noteLines.join('\n'),
        })

        if (insertError) {
          skipped.push({ referrerUsername: username, platform, reason: insertError.message })
          continue
        }

        created.push({ referrerUsername: username, platform, amount: result.available })
      } catch (err) {
        skipped.push({ referrerUsername: username, platform, reason: err instanceof Error ? err.message : 'unknown error' })
      }
    }
  }

  return NextResponse.json({ created, skipped, periodLabel })
}
