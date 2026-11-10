import { createClient } from '@supabase/supabase-js'

const KICK_TOKEN_URL = 'https://id.kick.com/oauth/token'
const BOT_ROW_ID = 'bot'
const SEND_EXPIRY_WINDOW_MS = 2 * 60 * 1000
const LOCK_MS = 30 * 1000
const LOCK_WAIT_MS = 12 * 1000
const LOCK_POLL_MS = 400

export interface BotTokenRow {
  id: string
  access_token: string | null
  refresh_token: string | null
  expires_at: string | null
  scopes: string | null
  kick_user_id: string | null
  kick_username: string | null
  updated_at: string | null
  refresh_lock_until: string | null
  last_refresh_at: string | null
  last_refresh_error: string | null
  last_refresh_error_at: string | null
  needs_reauth: boolean
}

export type RefreshResult =
  | { ok: true; row: BotTokenRow; refreshed: boolean }
  | { ok: false; error: string; needsReauth: boolean }

export interface RefreshOptions {
  /** An access token Kick just rejected with 401. Never treated as usable, even if its expiry looks fine. */
  rejectedAccessToken?: string | null
  /** Refresh when the access token expires within this many ms. Defaults to 2 minutes. */
  expiryWindowMs?: number
}

function getDb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function isExpiring(row: Pick<BotTokenRow, 'expires_at'>, windowMs = SEND_EXPIRY_WINDOW_MS) {
  if (!row.expires_at) return true
  return new Date(row.expires_at).getTime() - Date.now() < windowMs
}

function isUsable(row: BotTokenRow, opts: RefreshOptions) {
  return Boolean(row.access_token) && row.access_token !== opts.rejectedAccessToken && !isExpiring(row, opts.expiryWindowMs)
}

function isLocked(row: BotTokenRow) {
  return Boolean(row.refresh_lock_until) && new Date(row.refresh_lock_until!).getTime() > Date.now()
}

/** Always reads from the database. Tokens are never cached in memory. */
export async function loadBotTokens(): Promise<BotTokenRow | null> {
  const { data, error } = await getDb().from('kick_bot_tokens').select('*').eq('id', BOT_ROW_ID).maybeSingle()
  if (error) {
    console.error('[kick-bot] Could not read kick_bot_tokens:', error.message)
    return null
  }
  return data as BotTokenRow | null
}

// Kick refresh tokens are single-use, so two refreshes at once would burn the token.
// This single-flight guard covers one server instance; the database lock below covers all of them.
let inFlight: Promise<RefreshResult> | null = null

/**
 * The only place the bot token is refreshed. Takes a database lock, calls grant_type=refresh_token,
 * and writes the new access token, refresh token, expiry and updated_at before returning.
 */
export function refreshBotTokens(opts: RefreshOptions = {}): Promise<RefreshResult> {
  if (!inFlight) {
    inFlight = runRefresh(opts).finally(() => {
      inFlight = null
    })
  }
  return inFlight
}

async function runRefresh(opts: RefreshOptions): Promise<RefreshResult> {
  const first = await loadBotTokens()
  if (!first?.refresh_token) {
    return { ok: false, error: 'Bot is not authorized yet. Authorize it from Admin > Stream Games.', needsReauth: true }
  }
  if (isUsable(first, opts)) return { ok: true, row: first, refreshed: false }

  const locked = await acquireLock()
  if (!locked) return waitForOtherRefresh(opts)
  return refreshWithLock(locked, opts)
}

async function acquireLock(): Promise<BotTokenRow | null> {
  const now = new Date()
  const { data, error } = await getDb()
    .from('kick_bot_tokens')
    .update({ refresh_lock_until: new Date(now.getTime() + LOCK_MS).toISOString() })
    .eq('id', BOT_ROW_ID)
    .or(`refresh_lock_until.is.null,refresh_lock_until.lt.${now.toISOString()}`)
    .select('*')
    .maybeSingle()
  if (error) {
    console.error('[kick-bot] Could not take the refresh lock:', error.message)
    return null
  }
  return data as BotTokenRow | null
}

async function waitForOtherRefresh(opts: RefreshOptions): Promise<RefreshResult> {
  const deadline = Date.now() + LOCK_WAIT_MS
  while (Date.now() < deadline) {
    await sleep(LOCK_POLL_MS)
    const row = await loadBotTokens()
    if (!row) continue
    if (isUsable(row, opts)) return { ok: true, row, refreshed: false }
    if (!isLocked(row)) {
      if (row.needs_reauth) {
        return { ok: false, error: row.last_refresh_error ?? 'Bot needs re-authorization.', needsReauth: true }
      }
      const locked = await acquireLock()
      if (locked) return refreshWithLock(locked, opts)
    }
  }
  return { ok: false, error: 'Another token refresh is still running. Try again shortly.', needsReauth: false }
}

async function refreshWithLock(locked: BotTokenRow, opts: RefreshOptions): Promise<RefreshResult> {
  // The row returned by the lock update is a fresh read. Another instance may have refreshed just before we locked.
  if (isUsable(locked, opts)) {
    await releaseLock()
    return { ok: true, row: locked, refreshed: false }
  }
  if (!locked.refresh_token) {
    return recordFailure('No refresh token saved. Re-authorize the bot.', true)
  }

  const clientId = process.env.KICK_CLIENT_ID
  const clientSecret = process.env.KICK_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return recordFailure('KICK_CLIENT_ID / KICK_CLIENT_SECRET are not configured, so the bot token cannot be refreshed.', false)
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
        refresh_token: locked.refresh_token,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    })
  } catch (error) {
    return recordFailure(`Could not reach Kick to refresh the token: ${error instanceof Error ? error.message : String(error)}`, false)
  }

  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 200)
    // A 4xx (other than rate limiting) means Kick no longer accepts this refresh token.
    const permanent = res.status >= 400 && res.status < 500 && res.status !== 429 && res.status !== 408
    return recordFailure(`Kick rejected the token refresh (${res.status}) ${detail}`.trim(), permanent)
  }

  const payload = (await res.json().catch(() => null)) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    scope?: string
  } | null
  if (!payload?.access_token) {
    return recordFailure('Kick refresh response had no access_token.', false)
  }

  const savedAt = new Date().toISOString()
  const update = {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token ?? locked.refresh_token,
    expires_at: new Date(Date.now() + (payload.expires_in ?? 3600) * 1000).toISOString(),
    scopes: payload.scope ?? locked.scopes,
    updated_at: savedAt,
    last_refresh_at: savedAt,
    last_refresh_error: null,
    last_refresh_error_at: null,
    needs_reauth: false,
    refresh_lock_until: null,
  }

  // The old refresh token is already spent, so this write must not be lost.
  const db = getDb()
  let saveError: string | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await db.from('kick_bot_tokens').update(update).eq('id', BOT_ROW_ID)
    if (!error) {
      saveError = null
      break
    }
    saveError = error.message
    await sleep(300 * (attempt + 1))
  }
  if (saveError) {
    console.error('[kick-bot] CRITICAL: refreshed the Kick token but could not save it:', saveError)
    return recordFailure('Refreshed the token but could not save it. Re-authorize the bot.', true)
  }

  return { ok: true, row: { ...locked, ...update }, refreshed: true }
}

async function releaseLock() {
  const { error } = await getDb().from('kick_bot_tokens').update({ refresh_lock_until: null }).eq('id', BOT_ROW_ID)
  if (error) console.error('[kick-bot] Could not release the refresh lock:', error.message)
}

/** Saves why a refresh failed (never any token value) and releases the lock. */
async function recordFailure(message: string, needsReauth: boolean): Promise<RefreshResult> {
  console.error(`[kick-bot] Token refresh failed${needsReauth ? ' (needs re-authorization)' : ''}: ${message}`)
  const { error } = await getDb()
    .from('kick_bot_tokens')
    .update({
      last_refresh_error: message,
      last_refresh_error_at: new Date().toISOString(),
      refresh_lock_until: null,
      ...(needsReauth ? { needs_reauth: true } : {}),
    })
    .eq('id', BOT_ROW_ID)
  if (error) console.error('[kick-bot] Could not save the refresh failure:', error.message)
  return { ok: false, error: message, needsReauth }
}
