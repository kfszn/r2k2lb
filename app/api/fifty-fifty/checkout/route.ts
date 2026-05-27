import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, round_id, ticket_quantity, usd_amount } = body

    if (!user_id || !round_id || !ticket_quantity || !usd_amount) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, round_id, ticket_quantity, usd_amount' },
        { status: 400 }
      )
    }

    if (typeof ticket_quantity !== 'number' || ticket_quantity < 1) {
      return NextResponse.json(
        { error: 'ticket_quantity must be a positive integer' },
        { status: 400 }
      )
    }

    if (typeof usd_amount !== 'number' || usd_amount <= 0) {
      return NextResponse.json(
        { error: 'usd_amount must be a positive number' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Verify the round exists and is open
    const { data: round, error: roundError } = await supabase
      .from('fifty_fifty_rounds')
      .select('id, status')
      .eq('id', round_id)
      .maybeSingle()

    if (roundError || !round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    if (round.status !== 'open') {
      return NextResponse.json(
        { error: `Round is not open for entries (status: ${round.status})` },
        { status: 400 }
      )
    }

    // Create NOWPayments invoice
    const nowpaymentsRes = await fetch('https://api.nowpayments.io/v1/payment', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: usd_amount,
        price_currency: 'usd',
        pay_currency: 'usdterc20',
        fixed_rate: true,
        order_id: `fifty-fifty:${round_id}:${user_id}:${Date.now()}`,
        order_description: `50/50 Raffle – ${ticket_quantity} ticket${ticket_quantity > 1 ? 's' : ''} for round ${round_id}`,
        ipn_callback_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/fifty-fifty/webhook`,
      }),
    })

    if (!nowpaymentsRes.ok) {
      const errText = await nowpaymentsRes.text()
      console.error('[fifty-fifty/checkout] NOWPayments error:', errText)
      return NextResponse.json(
        { error: 'Failed to create payment with NOWPayments' },
        { status: 502 }
      )
    }

    const payment = await nowpaymentsRes.json()

    // Persist checkout record in Supabase
    const { data: checkout, error: insertError } = await supabase
      .from('fifty_fifty_checkouts')
      .insert({
        user_id,
        round_id,
        ticket_quantity,
        usd_amount,
        nowpayments_payment_id: String(payment.payment_id),
        pay_address: payment.pay_address ?? null,
        pay_amount: payment.pay_amount ?? null,
        pay_currency: payment.pay_currency ?? 'usdterc20',
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('[fifty-fifty/checkout] Supabase insert error:', insertError)
      return NextResponse.json(
        { error: 'Payment created but failed to store checkout record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      checkout_id: checkout.id,
      payment,
    })
  } catch (error) {
    console.error('[fifty-fifty/checkout] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
