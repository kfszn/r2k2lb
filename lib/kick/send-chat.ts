import { isExpiring, loadBotTokens, refreshBotTokens, type BotTokenRow } from '@/lib/kick/bot-tokens'

const KICK_MESSAGE_LIMIT = 500
const KICK_CHAT_URL = 'https://api.kick.com/public/v1/chat'
const BROADCASTER_USER_ID = 1267794

export interface SendChatResult {
  ok: boolean
  via: 'direct' | 'railway' | null
  error?: string
}

type DirectOutcome = { status: 'sent' } | { status: 'unconfigured' } | { status: 'failed'; error: string }

async function postChat(accessToken: string, content: string) {
  return fetch(KICK_CHAT_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ broadcaster_user_id: BROADCASTER_USER_ID, content, type: 'bot' }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  })
}

async function sendDirect(content: string): Promise<DirectOutcome> {
  let row: BotTokenRow | null = await loadBotTokens()
  if (!row?.access_token || !row.refresh_token) return { status: 'unconfigured' }

  if (isExpiring(row)) {
    row = await refreshBotTokens(row)
    if (!row?.access_token) return { status: 'failed', error: 'Bot token expired and could not be refreshed. Re-authorize the bot.' }
  }

  try {
    let res = await postChat(row.access_token!, content)

    // The token can be revoked before its expiry. Refresh once and retry.
    if (res.status === 401) {
      const refreshed = await refreshBotTokens(row)
      if (!refreshed?.access_token) return { status: 'failed', error: 'Kick rejected the bot token (401) and it could not be refreshed. Re-authorize the bot.' }
      res = await postChat(refreshed.access_token, content)
    }

    if (!res.ok) {
      const detail = (await res.text().catch(() => '')).slice(0, 200)
      console.error(`[kick-bot] Kick chat send failed (${res.status}) ${detail}`)
      return { status: 'failed', error: `Kick returned ${res.status} ${detail}`.trim() }
    }
    return { status: 'sent' }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[kick-bot] Kick chat request failed:', message)
    return { status: 'failed', error: message }
  }
}

function resolveRailwayUrl() {
  const raw = process.env.RAILWAY_BOT_URL?.trim()
  if (!raw) return null
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  return `${withProtocol.replace(/\/+$/, '')}/send`
}

async function sendViaRailway(content: string): Promise<{ ok: boolean; error?: string }> {
  const url = resolveRailwayUrl()
  if (!url) return { ok: false, error: 'RAILWAY_BOT_URL is not set' }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: content, secret: process.env.BOT_SECRET }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      console.error('[kick-bot] Railway bot rejected message:', res.status)
      return { ok: false, error: `Railway bot returned ${res.status}` }
    }
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[kick-bot] Failed to reach Railway bot:', message)
    return { ok: false, error: message }
  }
}

/** Sends a chat message as the authorized Kick bot, falling back to the Railway bot only if RAILWAY_BOT_URL is set. */
export async function sendKickChatDetailed(message: string): Promise<SendChatResult> {
  const content = message.slice(0, KICK_MESSAGE_LIMIT)
  const direct = await sendDirect(content)
  if (direct.status === 'sent') return { ok: true, via: 'direct' }

  if (resolveRailwayUrl()) {
    const fallback = await sendViaRailway(content)
    if (fallback.ok) return { ok: true, via: 'railway' }
    return { ok: false, via: null, error: direct.status === 'failed' ? `${direct.error}; Railway fallback: ${fallback.error}` : fallback.error }
  }

  if (direct.status === 'unconfigured') {
    console.error('[kick-bot] Bot is not authorized yet. Use Admin > Stream Games > Kick Bot > Authorize.')
    return { ok: false, via: null, error: 'Bot is not authorized yet' }
  }
  return { ok: false, via: null, error: direct.error }
}

export async function sendKickChat(message: string) {
  return (await sendKickChatDetailed(message)).ok
}
