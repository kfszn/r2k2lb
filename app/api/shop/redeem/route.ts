import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function generateOrderId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'ORD-'
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  let body: { profile_id?: string; shop_item_id?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const { profile_id, shop_item_id } = body

  if (!profile_id || !shop_item_id) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  // Get the shop item
  const { data: item, error: itemError } = await supabase
    .from('shop_items')
    .select('*')
    .eq('id', shop_item_id)
    .eq('active', true)
    .maybeSingle()

  if (itemError || !item) {
    return NextResponse.json({ error: 'item_not_found' }, { status: 404 })
  }

  // Get profile and check balance
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, points, kick_username, email')
    .eq('id', profile_id)
    .maybeSingle()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'profile_not_found' }, { status: 404 })
  }

  if (profile.points < item.points_cost) {
    return NextResponse.json({ error: 'insufficient_points', points: profile.points, required: item.points_cost }, { status: 400 })
  }

  const orderId = generateOrderId()
  const newBalance = profile.points - item.points_cost

  // Deduct points
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ points: newBalance })
    .eq('id', profile_id)

  if (updateError) {
    return NextResponse.json({ error: 'update_failed', message: updateError.message }, { status: 500 })
  }

  // Create redemption
  await supabase.from('redemptions').insert({
    profile_id,
    shop_item_id,
    order_id: orderId,
    points_spent: item.points_cost,
    status: 'pending',
  })

  // Log transaction
  await supabase.from('point_transactions').insert({
    profile_id,
    amount: -item.points_cost,
    type: 'redemption',
    description: `Redeemed: ${item.name} (${orderId})`,
  })

  // Send email notification via Resend
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'R2K2 Shop <noreply@r2k2.gg>',
        to: ['support@r2k2.gg'],
        subject: `New Redemption: ${item.name} — ${orderId}`,
        html: `
          <h2>New Shop Redemption</h2>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Item:</strong> ${item.name}</p>
          <p><strong>Points Spent:</strong> ${item.points_cost.toLocaleString()}</p>
          <p><strong>User:</strong> ${profile.kick_username ?? 'Unknown'} (${profile.email ?? profile_id})</p>
          <p><strong>New Balance:</strong> ${newBalance.toLocaleString()}</p>
        `,
      }),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true, order_id: orderId, new_balance: newBalance })
}
