import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function verifyIpnSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET
  if (!secret) return false
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return false
  }
  const sortedJson = JSON.stringify(parsed, Object.keys(parsed).sort())
  const hmac = crypto.createHmac('sha512', secret).update(sortedJson).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(signature, 'hex'))
  } catch {
    return false
  }
}

/** Generate `count` truly random unique integers in [1, 999999] not already in `existingSet`. */
function generateUniqueRandomTickets(existingSet: Set<number>, count: number): number[] {
  const tickets: number[] = []
  const MAX = 999_999
  let attempts = 0
  while (tickets.length < count && attempts < count * 100) {
    attempts++
    // crypto.randomInt is uniform and cryptographically random
    const n = crypto.randomInt(1, MAX + 1)
    if (!existingSet.has(n)) {
      existingSet.add(n)
      tickets.push(n)
    }
  }
  return tickets
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

    // Acknowledge all statuses — only act on finished
    if (payment_status !== 'finished') {
      return NextResponse.json({ received: true, action: 'noop' })
    }

    const supabase = createServiceClient()

    // Find matching checkout
    const { data: checkout, error: checkoutError } = await supabase
      .from('fifty_fifty_checkouts')
      .select('*')
      .eq('nowpayments_payment_id', String(payment_id))
      .maybeSingle()

    if (checkoutError || !checkout) {
      console.error('[fifty-fifty/webhook] Checkout not found for payment_id:', payment_id)
      return NextResponse.json({ error: 'Checkout not found' }, { status: 404 })
    }

    // Idempotency
    if (checkout.status === 'confirmed') {
      return NextResponse.json({ received: true, action: 'already_confirmed' })
    }

    // Fetch all existing ticket numbers in this round to avoid duplicates
    const { data: existingTickets } = await supabase
      .from('fifty_fifty_tickets')
      .select('ticket_number')
      .eq('round_id', checkout.round_id)

    const existingSet = new Set<number>(
      (existingTickets ?? []).map((t: { ticket_number: number }) => t.ticket_number)
    )

    const ticketNumbers = generateUniqueRandomTickets(existingSet, checkout.ticket_quantity)

    if (ticketNumbers.length < checkout.ticket_quantity) {
      console.error('[fifty-fifty/webhook] Could not generate enough unique ticket numbers')
      return NextResponse.json({ error: 'Ticket number exhaustion' }, { status: 500 })
    }

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

    // Mark checkout confirmed
    await supabase
      .from('fifty_fifty_checkouts')
      .update({ status: 'confirmed' })
      .eq('id', checkout.id)

    // Increment round totals
    const { data: round } = await supabase
      .from('fifty_fifty_rounds')
      .select('total_pot, total_tickets')
      .eq('id', checkout.round_id)
      .maybeSingle()

    if (round) {
      await supabase
        .from('fifty_fifty_rounds')
        .update({
          total_pot: (round.total_pot ?? 0) + checkout.usd_amount,
          total_tickets: (round.total_tickets ?? 0) + checkout.ticket_quantity,
        })
        .eq('id', checkout.round_id)
    }

    return NextResponse.json({ received: true, action: 'tickets_issued', tickets: ticketNumbers })
  } catch (error) {
    console.error('[fifty-fifty/webhook] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
