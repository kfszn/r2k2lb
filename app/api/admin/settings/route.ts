import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('settings').select('key, value')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const result: Record<string, string> = {}
  for (const row of data) {
    result[row.key] = row.value
  }

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  let body: { pointsPerMessage: number; pointsPer10Min: number }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const { pointsPerMessage, pointsPer10Min } = body

  if (pointsPerMessage === undefined || pointsPer10Min === undefined) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const { error } = await supabase
    .from('settings')
    .upsert(
      [
        { key: 'points_per_message', value: String(pointsPerMessage) },
        { key: 'points_per_10min_watch', value: String(pointsPer10Min) },
      ],
      { onConflict: 'key' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
