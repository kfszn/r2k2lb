import { isExpiring, loadBotTokens, refreshBotTokens } from '@/lib/kick/bot-tokens'

const KICK_MESSAGE_LIMIT = 500
const KICK_CHAT_URL = 'https://api.kick.com/public/v1/chat'
const BROADCASTER_USER_ID = 1267794

export interface SendChatResult {
  ok: boolean
  via: 'direct' | null
  error?: string
}

async function postChat(accessToken: string, content: string) {
  return fetch(KICK_CHAT_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ broadcaster_user_id: BROADCASTER_USER_ID, content, type: 'bot' }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  })
}

/** Sends a chat message as the authorized Kick bot. The token is read from the database on every send. */
export async function sendKickChatDetailed(message: string): Promise<SendChatResult> {
  const content = message.slice(0, KICK_MESSAGE_LIMIT)

  const row = await loadBotTokens()
  if (!row?.access_token || !row.refresh_token) {
    console.error('[kick-bot] Bot is not authorized yet. Use Admin > Stream Games > Kick Bot > Authorize.')
    return { ok: false, via: null, error: 'Bot is not authorized yet' }
  }

  let accessToken = row.access_token
  if (isExpiring(row)) {
    const refreshed = await refreshBotTokens()
    if (!refreshed.ok || !refreshed.row.access_token) {
      return { ok: false, via: null, error: refreshed.ok ? 'Refreshed token was empty' : refreshed.error }
    }
    accessToken = refreshed.row.access_token
  }

  try {
    let res = await postChat(accessToken, content)

    // The token can be revoked before its expiry. Refresh once and retry once.
    if (res.status === 401) {
      const refreshed = await refreshBotTokens({ rejectedAccessToken: accessToken })
      if (!refreshed.ok || !refreshed.row.access_token) {
        return { ok: false, via: null, error: refreshed.ok ? 'Refreshed token was empty' : `Kick rejected the bot token (401). ${refreshed.error}` }
      }
      res = await postChat(refreshed.row.access_token, content)
    }

    if (!res.ok) {
      const detail = (await res.text().catch(() => '')).slice(0, 200)
      console.error(`[kick-bot] Kick chat send failed (${res.status}) ${detail}`)
      return { ok: false, via: null, error: `Kick returned ${res.status} ${detail}`.trim() }
    }
    return { ok: true, via: 'direct' }
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error)
    console.error('[kick-bot] Kick chat request failed:', messageText)
    return { ok: false, via: null, error: messageText }
  }
}

export async function sendKickChat(message: string) {
  return (await sendKickChatDetailed(message)).ok
}
