import 'server-only'
import { normalizeSlotName } from '@/lib/hunt/normalize'
import { findLiveHunt, findSlotImages, getHuntDb, loadSettings, nextPosition } from '@/lib/hunt/server'

export interface HuntCallResult {
  success: boolean
  message: string
}

// Returns null when no hunt is switched on, so the caller keeps the regular slot-call behavior.
export async function addCallToHunt(username: string, slotInput: string): Promise<HuntCallResult | null> {
  const db = getHuntDb()
  const settings = await loadSettings(db)
  if (!settings.huntOn) return null

  const hunt = await findLiveHunt(db)
  if (!hunt) return null

  const typed = slotInput.trim().replace(/\s+/g, ' ').slice(0, 100)
  const key = normalizeSlotName(typed)
  if (!key) return { success: false, message: `@${username} that slot name doesn't look right, try !r <slot name>.` }

  const { data: existing } = await db
    .from('bonus_hunt_entries')
    .select('game_name, called_by')
    .eq('hunt_id', hunt.id)

  const rows = existing ?? []
  const mine = rows.filter((r) => r.called_by?.toLowerCase() === username.toLowerCase()).length
  if (mine >= settings.maxCallsPerUser) {
    const limit = settings.maxCallsPerUser
    return {
      success: false,
      message: `@${username} you've already used your ${limit} call${limit === 1 ? '' : 's'} for this hunt.`,
    }
  }

  const known = (await findSlotImages(db, [typed])).get(key)
  const display = known?.displayName ?? typed

  if (settings.rejectDuplicates && rows.some((r) => normalizeSlotName(r.game_name) === key)) {
    return { success: false, message: `@${username} ${display} is already in the hunt, pick another one!` }
  }

  const { error } = await db.from('bonus_hunt_entries').insert({
    hunt_id: hunt.id,
    position: await nextPosition(db, hunt.id),
    game_name: display,
    game_image_url: known?.imageUrl ?? null,
    bet_size: 0,
    payout: null,
    called_by: username,
    status: 'called',
    pending: true,
  })

  if (error) {
    console.error('[hunt] failed to add call:', error.message)
    return { success: false, message: `@${username} couldn't add that to the hunt right now, try again.` }
  }

  return { success: true, message: `@${username} 🎰 ${display} added to the hunt (#${hunt.number})` }
}
