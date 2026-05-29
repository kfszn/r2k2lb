'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Round {
  id: string
  status: 'open' | 'closed' | 'drawn'
  total_pot: number
  total_tickets: number
  winner_user_id: string | null
  winner_ticket_number: number | null
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

function formatUsd(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 15) return 'just now'
  if (s < 60) return `${s}s ago`
  return `${Math.floor(s / 60)}m ago`
}

export default function FiftyFiftyWidget() {
  const supabase = createClient()
  const [round, setRound] = useState<Round | null>(null)
  const [topHolders, setTopHolders] = useState<TopHolder[]>([])
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [tick, setTick] = useState(0) // force feed re-render for time display

  // Refresh feed timestamps every 10 seconds
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 10000)
    return () => clearInterval(id)
  }, [])

  const fetchTopHolders = useCallback(async (roundId: string) => {
    const { data } = await supabase
      .from('fifty_fifty_tickets')
      .select('user_id, profiles(username)')
      .eq('round_id', roundId)

    if (!data) return

    const counts: Record<string, { username: string; count: number }> = {}
    for (const row of data as any[]) {
      const uid = row.user_id
      if (!counts[uid]) counts[uid] = { username: row.profiles?.username ?? uid.slice(0, 8), count: 0 }
      counts[uid].count++
    }
    setTopHolders(
      Object.entries(counts)
        .map(([uid, val]) => ({ user_id: uid, username: val.username, ticket_count: val.count }))
        .sort((a, b) => b.ticket_count - a.ticket_count)
        .slice(0, 3)
    )
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase
        .from('fifty_fifty_rounds')
        .select('*')
        .in('status', ['open', 'closed', 'drawn'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data) {
        setRound(data as Round)
        await fetchTopHolders(data.id)
      }
    }
    init()
  }, [supabase, fetchTopHolders])

  // Realtime
  useEffect(() => {
    if (!round) return
    const channel = supabase
      .channel(`widget-ff-${round.id}`)
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
        const newTicket = payload.new as any
        await fetchTopHolders(round.id)

        // Fetch username for feed
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', newTicket.user_id)
          .single()
        const username = profile?.username ?? newTicket.user_id?.slice(0, 8) ?? 'Someone'

        setFeed(prev => [
          { id: newTicket.id, username, quantity: 1, ts: Date.now() },
          ...prev.slice(0, 14),
        ])

        // Refresh round totals
        const { data: updatedRound } = await supabase
          .from('fifty_fifty_rounds')
          .select('*')
          .eq('id', round.id)
          .single()
        if (updatedRound) setRound(updatedRound as Round)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [round, supabase, fetchTopHolders])

  const winnerPayout = round ? round.total_pot * 0.5 : 0
  const streamPayout = round ? round.total_pot * 0.5 : 0

  if (!round) {
    return (
      <div
        style={{ background: 'transparent', width: '100vw', height: '100vh' }}
        className="flex items-center justify-center"
      >
        <p className="text-white/40 text-sm font-mono">No active round</p>
      </div>
    )
  }

  const statusColor = round.status === 'open'
    ? 'text-emerald-400'
    : round.status === 'closed'
    ? 'text-yellow-400'
    : 'text-gray-400'

  return (
    <div
      style={{
        background: 'rgba(10, 13, 22, 0.92)',
        width: '420px',
        minHeight: '300px',
        fontFamily: "'Geist', 'Geist Fallback', system-ui, sans-serif",
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Header strip */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>
            50/50 RAFFLE
          </span>
          <span style={{
            fontSize: '10px',
            fontWeight: 600,
            padding: '2px 7px',
            borderRadius: '20px',
            background: round.status === 'open' ? 'rgba(52,211,153,0.15)' : round.status === 'closed' ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.07)',
          }} className={statusColor}>
            {round.status.toUpperCase()}
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
          r2k2.gg
        </span>
      </div>

      {/* Pot display */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
            Total Pot
          </p>
          <p style={{ fontSize: '42px', fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>
            {formatUsd(round.total_pot)}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{
            flex: 1, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)',
            borderRadius: '8px', padding: '8px 10px', textAlign: 'center',
          }}>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginBottom: '2px' }}>Winner Gets</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#fde047' }}>{formatUsd(winnerPayout)}</p>
          </div>
          <div style={{
            flex: 1, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '8px', padding: '8px 10px', textAlign: 'center',
          }}>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginBottom: '2px' }}>Stream Keeps</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#a5b4fc' }}>{formatUsd(streamPayout)}</p>
          </div>
        </div>
      </div>

      {/* Top 3 holders */}
      {topHolders.length > 0 && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            Top Holders
          </p>
          {topHolders.map((h, i) => {
            const chance = round.total_tickets > 0
              ? ((h.ticket_count / round.total_tickets) * 100).toFixed(1)
              : '0.0'
            const rankColor = i === 0 ? '#fde047' : i === 1 ? '#d1d5db' : '#cd7c32'
            return (
              <div key={h.user_id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: i < topHolders.length - 1 ? '6px' : 0 }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: rankColor, width: '14px', textAlign: 'center' }}>
                  {i + 1}
                </span>
                <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {h.username}
                </span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{h.ticket_count} tkts</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', minWidth: '40px', textAlign: 'right' }}>
                  {chance}%
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Tickets sold bar */}
      <div style={{ padding: '8px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>Tickets sold</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
          {round.total_tickets.toLocaleString()}
        </span>
      </div>

      {/* Scrolling feed ticker */}
      {feed.length > 0 && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.2)',
          padding: '7px 16px',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            gap: '32px',
            animation: feed.length >= 3 ? 'ticker 20s linear infinite' : undefined,
            whiteSpace: 'nowrap',
          }}>
            {[...feed, ...feed].map((item, i) => (
              <span key={`${item.id}-${i}`} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>{item.username}</span>
                {' bought '}
                <span style={{ color: '#818cf8', fontWeight: 600 }}>{item.quantity} ticket</span>
                {' · '}
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>{timeAgo(item.ts)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
