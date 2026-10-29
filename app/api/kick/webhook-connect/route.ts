import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/staff-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const KICK_API = 'https://api.kick.com/public/v1'
const CHAT_EVENT = 'chat.message.sent'

interface KickSubscription {
  id?: string
  event?: string
  broadcaster_user_id?: number
  method?: string
}

async function getAppAccessToken() {
  const clientId = process.env.KICK_CLIENT_ID
  const clientSecret = process.env.KICK_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('KICK_CLIENT_ID and KICK_CLIENT_SECRET must be set')

  const res = await fetch('https://id.kick.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: 'no-store',
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.access_token) {
    throw new Error(`Kick token request failed (${res.status}): ${JSON.stringify(json)}`)
  }
  return json.access_token as string
}

async function kickFetch(token: string, path: string, init?: RequestInit) {
  const res = await fetch(`${KICK_API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  })
  const json = await res.json().catch(() => null)
  return { ok: res.ok, status: res.status, json }
}

async function resolveBroadcasterId(token: string, slug: string) {
  const { ok, json } = await kickFetch(token, `/channels?slug=${encodeURIComponent(slug)}`)
  const id = ok ? json?.data?.[0]?.broadcaster_user_id : null
  return typeof id === 'number' ? id : null
}

/**
 * Owner/staff-only helper. Visit while signed in to the admin panel:
 *   /api/kick/webhook-connect                       lists the webhook URL and current subscriptions
 *   /api/kick/webhook-connect?slug=<channel slug>   also subscribes that channel to chat messages
 */
export async function GET(req: NextRequest) {
  if (!getAdminSession(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).replace(/\/+$/, '')
  const webhookUrl = `${siteUrl}/api/kick/webhook`

  try {
    const token = await getAppAccessToken()
    const slug = req.nextUrl.searchParams.get('slug')?.trim()
    const idParam = req.nextUrl.searchParams.get('broadcaster_user_id')
    let action = 'none'
    let subscribeResult: unknown = null

    const existing = await kickFetch(token, '/events/subscriptions')
    let subscriptions: KickSubscription[] = Array.isArray(existing.json?.data) ? existing.json.data : []

    if (slug || idParam) {
      const broadcasterId = idParam ? Number(idParam) : await resolveBroadcasterId(token, slug!)
      if (!broadcasterId || !Number.isFinite(broadcasterId)) {
        return NextResponse.json({ error: 'channel_not_found', slug, webhook_url: webhookUrl }, { status: 404 })
      }

      const alreadySubscribed = subscriptions.some(
        (s) => s.event === CHAT_EVENT && s.broadcaster_user_id === broadcasterId
      )

      if (alreadySubscribed) {
        action = 'already_subscribed'
      } else {
        const created = await kickFetch(token, '/events/subscriptions', {
          method: 'POST',
          body: JSON.stringify({
            broadcaster_user_id: broadcasterId,
            events: [{ name: CHAT_EVENT, version: 1 }],
            method: 'webhook',
          }),
        })
        subscribeResult = created.json
        action = created.ok ? 'subscribed' : 'subscribe_failed'

        const refreshed = await kickFetch(token, '/events/subscriptions')
        subscriptions = Array.isArray(refreshed.json?.data) ? refreshed.json.data : subscriptions
      }
    }

    return NextResponse.json({
      webhook_url: webhookUrl,
      action,
      subscribe_result: subscribeResult,
      subscriptions,
      next_steps: [
        `In the Kick developer dashboard, enable webhooks for your app and set the webhook URL to ${webhookUrl}`,
        'Set RAILWAY_BOT_URL so the bot can reply in chat',
        'Add ?slug=<your channel slug> to this URL to subscribe your channel to chat messages',
      ],
    })
  } catch (error) {
    console.error('[kick-webhook-connect] error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'kick_request_failed', message: error instanceof Error ? error.message : 'Unknown error', webhook_url: webhookUrl },
      { status: 502 }
    )
  }
}
