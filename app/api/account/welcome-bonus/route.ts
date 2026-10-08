import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getWelcomeBonusStatus, WELCOME_BONUS_PLATFORM } from '@/lib/welcome-bonus'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getPlayer() {
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
  if (!session) return { error: 'unauthorized' as const }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: profile, error } = await admin
    .from('profiles')
    .select('roobet_username')
    .eq('id', session.user.id)
    .maybeSingle()

  if (error) return { error: error.message }
  return { admin, username: (profile?.roobet_username as string | null) ?? null }
}

export async function GET() {
  const player = await getPlayer()
  if ('error' in player) {
    return NextResponse.json({ error: player.error }, { status: player.error === 'unauthorized' ? 401 : 500 })
  }
  if (!player.username) return NextResponse.json({ status: null })

  const status = await getWelcomeBonusStatus(player.admin, player.username)
  return NextResponse.json({ status })
}

export async function POST() {
  const player = await getPlayer()
  if ('error' in player) {
    return NextResponse.json({ error: player.error }, { status: player.error === 'unauthorized' ? 401 : 500 })
  }
  if (!player.username) {
    return NextResponse.json({ error: 'Link your Roobet account to redeem the welcome bonus.' }, { status: 400 })
  }

  const status = await getWelcomeBonusStatus(player.admin, player.username)
  if (status.claimed) {
    return NextResponse.json({ error: 'You already redeemed this month\u2019s welcome bonus.' }, { status: 409 })
  }
  if (status.wagerError) {
    return NextResponse.json({ error: 'Couldn\u2019t verify your wager right now. Try again in a moment.' }, { status: 502 })
  }
  if (!status.canRedeem) {
    return NextResponse.json(
      { error: `Wager $${status.remaining.toLocaleString()} more this month to unlock the welcome bonus.` },
      { status: 400 }
    )
  }

  const { data, error } = await player.admin
    .from('reward_claims')
    .insert({
      platform: WELCOME_BONUS_PLATFORM,
      username: player.username,
      category: 'welcome_bonus',
      title: 'Monthly Welcome Bonus',
      amount: status.amount,
      status: 'pending',
      period_label: status.periodLabel,
      notes: `Redeemed by player after $${status.wagerRequired.toLocaleString()} wager.`,
    })
    .select()
    .single()

  if (error) {
    // 23505 = unique violation: a simultaneous request already redeemed this cycle.
    if (error.code === '23505') {
      return NextResponse.json({ error: 'You already redeemed this month\u2019s welcome bonus.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ claim: data }, { status: 201 })
}
