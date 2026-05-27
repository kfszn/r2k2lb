'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Ticket, Trophy, Users, DollarSign, Hash,
  Clock, PlayCircle, XCircle, Shuffle, ChevronDown, ChevronUp,
} from 'lucide-react'

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

interface TopHolder {
  user_id: string
  username: string
  ticket_count: number
}

interface HistoryRound extends Round {
  winner_username?: string
}

const statusStyle: Record<string, string> = {
  open: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
  closed: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  drawn: 'bg-muted text-muted-foreground border-border',
}

export function FiftyFiftyManager() {
  const supabase = createClient()

  const [currentRound, setCurrentRound] = useState<Round | null>(null)
  const [topHolders, setTopHolders] = useState<TopHolder[]>([])
  const [history, setHistory] = useState<HistoryRound[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const notify = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') { setSuccess(msg); setTimeout(() => setSuccess(null), 4000) }
    else { setError(msg); setTimeout(() => setError(null), 6000) }
  }

  const fetchCurrent = useCallback(async () => {
    const { data } = await supabase
      .from('fifty_fifty_rounds')
      .select('*')
      .in('status', ['open', 'closed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setCurrentRound(data ?? null)
    return data
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

  const fetchHistory = useCallback(async () => {
    const { data: rounds } = await supabase
      .from('fifty_fifty_rounds')
      .select('*')
      .eq('status', 'drawn')
      .order('drawn_at', { ascending: false })
      .limit(20)

    if (!rounds) return

    // Enrich with winner usernames
    const enriched: HistoryRound[] = await Promise.all(
      rounds.map(async (r) => {
        if (!r.winner_user_id) return r
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', r.winner_user_id)
          .single()
        return { ...r, winner_username: profile?.username ?? r.winner_user_id?.slice(0, 8) }
      })
    )
    setHistory(enriched)
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const round = await fetchCurrent()
      if (round) await fetchTopHolders(round.id)
      await fetchHistory()
      setLoading(false)
    }
    init()
  }, [fetchCurrent, fetchTopHolders, fetchHistory])

  // Realtime updates on current round
  useEffect(() => {
    if (!currentRound) return
    const channel = supabase
      .channel(`admin-ff-${currentRound.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'fifty_fifty_rounds',
        filter: `id=eq.${currentRound.id}`,
      }, (payload) => { setCurrentRound(payload.new as Round) })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'fifty_fifty_tickets',
        filter: `round_id=eq.${currentRound.id}`,
      }, () => {
        fetchCurrent()
        fetchTopHolders(currentRound.id)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentRound, supabase, fetchCurrent, fetchTopHolders])

  const openRound = async () => {
    setActionLoading('open')
    try {
      const res = await fetch('/api/admin/fifty-fifty/round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'open' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to open round')
      notify('New round opened!', 'success')
      const round = await fetchCurrent()
      if (round) fetchTopHolders(round.id)
    } catch (e: any) {
      notify(e.message, 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const closeRound = async () => {
    if (!currentRound) return
    setActionLoading('close')
    try {
      const res = await fetch('/api/admin/fifty-fifty/round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close', round_id: currentRound.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to close round')
      notify('Round closed — no new purchases accepted.', 'success')
      setCurrentRound(json.round)
    } catch (e: any) {
      notify(e.message, 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const triggerDraw = async () => {
    if (!currentRound) return
    if (!confirm('Trigger the draw now? This cannot be undone.')) return
    setActionLoading('draw')
    try {
      const res = await fetch('/api/fifty-fifty/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round_id: currentRound.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Draw failed')
      notify(`Draw complete! Winner: ticket #${json.winner_ticket_number}`, 'success')
      setCurrentRound(json.round)
      await fetchHistory()
    } catch (e: any) {
      notify(e.message, 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const winnerUsername = currentRound?.winner_user_id
    ? topHolders.find(h => h.user_id === currentRound.winner_user_id)?.username
      ?? currentRound.winner_user_id.slice(0, 8)
    : null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Notification banners */}
      {success && (
        <div className="p-3 rounded-lg bg-chart-3/10 border border-chart-3/20 text-chart-3 text-sm">{success}</div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
      )}

      {/* Open new round CTA */}
      {!currentRound && (
        <Card className="border-primary/20">
          <CardContent className="pt-6 pb-5 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold">No active round</p>
              <p className="text-sm text-muted-foreground">Open a new round to start accepting ticket purchases.</p>
            </div>
            <Button onClick={openRound} disabled={actionLoading === 'open'} className="gap-2 shrink-0">
              <PlayCircle className="h-4 w-4" />
              {actionLoading === 'open' ? 'Opening...' : 'Open New Round'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Current round panel */}
      {currentRound && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-lg font-semibold">Current Round</h2>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusStyle[currentRound.status]}`}>
                {currentRound.status === 'open' ? 'Open' : currentRound.status === 'closed' ? 'Closed' : 'Complete'}
              </span>
              <code className="text-xs text-muted-foreground font-mono ml-auto">#{currentRound.id.slice(0, 8)}</code>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: DollarSign, label: 'Total Pot', value: `$${currentRound.total_pot.toLocaleString()}`, color: 'text-chart-3' },
                { icon: Trophy, label: 'Winner Gets', value: `$${(currentRound.total_pot * 0.5).toLocaleString()}`, color: 'text-yellow-400' },
                { icon: Ticket, label: 'Tickets Sold', value: currentRound.total_tickets.toLocaleString(), color: 'text-primary' },
                { icon: Users, label: 'Participants', value: topHolders.length.toString(), color: 'text-accent' },
              ].map(({ icon: Icon, label, value, color }) => (
                <Card key={label}>
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                    <p className="text-xl font-bold">{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Seed hash */}
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" /> Server Seed Hash (pre-committed)
                </p>
                <code className="text-xs bg-muted px-2 py-1.5 rounded block font-mono break-all">
                  {currentRound.server_seed_hash ?? '—'}
                </code>
                {currentRound.status === 'drawn' && currentRound.server_seed && (
                  <>
                    <p className="text-xs text-muted-foreground mt-2 mb-1 flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-chart-3" /> Revealed Seed
                    </p>
                    <code className="text-xs bg-chart-3/10 border border-chart-3/20 px-2 py-1.5 rounded block font-mono break-all text-chart-3">
                      {currentRound.server_seed}
                    </code>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Winner display */}
            {currentRound.status === 'drawn' && winnerUsername && (
              <Card className="border-yellow-500/30 bg-yellow-500/5">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-full bg-yellow-500/20">
                      <Trophy className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Winner</p>
                      <p className="font-bold text-lg leading-tight">{winnerUsername}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Payout</p>
                      <p className="font-bold text-xl text-yellow-400">
                        ${(currentRound.total_pot * 0.5).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-yellow-500/20 flex gap-5 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5" /> Ticket #{currentRound.winner_ticket_number}
                    </span>
                    {currentRound.drawn_at && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(currentRound.drawn_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top holders */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" /> Top Ticket Holders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topHolders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-3">No tickets sold yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {topHolders.map((h, i) => {
                      const chance = currentRound.total_tickets > 0
                        ? ((h.ticket_count / currentRound.total_tickets) * 100).toFixed(1)
                        : '0.0'
                      return (
                        <div key={h.user_id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/40">
                          <span className={`text-xs font-bold w-5 text-center ${i === 0 ? 'text-yellow-400' : 'text-muted-foreground'}`}>{i + 1}</span>
                          <span className="flex-1 text-sm font-medium truncate">{h.username}</span>
                          <span className="text-xs text-muted-foreground">{h.ticket_count} tickets</span>
                          <span className="text-xs font-medium text-primary w-12 text-right">{chance}%</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action panel */}
          <div className="space-y-4">
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Round Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentRound.status === 'open' && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                      onClick={closeRound}
                      disabled={!!actionLoading}
                    >
                      <XCircle className="h-4 w-4" />
                      {actionLoading === 'close' ? 'Closing...' : 'Close Round'}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Closing stops new purchases but does not draw yet.
                    </p>
                  </>
                )}

                {currentRound.status === 'closed' && (
                  <>
                    <Button
                      className="w-full gap-2"
                      onClick={triggerDraw}
                      disabled={!!actionLoading}
                    >
                      <Shuffle className="h-4 w-4" />
                      {actionLoading === 'draw' ? 'Drawing...' : 'Trigger Draw'}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Reveals seed, picks winner, and updates the public page in real time.
                    </p>
                  </>
                )}

                {currentRound.status === 'drawn' && (
                  <>
                    <p className="text-xs text-chart-3 text-center py-1">This round is complete.</p>
                    <Button className="w-full gap-2" onClick={openRound} disabled={!!actionLoading}>
                      <PlayCircle className="h-4 w-4" />
                      {actionLoading === 'open' ? 'Opening...' : 'Open New Round'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-3 px-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Round ID</span>
                  <code className="font-mono text-foreground">{currentRound.id.slice(0, 12)}…</code>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Opened</span>
                  <span>{new Date(currentRound.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Status</span>
                  <span className="capitalize">{currentRound.status}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* History */}
      <Card>
        <CardHeader className="pb-2">
          <button
            className="flex items-center gap-2 w-full text-left"
            onClick={() => setHistoryOpen(v => !v)}
          >
            <Trophy className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Round History</CardTitle>
            <Badge variant="secondary" className="text-xs">{history.length}</Badge>
            <span className="ml-auto text-muted-foreground">
              {historyOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          </button>
        </CardHeader>
        {historyOpen && (
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No completed rounds yet.</p>
            ) : (
              <div className="space-y-2">
                {/* Header row */}
                <div className="grid grid-cols-4 gap-3 px-3 pb-1 border-b border-border text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  <span>Date</span>
                  <span>Winner</span>
                  <span>Pot</span>
                  <span>Payout</span>
                </div>
                {history.map(r => (
                  <div key={r.id} className="grid grid-cols-4 gap-3 px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors text-sm">
                    <span className="text-muted-foreground text-xs">
                      {r.drawn_at ? new Date(r.drawn_at).toLocaleDateString() : '—'}
                    </span>
                    <span className="font-medium truncate">{r.winner_username ?? '—'}</span>
                    <span>${r.total_pot.toLocaleString()}</span>
                    <span className="text-yellow-400 font-medium">${(r.total_pot * 0.5).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
