import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Verify the NOWPayments IPN HMAC-SHA512 signature.
 * NOWPayments signs the sorted JSON payload with the IPN secret.
 */
function verifyIpnSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET
  if (!secret) {
    console.error('[fifty-fifty/webhook] NOWPAYMENTS_IPN_SECRET is not set')
    return false
  }

  // NOWPayments signs a deterministically-sorted JSON representation
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return false
  }

  const sortedJson = JSON.stringify(parsed, Object.keys(parsed).sort())
  const hmac = crypto.createHmac('sha512', secret).update(sortedJson).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(signature, 'hex'))
}

/** Generate `count` unique ticket numbers that don't collide with existing ones. */
async function generateUniqueTickets(
  supabase: ReturnType<typeof createServiceClient>,
  roundId: string,
  count: number
): Promise<number[]> {
  // Fetch highest existing ticket number for this round
  const { data: existing } = await supabase
    .from('fifty_fifty_tickets')
    .select('ticket_number')
    .eq('round_id', roundId)
    .order('ticket_number', { ascending: false })
    .limit(1)

  const startFrom = existing && existing.length > 0 ? existing[0].ticket_number + 1 : 1
  return Array.from({ length: count }, (_, i) => startFrom + i)
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-nowpayments-sig') ?? ''

    if (!verifyIpnSignature(rawBody, signature)) {
      console.error('[fifty-fifty/webhook] Invalid IPN signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(rawBody)
    const { payment_id, payment_status } = payload

    // Acknowledge all statuses but only act on finished
    if (payment_status !== 'finished') {
      return NextResponse.json({ received: true, action: 'noop' })
    }

    const supabase = createServiceClient()

    // Find the matching checkout
    const { data: checkout, error: checkoutError } = await supabase
      .from('fifty_fifty_checkouts')
      .select('*')
      .eq('nowpayments_payment_id', String(payment_id))
      .maybeSingle()

    if (checkoutError || !checkout) {
      console.error('[fifty-fifty/webhook] Checkout not found for payment_id:', payment_id)
      return NextResponse.json({ error: 'Checkout not found' }, { status: 404 })
    }

    // Idempotency — skip if already confirmed
    if (checkout.status === 'confirmed') {
      return NextResponse.json({ received: true, action: 'already_confirmed' })
    }

    // Generate sequential ticket numbers
    const ticketNumbers = await generateUniqueTickets(
      supabase,
      checkout.round_id,
      checkout.ticket_quantity
    )

    const ticketRows = ticketNumbers.map((ticket_number) => ({
      round_id: checkout.round_id,
      user_id: checkout.user_id,
      checkout_id: checkout.id,
      ticket_number,
    }))

    const { error: ticketInsertError } = await supabase
      .from('fifty_fifty_tickets')
      .insert(ticketRows)

    if (ticketInsertError) {
      console.error('[fifty-fifty/webhook] Failed to insert tickets:', ticketInsertError)
      return NextResponse.json({ error: 'Failed to insert tickets' }, { status: 500 })
    }

    // Mark checkout as confirmed
    const { error: checkoutUpdateError } = await supabase
      .from('fifty_fifty_checkouts')
      .update({ status: 'confirmed' })
      .eq('id', checkout.id)

    if (checkoutUpdateError) {
      console.error('[fifty-fifty/webhook] Failed to update checkout status:', checkoutUpdateError)
    }

    // Update round totals
    const { data: round } = await supabase
      .from('fifty_fifty_rounds')
      .select('total_pot, total_tickets')
      .eq('id', checkout.round_id)
      .maybeSingle()

    if (round) {
      const { error: roundUpdateError } = await supabase
        .from('fifty_fifty_rounds')
        .update({
          total_pot: (round.total_pot ?? 0) + checkout.usd_amount,
          total_tickets: (round.total_tickets ?? 0) + checkout.ticket_quantity,
        })
        .eq('id', checkout.round_id)

      if (roundUpdateError) {
        console.error('[fifty-fifty/webhook] Failed to update round totals:', roundUpdateError)
      }
    }

    return NextResponse.json({ received: true, action: 'tickets_issued', tickets: ticketNumbers })
  } catch (error) {
    console.error('[fifty-fifty/webhook] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
