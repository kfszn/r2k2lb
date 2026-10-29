const KICK_MESSAGE_LIMIT = 500

function resolveBotUrl() {
  const raw = process.env.RAILWAY_BOT_URL?.trim()
  if (!raw) return null
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  return `${withProtocol.replace(/\/+$/, '')}/send`
}

/** Posts a chat message through the Railway sender bot. Returns whether the bot accepted it. */
export async function sendKickChat(message: string) {
  const url = resolveBotUrl()
  if (!url) {
    console.error('[kick-webhook] RAILWAY_BOT_URL is not set, cannot send chat reply')
    return false
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message.slice(0, KICK_MESSAGE_LIMIT), secret: process.env.BOT_SECRET }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      console.error('[kick-webhook] Railway bot rejected message:', res.status)
      return false
    }
    return true
  } catch (error) {
    console.error('[kick-webhook] Failed to reach Railway bot:', error instanceof Error ? error.message : error)
    return false
  }
}
