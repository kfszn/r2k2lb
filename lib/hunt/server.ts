import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { normalizeSlotName } from '@/lib/hunt/normalize'
import type { EntryStatus, HuntEntry, HuntSettings, HuntStatus, HuntSummary } from '@/lib/hunt/stats'

export function getHuntDb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export type HuntDb = ReturnType<typeof getHuntDb>

interface HuntRow {
  id: string
  number: number
  status: HuntStatus
  start_balance: number | string
  started_at: string | null
  ended_at: string | null
}

interface EntryRow {
  id: string
  position: number
  game_name: string
  game_image_url: string | null
  bet_size: number | string
  payout: number | string | null
  called_by: string | null
  status: EntryStatus
  created_at: string
}

export function toHuntSummary(row: HuntRow): HuntSummary {
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    startBalance: Number(row.start_balance),
    startedAt: row.started_at,
    endedAt: row.ended_at,
  }
}

export async function loadSettings(db: HuntDb): Promise<HuntSettings> {
  const { data } = await db
    .from('bonus_hunt_settings')
    .select('hunt_on, max_calls_per_user, reject_duplicates')
    .eq('id', 1)
    .maybeSingle()
  return {
    huntOn: Boolean(data?.hunt_on),
    maxCallsPerUser: Math.max(1, Number(data?.max_calls_per_user ?? 1)),
    rejectDuplicates: Boolean(data?.reject_duplicates),
  }
}

export async function findLiveHunt(db: HuntDb): Promise<HuntSummary | null> {
  const { data } = await db
    .from('bonus_hunts')
    .select('*')
    .eq('status', 'live')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ? toHuntSummary(data as HuntRow) : null
}

// Live hunt if there is one, otherwise the most recent hunt so results stay visible after it ends.
export async function findCurrentHunt(db: HuntDb): Promise<HuntSummary | null> {
  const live = await findLiveHunt(db)
  if (live) return live
  const { data } = await db
    .from('bonus_hunts')
    .select('*')
    .order('number', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ? toHuntSummary(data as HuntRow) : null
}

export async function findSlotImages(db: HuntDb, names: string[]) {
  const keys = [...new Set(names.map(normalizeSlotName).filter(Boolean))]
  const images = new Map<string, { displayName: string; imageUrl: string | null }>()
  if (keys.length === 0) return images
  const { data } = await db.from('slots').select('name_key, display_name, image_url').in('name_key', keys)
  for (const row of data ?? []) {
    images.set(row.name_key, { displayName: row.display_name, imageUrl: row.image_url })
  }
  return images
}

export async function loadEntries(db: HuntDb, huntId: string): Promise<HuntEntry[]> {
  const { data } = await db
    .from('bonus_hunt_entries')
    .select('*')
    .eq('hunt_id', huntId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  const rows = (data ?? []) as EntryRow[]
  const images = await findSlotImages(
    db,
    rows.map((r) => r.game_name)
  )

  return rows.map((row) => ({
    id: row.id,
    position: row.position,
    game: row.game_name,
    imageUrl: images.get(normalizeSlotName(row.game_name))?.imageUrl ?? row.game_image_url ?? null,
    betSize: Number(row.bet_size),
    payout: row.payout === null ? null : Number(row.payout),
    calledBy: row.called_by,
    status: row.status,
    createdAt: row.created_at,
  }))
}

export async function nextPosition(db: HuntDb, huntId: string) {
  const { data } = await db
    .from('bonus_hunt_entries')
    .select('position')
    .eq('hunt_id', huntId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data?.position ?? 0) + 1
}
