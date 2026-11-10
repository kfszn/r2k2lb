import { createClient } from '@supabase/supabase-js'

const KICK_TOKEN_URL = 'https://id.kick.com/oauth/token'
const BOT_ROW_ID = 'bot'
const EXPIRY_BUFFER_MS = 2 * 60 * 1000

export interface BotTokenRow {
  id: string
  access_token: string | null
  refresh_token: string | null
  expires_at: string | null
  scopes: string | null
  kick_user_id: string | null
  kick_username: string | null
  updated_at: string | null
}

function getDb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export function isExpiring(row: Pick<BotTokenRow, 'expires_at'>) {
  if (!row.expires_at) return true
  return new Date(row.expires_at).getTime() - Date.now() < EXPIRY_BUFFER_MS
}

export async function loadBotTokens(): Promise<BotTokenRow | null> {
  const { data, error } = await getDb().from('kick_bot_tokens').select('*').eq('id', BOT_ROW_ID).maybeSingle()
  if (error) {
    console.error('[kick-bot] Could not read kick_bot_tokens:', error.message)
    return null
  }
  return data as BotTokenRow | null
}

// Serializes refreshes inside one server instance. Refresh tokens are single-use, so two
// parallel refreshes would burn the token. Across instances the compare-and-swap below
// plus the re-read on failure covers the same race.
let refreshInFlight: Promise<BotTokenRow | null> | null = null

export function refreshBotTokens(stale: BotTokenRow): Promise<BotTokenRow | null> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh(stale).finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

async function doRefresh(stale: BotTokenRow): Promise<BotTokenRow | null> {
  const current = await loadBotTokens()
  if (!current?.refresh_token) {
    console.error('[kick-bot] No refresh token saved. Re-authorize the bot from Admin > Stream Games.')
    return null
  }

  // Another instance already rotated the token while we were waiting.
  if (current.refresh_token !== stale.refresh_token && !isExpiring(current)) return current

  const clientId = process.env.KICK_CLIENT_ID
  const clientSecret = process.env.KICK_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    console.error('[kick-bot] KICK_CLIENT_ID / KICK_CLIENT_SECRET are not configured, cannot refresh the bot token.')
    return null
  }

  let res: Response
  try {
    res = await fetch(KICK_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: current.refresh_token,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    })
  } catch (error) {
    console.error('[kick-bot] Token refresh request failed:', error instanceof Error ? error.message : error)
    return null
  }

  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 200)
    // We may have lost a cross-instance race: the winner already saved a fresh token.
    const latest = await loadBotTokens()
    if (latest?.refresh_token && latest.refresh_token !== current.refresh_token && !isExpiring(latest)) return latest
    console.error(
      `[kick-bot] Token refresh rejected by Kick (${res.status}) ${detail}. The saved refresh token is dead. Re-authorize the bot from Admin > Stream Games.`
    )
    return null
  }

  const payload = (await res.json().catch(() => null)) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    scope?: string
  } | null
  if (!payload?.access_token) {
    console.error('[kick-bot] Kick refresh response had no access_token.')
    return null
  }

  const next: BotTokenRow = {
    ...current,
    access_token: payload.access_token,
    refresh_token: payload.refresh_token ?? current.refresh_token,
    expires_at: new Date(Date.now() + (payload.expires_in ?? 3600) * 1000).toISOString(),
    scopes: payload.scope ?? current.scopes,
    updated_at: new Date().toISOString(),
  }

  // The old refresh token is already spent, so this write must not be lost.
  const db = getDb()
  const update = {
    access_token: next.access_token,
    refresh_token: next.refresh_token,
    expires_at: next.expires_at,
    scopes: next.scopes,
    updated_at: next.updated_at,
  }
  let { error } = await db.from('kick_bot_tokens').update(update).eq('id', BOT_ROW_ID).eq('refresh_token', current.refresh_token)
  if (error) {
    ;({ error } = await db.from('kick_bot_tokens').update(update).eq('id', BOT_ROW_ID))
  }
  if (error) {
    console.error('[kick-bot] CRITICAL: refreshed the Kick token but could not save it:', error.message, '. Re-authorize the bot.')
    return null
  }

  return next
}
