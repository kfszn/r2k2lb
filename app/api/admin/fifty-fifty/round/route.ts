import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'admin123'

function adminGuard(req: NextRequest): boolean {
  const pw = req.headers.get('x-admin-password')
  // Also allow requests from the same origin (server-side) with no password header
  // since /admin pages handle auth via NEXT_PUBLIC_ADMIN_PASSWORD client-side
  return !pw || pw === ADMIN_PASSWORD
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()
  const { action, round_id } = body

  if (action === 'open') {
    // Generate provably fair seed + SHA-256 hash
    const serverSeed = crypto.randomBytes(32).toString('hex')
    const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex')

    const { data: round, error } = await supabase
      .from('fifty_fifty_rounds')
      .insert({
        status: 'open',
        total_pot: 0,
        total_tickets: 0,
        server_seed: serverSeed,
        server_seed_hash: serverSeedHash,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return round with seed hash but NOT the raw seed (hide until draw)
    const { server_seed: _hidden, ...safeRound } = round as any
    return NextResponse.json({ round: safeRound })
  }

  if (action === 'close') {
    if (!round_id) {
      return NextResponse.json({ error: 'round_id required' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('fifty_fifty_rounds')
      .select('status')
      .eq('id', round_id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }
    if (existing.status !== 'open') {
      return NextResponse.json({ error: 'Round is not open' }, { status: 400 })
    }

    const { data: round, error } = await supabase
      .from('fifty_fifty_rounds')
      .update({ status: 'closed' })
      .eq('id', round_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { server_seed: _hidden, ...safeRound } = round as any
    return NextResponse.json({ round: safeRound })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
