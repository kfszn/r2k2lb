import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/staff-auth'
import { normalizeSlotName, sanitizeImageUrl } from '@/lib/hunt/normalize'
import { getHuntDb } from '@/lib/hunt/server'

export const dynamic = 'force-dynamic'

const fail = (error: string, status: number) => NextResponse.json({ error }, { status })

export async function GET(request: NextRequest) {
  if (!getAdminSession(request)) return fail('Unauthorized', 401)
  const { data } = await getHuntDb()
    .from('slots')
    .select('name_key, display_name, image_url')
    .order('display_name', { ascending: true })
  return NextResponse.json({
    slots: (data ?? []).map((row) => ({ key: row.name_key, name: row.display_name, imageUrl: row.image_url })),
  })
}

// Sets (or clears, when imageUrl is empty) the image for a game. The URL is pasted by the admin; nothing is scraped.
export async function PUT(request: NextRequest) {
  if (!getAdminSession(request)) return fail('Unauthorized', 401)
  const body = (await request.json().catch(() => null)) as { name?: unknown; imageUrl?: unknown } | null
  if (!body || typeof body.name !== 'string') return fail('Invalid request body', 400)

  const name = body.name.trim().replace(/\s+/g, ' ').slice(0, 100)
  const key = normalizeSlotName(name)
  if (!key) return fail('Enter a game name.', 400)

  const raw = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : ''
  const imageUrl = raw ? sanitizeImageUrl(raw) : null
  if (raw && !imageUrl) return fail('Image URL must start with https://', 400)

  const { error } = await getHuntDb()
    .from('slots')
    .upsert({ name_key: key, display_name: name, image_url: imageUrl, updated_at: new Date().toISOString() }, { onConflict: 'name_key' })
  if (error) return fail(error.message, 500)
  return NextResponse.json({ ok: true })
}
