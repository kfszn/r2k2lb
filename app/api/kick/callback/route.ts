import { NextRequest, NextResponse } from 'next/server'

/**
 * Shim: Kick OAuth sometimes calls /api/kick/callback instead of
 * /api/auth/kick/callback. This route simply forwards the full query
 * string to the real handler so no OAuth flow is broken.
 */
export async function GET(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.r2k2.gg'
  const search = req.nextUrl.search // preserves ?code=...&state=...
  return NextResponse.redirect(`${siteUrl}/api/auth/kick/callback${search}`, { status: 302 })
}
