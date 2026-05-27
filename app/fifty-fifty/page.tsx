'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Ticket, Trophy, Users, DollarSign, Hash, Clock, CheckCircle2, Lock } from 'lucide-react'

interface Round {
  id: string
  status: 'open' | 'closed' | 'drawn'
  total_pot: number
  total_tickets: number
  server_seed_hash: string | null
  winner_user_id: string | null
  winner_ticket_number: number | null
  drawn_at: string | null
  created_at: string
}

interface Ticket {
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

export default function FiftyFiftyPage() {
  const supabase = createClient()

  const [round, setRound] = useState<Round | null>(null)
  const [myTickets, setMyTickets] = useState<Ticket[]>([])
  const [topHolders, setTopHolders] = useState<TopHolder[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchRound = useCallback(async () => {
    const { data } = await supabase
      .from('fifty_fifty_rounds')
      .select('*')
      .in('status', ['open', 'closed', 'drawn'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (data) setRound(data)
  }, [supabase])

  const fetchMyTickets = useCallback(async (roundId: string, uid: string) => {
    const { data } = await supabase
      .from('fifty_fifty_tickets')
      .select('*')
      .eq('round_id', roundId)
      .eq('user_id', uid)
      .order('ticket_number', { ascending: true })
    setMyTickets(data || [])
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

    const sorted = Object.entries(counts)
      .map(([uid, val]) => ({ user_id: uid, username: val.username, ticket_count: val.count }))
      .sort((a, b) => b.ticket_count - a.ticket_count)
      .slice(0, 10)

    setTopHolders(sorted)
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single()
        setUsername(profile?.username ?? null)
      }
      await fetchRound()
      setLoading(false)
    }
    init()
  }, [supabase, fetchRound])

  useEffect(() => {
    if (!round) return
    fetchTopHolders(round.id)
    if (userId) fetchMyTickets(round.id, userId)
  }, [round, userId, fetchMyTickets, fetchTopHolders])

  // Realtime subscription
  useEffect(() => {
    if (!round) return
    const channel = supabase
      .channel(`fifty-fifty-round-${round.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'fifty_fifty_rounds',
        filter: `id=eq.${round.id}`,
      }, (payload) => {
        setRound(payload.new as Round)
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'fifty_fifty_tickets',
        filter: `round_id=eq.${round.id}`,
      }, () => {
        fetchRound()
        fetchTopHolders(round.id)
        if (userId) fetchMyTickets(round.id, userId)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [round, supabase, fetchRound, fetchTopHolders, fetchMyTickets, userId])

  const winnerPayout = round ? round.total_pot * 0.5 : 0
  const myWinChance = round && round.total_tickets > 0 && myTickets.length > 0
    ? ((myTickets.length / round.total_tickets) * 100).toFixed(2)
    : '0.00'

  const statusConfig = {
    open: { label: 'Open', color: 'bg-chart-3/20 text-chart-3 border-chart-3/30' },
    closed: { label: 'Closing Soon', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    drawn: { label: 'Complete', color: 'bg-muted text-muted-foreground border-border' },
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

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {/* Page title */}
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
            Buy tickets with USDT. The winner takes 50% of the total pot. Provably fair — seed hash published before the draw.
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left column — stats + winner */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Pot stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-5 pb-4 px-4">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-chart-3" />
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Pot</span>
                    </div>
                    <p className="text-2xl font-bold">${round.total_pot.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5 pb-4 px-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="h-4 w-4 text-yellow-400" />
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Winner Gets</span>
                    </div>
                    <p className="text-2xl font-bold">${winnerPayout.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5 pb-4 px-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Ticket className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Tickets Sold</span>
                    </div>
                    <p className="text-2xl font-bold">{round.total_tickets.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5 pb-4 px-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-accent" />
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Participants</span>
                    </div>
                    <p className="text-2xl font-bold">{topHolders.length}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Winner card (if drawn) */}
              {round.status === 'drawn' && round.winner_ticket_number != null && (
                <Card className="border-yellow-500/30 bg-yellow-500/5">
                  <CardContent className="pt-6 pb-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-full bg-yellow-500/20">
                        <Trophy className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Winner</p>
                        <p className="font-bold text-lg leading-tight">
                          {topHolders.find(h => h.user_id === round.winner_user_id)?.username
                            ?? round.winner_user_id?.slice(0, 8) ?? 'Unknown'}
                        </p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Payout</p>
                        <p className="font-bold text-lg text-yellow-400">${winnerPayout.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-border pt-3">
                      <span className="flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5" />
                        Ticket #{round.winner_ticket_number}
                      </span>
                      {round.drawn_at && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(round.drawn_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Provably fair */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    Provably Fair
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Server Seed Hash (pre-committed)</p>
                    <code className="text-xs bg-muted px-2 py-1.5 rounded block font-mono break-all">
                      {round.server_seed_hash ?? 'Not yet published'}
                    </code>
                  </div>
                  {round.status === 'drawn' && (
                    <p className="text-xs text-chart-3 flex items-center gap-1.5 mt-2">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Seed revealed after draw — verify the result independently
                    </p>
                  )}
                </CardContent>
              </Card>

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
                    <div className="space-y-2">
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
                            <span className="text-xs text-muted-foreground">{holder.ticket_count} tickets</span>
                            <span className="text-xs font-medium text-primary w-14 text-right">{chance}%</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right column — my tickets */}
            <div className="flex flex-col gap-6">
              <Card className={userId ? 'border-primary/20' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-primary" />
                    My Tickets
                    {myTickets.length > 0 && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {myTickets.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!userId ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Log in to see your tickets.
                    </p>
                  ) : myTickets.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      {round.status === 'open'
                        ? "You haven't purchased any tickets yet."
                        : 'You had no tickets in this round.'}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                        <p className="text-xs text-muted-foreground mb-0.5">Win chance</p>
                        <p className="text-2xl font-bold text-primary">{myWinChance}%</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto">
                        {myTickets.map(t => (
                          <span
                            key={t.id}
                            className={`text-xs font-mono px-2 py-0.5 rounded border ${
                              round.status === 'drawn' && round.winner_ticket_number === t.ticket_number
                                ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300 font-bold'
                                : 'bg-muted border-border text-muted-foreground'
                            }`}
                          >
                            #{t.ticket_number}
                          </span>
                        ))}
                      </div>
                      {round.status === 'drawn' && myTickets.some(t => t.ticket_number === round.winner_ticket_number) && (
                        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
                          <Trophy className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
                          <p className="text-sm font-bold text-yellow-300">You won!</p>
                          <p className="text-xs text-muted-foreground">${winnerPayout.toLocaleString()} payout</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* How it works */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">How it works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    ['1', 'Purchase tickets with USDT via crypto payment'],
                    ['2', 'Each ticket is a unique numbered entry'],
                    ['3', 'One ticket is drawn randomly when the round closes'],
                    ['4', 'Winner receives 50% of the total pot'],
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
        )}
      </div>
    </main>
  )
}
