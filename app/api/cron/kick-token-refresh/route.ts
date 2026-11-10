import { timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { isExpiring, loadBotTokens, refreshBotTokens } from '@/lib/kick/bot-tokens'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const REFRESH_WINDOW_MS = 60 * 60 * 1000

function hasValidBearer(request: NextRequest, secret: string) {
  const expected = Buffer.from(`Bearer ${secret}`)
  const actual = Buffer.from(request.headers.get('authorization') ?? '')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

// Keeps the bot authorized around the clock: refreshes the token whenever it expires within 60 minutes.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 })
  }
  if (!hasValidBearer(request, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const row = await loadBotTokens()
  if (!row?.refresh_token) {
    return NextResponse.json({ status: 'not_authorized' }, { status: 200 })
  }
  if (!isExpiring(row, REFRESH_WINDOW_MS) && row.access_token) {
    return NextResponse.json({ status: 'fresh', expiresAt: row.expires_at })
  }

  const result = await refreshBotTokens({ expiryWindowMs: REFRESH_WINDOW_MS })
  if (!result.ok) {
    console.error('[kick-token-refresh] refresh failed:', result.error)
    return NextResponse.json({ status: 'failed', error: result.error, needsReauth: result.needsReauth }, { status: 500 })
  }

  console.log(`[kick-token-refresh] ${result.refreshed ? 'refreshed' : 'already fresh'}, expires ${result.row.expires_at}`)
  return NextResponse.json({ status: result.refreshed ? 'refreshed' : 'fresh', expiresAt: result.row.expires_at })
}
