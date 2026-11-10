import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/staff-auth'
import { loadBotTokens } from '@/lib/kick/bot-tokens'

export const dynamic = 'force-dynamic'

// Owner-only status for the Kick bot card. Tokens themselves are never returned.
export async function GET(request: NextRequest) {
  if (getAdminSession(request)?.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const row = await loadBotTokens()
  return NextResponse.json({
    authorized: Boolean(row?.access_token && row.refresh_token),
    account: row?.kick_username ?? null,
    expiresAt: row?.expires_at ?? null,
    scopes: row?.scopes ?? null,
    updatedAt: row?.updated_at ?? null,
    lastRefreshAt: row?.last_refresh_at ?? null,
    lastRefreshError: row?.last_refresh_error ?? null,
    lastRefreshErrorAt: row?.last_refresh_error_at ?? null,
    needsReauth: Boolean(row?.needs_reauth),
  })
}
