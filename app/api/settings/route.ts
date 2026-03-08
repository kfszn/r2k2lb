import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('settings')
    .select('key, value')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const map: Record<string, number> = {}
  for (const row of data ?? []) {
    map[row.key] = Number(row.value)
  }

  return NextResponse.json({
    pointsPerMessage: map['points_per_message'] ?? 1,
    pointsPer10Min: map['points_per_10min_watch'] ?? 10,
  })
}
