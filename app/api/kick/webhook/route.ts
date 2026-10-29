import { after, NextRequest, NextResponse } from 'next/server'
import { verifyKickSignature } from '@/lib/kick/webhook-verify'
import { processKickChat, type KickChatPayload } from '@/lib/kick/chat-handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const DEDUPE_TTL_MS = 10 * 60 * 1000
const recentMessageIds = new Map<string, number>()

// Kick retries failed deliveries, so repeated message IDs must not award points or reply twice.
function isDuplicate(messageId: string) {
  const now = Date.now()
  for (const [id, seenAt] of recentMessageIds) {
    if (now - seenAt > DEDUPE_TTL_MS) recentMessageIds.delete(id)
    else break
  }
  if (recentMessageIds.has(messageId)) return true
  recentMessageIds.set(messageId, now)
  return false
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'kick-webhook' })
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const headers = req.headers
  const messageId = headers.get('kick-event-message-id')

  let signatureValid = false
  try {
    signatureValid = await verifyKickSignature({
      messageId,
      timestamp: headers.get('kick-event-message-timestamp'),
      signature: headers.get('kick-event-signature'),
      rawBody,
    })
  } catch (error) {
    console.error('[kick-webhook] signature check unavailable:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'verification_unavailable' }, { status: 503 })
  }

  if (!signatureValid) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 })
  }

  if (headers.get('kick-event-type') !== 'chat.message.sent') {
    return NextResponse.json({ ok: true, ignored: true })
  }

  if (messageId && isDuplicate(messageId)) {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  let payload: KickChatPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  // Kick expects a fast 2xx, so the real work continues after the response is sent.
  const origin = req.nextUrl.origin
  after(() => processKickChat(payload, origin))

  return NextResponse.json({ ok: true })
}
