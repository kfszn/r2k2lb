import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/staff-auth'
import { normalizeSlotName, parseMoney } from '@/lib/hunt/normalize'
import { findSlotImages, getHuntDb, nextPosition, resolveHunt, type HuntDb } from '@/lib/hunt/server'

export const dynamic = 'force-dynamic'

const fail = (error: string, status: number) => NextResponse.json({ error }, { status })
const STATUSES = ['called', 'bought', 'opened']

function cleanGame(value: unknown) {
  if (typeof value !== 'string') return null
  const game = value.trim().replace(/\s+/g, ' ').slice(0, 100)
  return game || null
}

async function renumber(db: HuntDb, huntId: string) {
  const { data } = await db
    .from('bonus_hunt_entries')
    .select('id, position')
    .eq('hunt_id', huntId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })
  await Promise.all(
    (data ?? []).map((row, index) =>
      row.position === index + 1 ? null : db.from('bonus_hunt_entries').update({ position: index + 1 }).eq('id', row.id)
    )
  )
}

export async function POST(request: NextRequest) {
  if (!getAdminSession(request)) return fail('Unauthorized', 401)
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return fail('Invalid request body', 400)

  const game = cleanGame(body.game)
  if (!game) return fail('Enter a game name.', 400)

  const betSize = body.betSize === undefined || body.betSize === '' ? 0 : parseMoney(body.betSize)
  if (betSize === null) return fail('Enter a valid bet size.', 400)

  const payout = body.payout === undefined || body.payout === null || body.payout === '' ? null : parseMoney(body.payout)
  if (body.payout !== undefined && body.payout !== null && body.payout !== '' && payout === null) {
    return fail('Enter a valid payout.', 400)
  }

  const db = getHuntDb()
  const hunt = await resolveHunt(db, body.huntId)
  if (!hunt) return fail('Start a hunt first.', 409)

  const known = (await findSlotImages(db, [game])).get(normalizeSlotName(game))

  const { error } = await db.from('bonus_hunt_entries').insert({
    hunt_id: hunt.id,
    position: await nextPosition(db, hunt.id),
    game_name: known?.displayName ?? game,
    game_image_url: known?.imageUrl ?? null,
    bet_size: betSize,
    payout,
    called_by: null,
    status: payout === null ? 'called' : 'opened',
  })
  if (error) return fail(error.message, 500)
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest) {
  if (!getAdminSession(request)) return fail('Unauthorized', 401)
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body || typeof body.id !== 'string') return fail('Invalid request body', 400)

  const db = getHuntDb()
  const { data: current } = await db.from('bonus_hunt_entries').select('*').eq('id', body.id).maybeSingle()
  if (!current) return fail('Entry not found.', 404)

  const patch: Record<string, unknown> = {}
  let payout: number | null = current.payout === null ? null : Number(current.payout)
  let status: string = current.status

  if (body.game !== undefined) {
    const game = cleanGame(body.game)
    if (!game) return fail('Game name cannot be empty.', 400)
    patch.game_name = game
  }

  if (body.betSize !== undefined) {
    const betSize = parseMoney(body.betSize === '' ? 0 : body.betSize)
    if (betSize === null) return fail('Enter a valid bet size.', 400)
    patch.bet_size = betSize
  }

  if (body.payout !== undefined) {
    if (body.payout === null || body.payout === '') {
      payout = null
      if (body.status === undefined && status === 'opened') status = 'bought'
    } else {
      const parsed = parseMoney(body.payout)
      if (parsed === null) return fail('Enter a valid payout.', 400)
      payout = parsed
      if (body.status === undefined) status = 'opened'
    }
  }

  if (body.status !== undefined) {
    if (typeof body.status !== 'string' || !STATUSES.includes(body.status)) return fail('Invalid status.', 400)
    status = body.status
    if (status !== 'opened' && body.payout === undefined) payout = null
  }

  if (status === 'opened' && payout === null) return fail('Enter a payout before marking this bonus as opened.', 400)
  if (status !== 'opened') payout = null

  patch.status = status
  patch.payout = payout

  const { error } = await db.from('bonus_hunt_entries').update(patch).eq('id', body.id)
  if (error) return fail(error.message, 500)
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  if (!getAdminSession(request)) return fail('Unauthorized', 401)
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return fail('Missing id', 400)

  const db = getHuntDb()
  const { data: entry } = await db.from('bonus_hunt_entries').select('hunt_id').eq('id', id).maybeSingle()
  if (!entry) return fail('Entry not found.', 404)

  const { error } = await db.from('bonus_hunt_entries').delete().eq('id', id)
  if (error) return fail(error.message, 500)
  await renumber(db, entry.hunt_id)
  return NextResponse.json({ ok: true })
}

// Reorder: the client sends the full list of entry ids in the new order.
export async function PUT(request: NextRequest) {
  if (!getAdminSession(request)) return fail('Unauthorized', 401)
  const body = (await request.json().catch(() => null)) as { ids?: unknown; huntId?: unknown } | null
  const ids = Array.isArray(body?.ids) ? (body.ids as unknown[]).filter((v): v is string => typeof v === 'string') : []
  if (ids.length === 0) return fail('Invalid request body', 400)

  const db = getHuntDb()
  const hunt = await resolveHunt(db, body?.huntId)
  if (!hunt) return fail('No hunt found.', 409)

  const { data } = await db.from('bonus_hunt_entries').select('id').eq('hunt_id', hunt.id)
  const existing = new Set((data ?? []).map((row) => row.id))
  if (existing.size !== ids.length || ids.some((id) => !existing.has(id))) {
    return fail('The entry list changed, refresh and try again.', 409)
  }

  await Promise.all(ids.map((id, index) => db.from('bonus_hunt_entries').update({ position: index + 1 }).eq('id', id)))
  return NextResponse.json({ ok: true })
}
