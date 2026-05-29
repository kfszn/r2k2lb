import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { round_id } = body

    if (!round_id) {
      return NextResponse.json({ error: 'Missing required field: round_id' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Fetch the round — must be closed (not open, not drawn)
    const { data: round, error: roundError } = await supabase
      .from('fifty_fifty_rounds')
      .select('*')
      .eq('id', round_id)
      .maybeSingle()

    if (roundError || !round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    if (round.status !== 'closed') {
      return NextResponse.json(
        { error: `Round must be closed before drawing (current status: ${round.status})` },
        { status: 400 }
      )
    }

    // Fetch all tickets for this round
    const { data: tickets, error: ticketsError } = await supabase
      .from('fifty_fifty_tickets')
      .select('id, ticket_number, user_id')
      .eq('round_id', round_id)

    if (ticketsError) {
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    if (!tickets || tickets.length === 0) {
      return NextResponse.json({ error: 'No tickets in this round' }, { status: 400 })
    }

    // Provably fair: use the server seed that was pre-committed at round open
    const serverSeed = round.server_seed as string
    if (!serverSeed) {
      return NextResponse.json({ error: 'Round is missing server seed' }, { status: 500 })
    }

    // Use round_id as client seed
    const clientSeed = String(round_id)

    const hmac = crypto.createHmac('sha256', serverSeed)
    hmac.update(`${clientSeed}:0`)
    const hex = hmac.digest('hex')
    const randomIndex = parseInt(hex.slice(0, 8), 16) % tickets.length

    const winningTicket = tickets[randomIndex]

    // Record winner and reveal seed
    const { data: updatedRound, error: updateError } = await supabase
      .from('fifty_fifty_rounds')
      .update({
        status: 'drawn',
        winner_user_id: winningTicket.user_id,
        winner_ticket_number: winningTicket.ticket_number,
        drawn_at: new Date().toISOString(),
        client_seed: clientSeed,
        // server_seed_hash was already stored at open — keep it, just expose seed now
      })
      .eq('id', round_id)
      .select()
      .single()

    if (updateError) {
      console.error('[fifty-fifty/draw] Failed to update round:', updateError)
      return NextResponse.json({ error: 'Failed to record draw result' }, { status: 500 })
    }

    return NextResponse.json({
      round: updatedRound,
      winner_user_id: winningTicket.user_id,
      winner_ticket_number: winningTicket.ticket_number,
      total_tickets: tickets.length,
      server_seed: serverSeed,
      server_seed_hash: round.server_seed_hash,
      client_seed: clientSeed,
    })
  } catch (error) {
    console.error('[fifty-fifty/draw] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
