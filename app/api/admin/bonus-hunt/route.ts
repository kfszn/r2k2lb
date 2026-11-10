import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/staff-auth'
import { parseMoney } from '@/lib/hunt/normalize'
import { findLiveHunt, getHuntDb, loadEntries, loadSettings, resolveHunt, toHuntSummary } from '@/lib/hunt/server'
import { isCurrency, DEFAULT_CURRENCY } from '@/lib/hunt/currency'
import { computeHuntStats } from '@/lib/hunt/stats'

export const dynamic = 'force-dynamic'

const fail = (error: string, status: number) => NextResponse.json({ error }, { status })

function cleanName(value: unknown) {
  if (typeof value !== 'string') return null
  return value.trim().replace(/\s+/g, ' ').slice(0, 60) || null
}

export async function GET(request: NextRequest) {
  if (!getAdminSession(request)) return fail('Unauthorized', 401)

  const db = getHuntDb()
  const [settings, hunt] = await Promise.all([loadSettings(db), resolveHunt(db, request.nextUrl.searchParams.get('hunt'))])
  const entries = hunt ? await loadEntries(db, hunt.id) : []
  const stats = hunt
    ? computeHuntStats(
        hunt.startBalance,
        entries.filter((entry) => !entry.pending)
      )
    : null

  return NextResponse.json({ settings, hunt, entries, stats })
}

export async function POST(request: NextRequest) {
  if (!getAdminSession(request)) return fail('Unauthorized', 401)

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return fail('Invalid request body', 400)

  const db = getHuntDb()

  switch (body.action) {
    case 'start': {
      const startBalance = parseMoney(body.startBalance)
      if (startBalance === null) return fail('Enter a valid start balance.', 400)
      if (await findLiveHunt(db)) return fail('A hunt is already live. End it before starting a new one.', 409)

      let number = Number(body.number)
      if (!Number.isInteger(number) || number < 1) {
        const { data } = await db.from('bonus_hunts').select('number').order('number', { ascending: false }).limit(1).maybeSingle()
        number = (data?.number ?? 0) + 1
      }

      const { data, error } = await db
        .from('bonus_hunts')
        .insert({
          number,
          name: cleanName(body.name),
          currency: isCurrency(body.currency) ? body.currency : DEFAULT_CURRENCY,
          start_balance: startBalance,
          status: 'live',
          started_at: new Date().toISOString(),
        })
        .select('*')
        .single()
      if (error) return fail(error.code === '23505' ? `Hunt #${number} already exists.` : error.message, 400)

      await db.from('bonus_hunt_settings').update({ hunt_on: true, updated_at: new Date().toISOString() }).eq('id', 1)
      return NextResponse.json({ hunt: toHuntSummary(data) })
    }

    case 'end': {
      const live = await findLiveHunt(db)
      if (!live) return fail('There is no live hunt to end.', 409)
      await db.from('bonus_hunts').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', live.id)
      await db.from('bonus_hunt_settings').update({ hunt_on: false, updated_at: new Date().toISOString() }).eq('id', 1)
      return NextResponse.json({ ok: true })
    }

    case 'balance': {
      const startBalance = parseMoney(body.startBalance)
      const hunt = await resolveHunt(db, body.huntId)
      if (startBalance === null || !hunt) return fail('Enter a valid start balance.', 400)
      await db.from('bonus_hunts').update({ start_balance: startBalance }).eq('id', hunt.id)
      return NextResponse.json({ ok: true })
    }

    case 'details': {
      const hunt = await resolveHunt(db, body.huntId)
      if (!hunt) return fail('Hunt not found.', 404)
      const patch: Record<string, unknown> = {}
      if (body.name !== undefined) patch.name = cleanName(body.name)
      if (body.currency !== undefined) {
        if (!isCurrency(body.currency)) return fail('Pick CAD, USD or NZD.', 400)
        patch.currency = body.currency
      }
      const { error } = await db.from('bonus_hunts').update(patch).eq('id', hunt.id)
      if (error) return fail(error.message, 500)
      return NextResponse.json({ ok: true })
    }

    case 'delete': {
      const hunt = await resolveHunt(db, body.huntId)
      if (!hunt) return fail('Hunt not found.', 404)
      if (hunt.status === 'live') return fail('End the hunt before deleting it.', 409)
      const { error } = await db.from('bonus_hunts').delete().eq('id', hunt.id)
      if (error) return fail(error.message, 500)
      return NextResponse.json({ ok: true })
    }

    case 'settings': {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }

      if (typeof body.huntOn === 'boolean') {
        if (body.huntOn && !(await findLiveHunt(db))) return fail('Start a new hunt first, then switch it on.', 409)
        patch.hunt_on = body.huntOn
      }
      if (body.maxCallsPerUser !== undefined) {
        const max = Math.floor(Number(body.maxCallsPerUser))
        if (!Number.isFinite(max) || max < 1 || max > 100) return fail('Max calls per user must be between 1 and 100.', 400)
        patch.max_calls_per_user = max
      }
      if (typeof body.rejectDuplicates === 'boolean') patch.reject_duplicates = body.rejectDuplicates

      const { error } = await db.from('bonus_hunt_settings').update(patch).eq('id', 1)
      if (error) return fail(error.message, 500)
      return NextResponse.json({ settings: await loadSettings(db) })
    }

    default:
      return fail('Unknown action', 400)
  }
}
