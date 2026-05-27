'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Ticket, Trophy, Users, DollarSign, Hash, Clock,
  CheckCircle2, Lock, ShoppingCart, Plus, Minus,
  X, ChevronDown, ChevronUp, ExternalLink, Copy, Check,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Round {
  id: string
  status: 'open' | 'closed' | 'drawn'
  total_pot: number
  total_tickets: number
  server_seed_hash: string | null
  server_seed: string | null
  winner_user_id: string | null
  winner_ticket_number: number | null
  drawn_at: string | null
  created_at: string
}

interface TicketRow {
  id: string
  ticket_number: number
  round_id: string
  created_at: string
}

interface TopHolder {
  user_id: string
  username: string
  ticket_count: number
}

interface FeedItem {
  id: string
  username: string
  quantity: number
  ts: number
}

interface CartItem {
  quantity: number
  price: number
  label: string
}

// ─── Ticket tiers ─────────────────────────────────────────────────────────────

const TIERS: { quantity: number; price: number; label: string; savings?: string }[] = [
  { quantity: 1,  price: 2,  label: '1 Ticket' },
  { quantity: 5,  price: 8,  label: '5 Tickets',  savings: 'Save $2' },
  { quantity: 20, price: 30, label: '20 Tickets', savings: 'Save $10' },
]

const CURRENCIES = [
  { id: 'usdterc20', label: 'USDT (ERC-20)', icon: '₮' },
  { id: 'sol',       label: 'SOL',            icon: '◎' },
  { id: 'eth',       label: 'ETH',            icon: 'Ξ' },
] as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatUsd(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 10) return 'just now'
  if (s < 60) return `${s}s ago`
  return `${Math.floor(s / 60)}m ago`
}

// ─── QR Code (simple SVG-based approach via qrserver API) ────────────────────

function QRImage({ value }: { value: string }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(value)}&bgcolor=0d1117&color=e2e8f0&margin=2`
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="QR code" width={180} height={180} className="rounded-lg mx-auto" />
  )
}

// ─── Countdown timer ─────────────────────────────────────────────────────────

function CountdownTimer({ endsAt, onExpire }: { endsAt: Date; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, endsAt.getTime() - Date.now())
      setRemaining(diff)
      if (diff === 0) onExpire()
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endsAt, onExpire])

  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)
  const isLow = remaining < 5 * 60 * 1000

  return (
    <div className={`flex items-center gap-1.5 text-sm font-mono font-bold ${isLow ? 'text-destructive' : 'text-foreground'}`}>
      <Clock className="h-3.5 w-3.5" />
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  )
}

// ─── Checkout Modal ───────────────────────────────────────────────────────────

interface CheckoutModalProps {
  round: Round
  userId: string
  cart: CartItem[]
  totalTickets: number
  totalUsd: number
  onClose: () => void
  onConfirmed: () => void
}

function CheckoutModal({ round, userId, cart, totalTickets, totalUsd, onClose, onConfirmed }: CheckoutModalProps) {
  const supabase = createClient()
  const [step, setStep] = useState<'currency' | 'payment' | 'confirmed' | 'expired'>('currency')
  const [currency, setCurrency] = useState<'usdterc20' | 'sol' | 'eth'>('usdterc20')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payment, setPayment] = useState<{
    pay_address: string
    pay_amount: number
    pay_currency: string
    payment_id: string | number
  } | null>(null)
  const [checkoutId, setCheckoutId] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [copied, setCopied] = useState<'address' | 'amount' | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Poll checkout status until confirmed or expired
  useEffect(() => {
    if (step !== 'payment' || !checkoutId) return

    pollingRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('fifty_fifty_checkouts')
        .select('status')
        .eq('id', checkoutId)
        .single()
      if (data?.status === 'confirmed') {
        clearInterval(pollingRef.current!)
        setStep('confirmed')
        onConfirmed()
      }
    }, 5000)

    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [step, checkoutId, supabase, onConfirmed])

  const handleExpire = useCallback(async () => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    if (checkoutId) {
      await supabase
        .from('fifty_fifty_checkouts')
        .update({ status: 'expired' })
        .eq('id', checkoutId)
        .eq('status', 'pending')
    }
    setStep('expired')
  }, [checkoutId, supabase])

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/fifty-fifty/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          round_id: round.id,
          ticket_quantity: totalTickets,
          usd_amount: totalUsd,
          pay_currency: currency,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Checkout failed')
      setPayment(json.payment)
      setCheckoutId(json.checkout_id)
      setExpiresAt(new Date(Date.now() + 20 * 60 * 1000))
      setStep('payment')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const copy = (text: string, type: 'address' | 'amount') => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <Card className="w-full max-w-md border-border shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              {step === 'currency' && 'Select Payment Method'}
              {step === 'payment' && 'Send Payment'}
              {step === 'confirmed' && 'Payment Confirmed'}
              {step === 'expired' && 'Payment Expired'}
            </CardTitle>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Order summary */}
          {step !== 'confirmed' && step !== 'expired' && (
            <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-1.5">
              {cart.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span>{formatUsd(item.price)}</span>
                </div>
              ))}
              <div className="pt-1.5 border-t border-border flex justify-between text-sm font-bold">
                <span>{totalTickets} tickets total</span>
                <span className="text-primary">{formatUsd(totalUsd)}</span>
              </div>
            </div>
          )}

          {/* Step: currency selection */}
          {step === 'currency' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Choose your crypto:</p>
              <div className="space-y-2">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCurrency(c.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                      currency === c.id
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border hover:border-border/80 hover:bg-muted/40'
                    }`}
                  >
                    <span className="text-lg font-bold w-6 text-center text-primary">{c.icon}</span>
                    <span className="text-sm font-medium">{c.label}</span>
                    {currency === c.id && <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />}
                  </button>
                ))}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={handleCheckout} disabled={loading} className="w-full">
                {loading ? 'Creating payment...' : `Pay ${formatUsd(totalUsd)} in ${CURRENCIES.find(c => c.id === currency)?.label}`}
              </Button>
            </div>
          )}

          {/* Step: awaiting payment */}
          {step === 'payment' && payment && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Time remaining</span>
                {expiresAt && <CountdownTimer endsAt={expiresAt} onExpire={handleExpire} />}
              </div>

              <QRImage value={payment.pay_address} />

              <div className="space-y-2">
                <div className="rounded-lg bg-muted border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-1">Deposit address</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono break-all flex-1 text-foreground">{payment.pay_address}</code>
                    <button
                      onClick={() => copy(payment.pay_address, 'address')}
                      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copied === 'address' ? <Check className="h-4 w-4 text-chart-3" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="rounded-lg bg-muted border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Exact amount ({payment.pay_currency?.toUpperCase()})
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono font-bold flex-1">{payment.pay_amount}</code>
                    <button
                      onClick={() => copy(String(payment.pay_amount), 'amount')}
                      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copied === 'amount' ? <Check className="h-4 w-4 text-chart-3" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                Send the exact amount to the address above. Your tickets will be assigned automatically once confirmed on-chain.
              </p>
            </div>
          )}

          {/* Step: confirmed */}
          {step === 'confirmed' && (
            <div className="py-4 text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-chart-3/20">
                  <CheckCircle2 className="h-8 w-8 text-chart-3" />
                </div>
              </div>
              <p className="font-semibold">Payment confirmed!</p>
              <p className="text-sm text-muted-foreground">
                Your {totalTickets} ticket{totalTickets > 1 ? 's have' : ' has'} been assigned. Check the &ldquo;My Tickets&rdquo; section below.
              </p>
              <Button onClick={onClose} className="w-full">Done</Button>
            </div>
          )}

          {/* Step: expired */}
          {step === 'expired' && (
            <div className="py-4 text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-destructive/20">
                  <Clock className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <p className="font-semibold">Payment window expired</p>
              <p className="text-sm text-muted-foreground">
                No payment was received within the 20-minute window. No tickets were assigned.
              </p>
              <Button variant="outline" onClick={onClose} className="w-full">Close</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FiftyFiftyPage() {
  const supabase = createClient()

  const [round, setRound] = useState<Round | null>(null)
  const [myTickets, setMyTickets] = useState<TicketRow[]>([])
  const [topHolders, setTopHolders] = useState<TopHolder[]>([])
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<Record<number, number>>({}) // tierIndex -> qty
  const [showCheckout, setShowCheckout] = useState(false)
  const [fairnessOpen, setFairnessOpen] = useState(false)
  const [winnerUsername, setWinnerUsername] = useState<string | null>(null)

  // Derived cart values
  const cartItems: CartItem[] = TIERS.flatMap((tier, i) =>
    (cart[i] ?? 0) > 0
      ? [{ quantity: tier.quantity * (cart[i] ?? 0), price: tier.price * (cart[i] ?? 0), label: `${cart[i]}x ${tier.label}` }]
      : []
  )
  const totalTickets = cartItems.reduce((s, c) => s + c.quantity, 0)
  const totalUsd = cartItems.reduce((s, c) => s + c.price, 0)
  const isCartEmpty = totalTickets === 0

  const fetchRound = useCallback(async () => {
    const { data } = await supabase
      .from('fifty_fifty_rounds')
      .select('*')
      .in('status', ['open', 'closed', 'drawn'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data) setRound(data as Round)
    return data as Round | null
  }, [supabase])

  const fetchMyTickets = useCallback(async (roundId: string, uid: string) => {
    const { data } = await supabase
      .from('fifty_fifty_tickets')
      .select('*')
      .eq('round_id', roundId)
      .eq('user_id', uid)
      .order('ticket_number', { ascending: true })
    setMyTickets((data as TicketRow[]) ?? [])
  }, [supabase])

  const fetchTopHolders = useCallback(async (roundId: string) => {
    const { data } = await supabase
      .from('fifty_fifty_tickets')
      .select('user_id, profiles(username)')
      .eq('round_id', roundId)

    if (!data) return

    const counts: Record<string, { username: string; count: number }> = {}
    for (const row of data as any[]) {
      const uid = row.user_id
      if (!counts[uid]) {
        counts[uid] = { username: row.profiles?.username ?? uid.slice(0, 8), count: 0 }
      }
      counts[uid].count++
    }
    setTopHolders(
      Object.entries(counts)
        .map(([uid, val]) => ({ user_id: uid, username: val.username, ticket_count: val.count }))
        .sort((a, b) => b.ticket_count - a.ticket_count)
        .slice(0, 10)
    )
  }, [supabase])

  // Fetch winner username when round is drawn
  useEffect(() => {
    if (!round?.winner_user_id || round.status !== 'drawn') return
    const found = topHolders.find(h => h.user_id === round.winner_user_id)
    if (found) { setWinnerUsername(found.username); return }
    supabase
      .from('profiles')
      .select('username')
      .eq('id', round.winner_user_id)
      .single()
      .then(({ data }) => setWinnerUsername(data?.username ?? round.winner_user_id?.slice(0, 8) ?? null))
  }, [round, topHolders, supabase])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
      const r = await fetchRound()
      if (r && user) await fetchMyTickets(r.id, user.id)
      if (r) await fetchTopHolders(r.id)
      setLoading(false)
    }
    init()
  }, [supabase, fetchRound, fetchMyTickets, fetchTopHolders])

  // Realtime
  useEffect(() => {
    if (!round) return
    const channel = supabase
      .channel(`fifty-fifty-public-${round.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'fifty_fifty_rounds',
        filter: `id=eq.${round.id}`,
      }, (payload) => {
        setRound(payload.new as Round)
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'fifty_fifty_tickets',
        filter: `round_id=eq.${round.id}`,
      }, async (payload) => {
        await fetchRound()
        await fetchTopHolders(round.id)
        if (userId) await fetchMyTickets(round.id, userId)

        // Add to feed
        const newTicket = payload.new as any
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', newTicket.user_id)
          .single()
        const username = profile?.username ?? newTicket.user_id?.slice(0, 8) ?? 'Someone'
        setFeed(prev => [
          { id: newTicket.id, username, quantity: 1, ts: Date.now() },
          ...prev.slice(0, 19),
        ])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [round, supabase, fetchRound, fetchTopHolders, fetchMyTickets, userId])

  const addToCart = (tierIndex: number) => {
    setCart(prev => ({ ...prev, [tierIndex]: (prev[tierIndex] ?? 0) + 1 }))
  }

  const removeFromCart = (tierIndex: number) => {
    setCart(prev => {
      const next = { ...prev }
      if ((next[tierIndex] ?? 0) <= 1) delete next[tierIndex]
      else next[tierIndex] = next[tierIndex] - 1
      return next
    })
  }

  const clearCart = () => setCart({})

  const winnerPayout = round ? round.total_pot * 0.5 : 0
  const myWinChance = round && round.total_tickets > 0 && myTickets.length > 0
    ? ((myTickets.length / round.total_tickets) * 100).toFixed(2)
    : '0.00'

  const statusConfig: Record<string, { label: string; color: string }> = {
    open:   { label: 'Open',   color: 'bg-chart-3/20 text-chart-3 border-chart-3/30' },
    closed: { label: 'Closed', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    drawn:  { label: 'Complete', color: 'bg-muted text-muted-foreground border-border' },
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <GiveawayCounter />
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-muted-foreground text-sm">Loading round...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />

      {showCheckout && round && userId && (
        <CheckoutModal
          round={round}
          userId={userId}
          cart={cartItems}
          totalTickets={totalTickets}
          totalUsd={totalUsd}
          onClose={() => setShowCheckout(false)}
          onConfirmed={() => { clearCart(); setShowCheckout(false) }}
        />
      )}

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Ticket className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-balance">50/50 Raffle</h1>
            {round && (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusConfig[round.status].color}`}>
                {statusConfig[round.status].label}
              </span>
            )}
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Buy tickets with crypto. One winner takes 50% of the total pot — provably fair, drawn live on stream.
          </p>
        </div>

        {!round ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No active round right now. Check back soon.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Pot stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: DollarSign, label: 'Total Pot',     value: formatUsd(round.total_pot),  color: 'text-chart-3' },
                { icon: Trophy,     label: 'Winner Gets',   value: formatUsd(winnerPayout),     color: 'text-yellow-400' },
                { icon: Ticket,     label: 'Tickets Sold',  value: round.total_tickets.toLocaleString(), color: 'text-primary' },
                { icon: Users,      label: 'Participants',  value: topHolders.length.toString(), color: 'text-accent' },
              ].map(({ icon: Icon, label, value, color }) => (
                <Card key={label}>
                  <CardContent className="pt-5 pb-4 px-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-4 w-4 ${color}`} />
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
                    </div>
                    <p className="text-2xl font-bold">{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Winner banner (drawn) */}
            {round.status === 'drawn' && round.winner_ticket_number != null && (
              <Card className="border-yellow-500/30 bg-yellow-500/5">
                <CardContent className="pt-6 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-yellow-500/20">
                      <Trophy className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Winner</p>
                      <p className="font-bold text-xl">{winnerUsername ?? '—'}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Payout</p>
                      <p className="font-bold text-xl text-yellow-400">{formatUsd(winnerPayout)}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-yellow-500/20 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5" /> Ticket #{round.winner_ticket_number}
                    </span>
                    {round.drawn_at && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> {new Date(round.drawn_at).toLocaleString()}
                      </span>
                    )}
                    {myTickets.some(t => t.ticket_number === round.winner_ticket_number) && (
                      <span className="flex items-center gap-1.5 text-yellow-400 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" /> That&apos;s your ticket!
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column */}
              <div className="lg:col-span-2 space-y-6">

                {/* Ticket tier cards (only when open) */}
                {round.status === 'open' && (
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Buy Tickets</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {TIERS.map((tier, i) => (
                        <Card
                          key={i}
                          className={`relative transition-all ${(cart[i] ?? 0) > 0 ? 'border-primary/40 bg-primary/5' : 'hover:border-border/80'}`}
                        >
                          {tier.savings && (
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                              <span className="text-xs font-bold bg-chart-3 text-background px-2 py-0.5 rounded-full">
                                {tier.savings}
                              </span>
                            </div>
                          )}
                          <CardContent className="pt-6 pb-4 px-4 text-center">
                            <p className="text-3xl font-bold mb-0.5">{tier.quantity}</p>
                            <p className="text-xs text-muted-foreground mb-2">
                              {tier.quantity === 1 ? 'ticket' : 'tickets'}
                            </p>
                            <p className="text-2xl font-bold text-primary mb-4">{formatUsd(tier.price)}</p>
                            <p className="text-xs text-muted-foreground mb-4">
                              {formatUsd(tier.price / tier.quantity)} / ticket
                            </p>

                            {(cart[i] ?? 0) === 0 ? (
                              <Button size="sm" className="w-full" onClick={() => addToCart(i)}>
                                <Plus className="h-3.5 w-3.5 mr-1" /> Add to Cart
                              </Button>
                            ) : (
                              <div className="flex items-center justify-center gap-3">
                                <button
                                  onClick={() => removeFromCart(i)}
                                  className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="font-bold text-sm w-6 text-center">{cart[i]}</span>
                                <button
                                  onClick={() => addToCart(i)}
                                  className="h-7 w-7 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition-opacity"
                                >
                                  <Plus className="h-3.5 w-3.5 text-primary-foreground" />
                                </button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Cart summary */}
                    {!isCartEmpty && (
                      <Card className="mt-4 border-primary/30 bg-primary/5">
                        <CardContent className="pt-4 pb-4 px-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <ShoppingCart className="h-4 w-4 text-primary" />
                              <span className="text-sm font-semibold">Cart</span>
                            </div>
                            <button
                              onClick={clearCart}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Clear
                            </button>
                          </div>
                          <div className="space-y-1 mb-3">
                            {cartItems.map((item, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{item.label}</span>
                                <span>{formatUsd(item.price)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-primary/20 mb-4">
                            <span className="text-sm font-bold">{totalTickets} tickets</span>
                            <span className="text-lg font-bold text-primary">{formatUsd(totalUsd)}</span>
                          </div>
                          {!userId ? (
                            <Button variant="outline" className="w-full" asChild>
                              <a href="/auth/login">Log in to purchase</a>
                            </Button>
                          ) : (
                            <Button className="w-full" onClick={() => setShowCheckout(true)}>
                              Checkout — {formatUsd(totalUsd)}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Top ticket holders */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-accent" />
                      Top Ticket Holders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topHolders.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No tickets sold yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {topHolders.map((holder, i) => {
                          const chance = round.total_tickets > 0
                            ? ((holder.ticket_count / round.total_tickets) * 100).toFixed(1)
                            : '0.0'
                          const isMe = holder.user_id === userId
                          return (
                            <div
                              key={holder.user_id}
                              className={`flex items-center gap-3 py-2 px-3 rounded-lg ${isMe ? 'bg-primary/10 border border-primary/20' : 'bg-muted/40'}`}
                            >
                              <span className={`text-xs font-bold w-5 text-center ${i === 0 ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                                {i + 1}
                              </span>
                              <span className="flex-1 text-sm font-medium truncate">
                                {holder.username}
                                {isMe && <span className="ml-1.5 text-xs text-primary">(you)</span>}
                              </span>
                              <span className="text-xs text-muted-foreground">{holder.ticket_count}</span>
                              <span className="text-xs font-semibold text-primary w-14 text-right">{chance}%</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Provably fair */}
                <Card>
                  <CardHeader className="pb-2">
                    <button
                      className="flex items-center gap-2 w-full text-left"
                      onClick={() => setFairnessOpen(v => !v)}
                    >
                      <Lock className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm flex-1">Provably Fair</CardTitle>
                      {fairnessOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </CardHeader>
                  {fairnessOpen && (
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Server seed SHA-256 hash (pre-committed before draw)</p>
                        <code className="text-xs bg-muted px-2 py-1.5 rounded block font-mono break-all">
                          {round.server_seed_hash ?? 'Not yet published'}
                        </code>
                      </div>
                      {round.status === 'drawn' && round.server_seed && (
                        <>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-chart-3" /> Revealed seed (verify yourself)
                            </p>
                            <code className="text-xs bg-chart-3/10 border border-chart-3/20 px-2 py-1.5 rounded block font-mono break-all text-chart-3">
                              {round.server_seed}
                            </code>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground leading-relaxed">
                            <strong className="text-foreground block mb-1">How to verify:</strong>
                            Run <code className="bg-muted px-1 rounded">SHA256(&quot;{round.server_seed}&quot;)</code> — the result should match the hash displayed above during the round. This proves the winning ticket was not manipulated after purchases were made.
                          </div>
                        </>
                      )}
                      {round.status !== 'drawn' && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          The raw seed will be revealed after the draw so you can independently verify the result.
                        </p>
                      )}
                    </CardContent>
                  )}
                </Card>

                {/* Live feed */}
                {feed.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-primary" />
                        Recent Purchases
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1.5">
                        {feed.map(item => (
                          <div key={item.id} className="flex items-center justify-between text-sm py-1">
                            <span>
                              <span className="font-medium">{item.username}</span>
                              <span className="text-muted-foreground"> bought </span>
                              <span className="font-medium">{item.quantity} ticket</span>
                            </span>
                            <span className="text-xs text-muted-foreground">{timeAgo(item.ts)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right column — My Tickets + How it works */}
              <div className="space-y-6">
                <Card className={userId ? 'border-primary/20' : ''}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-primary" />
                      My Tickets
                      {myTickets.length > 0 && (
                        <Badge variant="secondary" className="ml-auto text-xs">{myTickets.length}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!userId ? (
                      <div className="py-6 text-center space-y-3">
                        <p className="text-sm text-muted-foreground">Log in to see your tickets.</p>
                        <Button size="sm" variant="outline" asChild>
                          <a href="/auth/login">Log in</a>
                        </Button>
                      </div>
                    ) : myTickets.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        {round.status === 'open'
                          ? 'You have no tickets yet. Add tiers to cart above.'
                          : 'You had no tickets in this round.'}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                          <p className="text-xs text-muted-foreground mb-0.5">Win chance</p>
                          <p className="text-2xl font-bold text-primary">{myWinChance}%</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto">
                          {myTickets.map(t => {
                            const isWinner = round.status === 'drawn' && round.winner_ticket_number === t.ticket_number
                            return (
                              <span
                                key={t.id}
                                className={`text-xs font-mono px-2 py-0.5 rounded border ${
                                  isWinner
                                    ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300 font-bold ring-1 ring-yellow-400'
                                    : 'bg-muted border-border text-muted-foreground'
                                }`}
                              >
                                #{t.ticket_number}
                              </span>
                            )
                          })}
                        </div>
                        {round.status === 'drawn' && myTickets.some(t => t.ticket_number === round.winner_ticket_number) && (
                          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
                            <Trophy className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
                            <p className="text-sm font-bold text-yellow-300">You won!</p>
                            <p className="text-xs text-muted-foreground">{formatUsd(winnerPayout)} payout</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* OBS overlay link */}
                <Card>
                  <CardContent className="pt-4 pb-3 px-4">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">OBS Stream Overlay</p>
                    <a
                      href="/fifty-fifty-widget"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      /fifty-fifty-widget
                    </a>
                  </CardContent>
                </Card>

                {/* How it works */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">How it works</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      ['1', 'Add ticket tiers to your cart and checkout with crypto'],
                      ['2', 'Each ticket gets a random unique number (1–999,999)'],
                      ['3', 'Admin draws one ticket live on stream using a provably fair seed'],
                      ['4', 'Winner receives 50% of the total pot in USDT'],
                    ].map(([num, text]) => (
                      <div key={num} className="flex items-start gap-3">
                        <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                          {num}
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
