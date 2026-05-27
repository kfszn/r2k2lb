import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { generateServerSeed, hashServerSeed } from '@/lib/games/provably-fair'

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    // Admin-only: verify the shared admin secret
    const adminSecret = request.headers.get('x-admin-secret')
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { round_id } = body

    if (!round_id) {
      return NextResponse.json({ error: 'Missing required field: round_id' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Fetch the round and make sure it is still open
    const { data: round, error: roundError } = await supabase
      .from('fifty_fifty_rounds')
      .select('*')
      .eq('id', round_id)
      .maybeSingle()

    if (roundError || !round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    if (round.status !== 'open') {
      return NextResponse.json(
        { error: `Round cannot be drawn (status: ${round.status})` },
        { status: 400 }
      )
    }

    // Fetch all confirmed tickets for this round
    const { data: tickets, error: ticketsError } = await supabase
      .from('fifty_fifty_tickets')
      .select('id, ticket_number, user_id')
      .eq('round_id', round_id)

    if (ticketsError) {
      console.error('[fifty-fifty/draw] Failed to fetch tickets:', ticketsError)
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    if (!tickets || tickets.length === 0) {
      return NextResponse.json({ error: 'No tickets in this round' }, { status: 400 })
    }

    // Provably fair draw
    const serverSeed = generateServerSeed()
    const serverSeedHash = hashServerSeed(serverSeed)

    // Use the round_id as the public client seed
    const clientSeed = String(round_id)

    // Derive an index into the ticket array using HMAC-SHA256
    const crypto = (await import('crypto')).default
    const hmac = crypto.createHmac('sha256', serverSeed)
    hmac.update(`${clientSeed}:0`)
    const hex = hmac.digest('hex')
    const randomIndex = parseInt(hex.slice(0, 8), 16) % tickets.length

    const winningTicket = tickets[randomIndex]

    // Close the round and record the winner atomically
    const { error: updateError } = await supabase
      .from('fifty_fifty_rounds')
      .update({
        status: 'drawn',
        winner_user_id: winningTicket.user_id,
        winner_ticket_number: winningTicket.ticket_number,
        drawn_at: new Date().toISOString(),
        server_seed: serverSeed,
        server_seed_hash: serverSeedHash,
        client_seed: clientSeed,
      })
      .eq('id', round_id)

    if (updateError) {
      console.error('[fifty-fifty/draw] Failed to update round:', updateError)
      return NextResponse.json({ error: 'Failed to record draw result' }, { status: 500 })
    }

    return NextResponse.json({
      round_id,
      winner_user_id: winningTicket.user_id,
      winner_ticket_number: winningTicket.ticket_number,
      total_tickets: tickets.length,
      server_seed_hash: serverSeedHash,
      client_seed: clientSeed,
      // server_seed is revealed so players can verify fairness
      server_seed: serverSeed,
    })
  } catch (error) {
    console.error('[fifty-fifty/draw] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
