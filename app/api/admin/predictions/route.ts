import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const [{ data: settings }, { data: entries }] = await Promise.all([
      supabaseAdmin.from('prediction_settings').select('*'),
      supabaseAdmin.from('predictions').select('*').order('guess', { ascending: true }),
    ])

    const gtb = {
      settings: settings?.find((s) => s.type === 'gtb') ?? { type: 'gtb', is_open: false, label: 'Guess The Balance' },
      entries: entries?.filter((e) => e.type === 'gtb') ?? [],
    }
    const gtm = {
      settings: settings?.find((s) => s.type === 'gtm') ?? { type: 'gtm', is_open: false, label: 'Guess The Multi' },
      entries: entries?.filter((e) => e.type === 'gtm') ?? [],
    }

    return NextResponse.json({ gtb, gtm })
  } catch (err) {
    console.error('[admin/predictions GET] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
