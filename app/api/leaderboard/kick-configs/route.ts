import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('leaderboard_configs')
      .select('*')
      .eq('platform', 'kick')
      .order('start_date', { ascending: false })

    if (error) {
      return NextResponse.json({ active: null, past: [] })
    }

    const active = data?.find(c => c.is_active) ?? null
    const past = data?.filter(c => !c.is_active) ?? []

    return NextResponse.json({ active, past })
  } catch {
    return NextResponse.json({ active: null, past: [] })
  }
}
