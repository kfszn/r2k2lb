'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Clock, Users, MessageSquare, TrendingUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Header } from '@/components/header'

interface KickEntry {
  rank: number
  kick_username: string
  total_points: number
}

interface LeaderboardConfig {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  prize_positions: { position: number; amount: number }[]
}

const PRIZE_COLORS = [
  'bg-yellow-400/20 border-yellow-400/40 text-yellow-400',
  'bg-slate-400/20 border-slate-400/40 text-slate-300',
  'bg-amber-700/20 border-amber-700/40 text-amber-500',
  'bg-primary/20 border-primary/40 text-primary',
  'bg-green-600/20 border-green-600/40 text-green-500',
  'bg-blue-400/20 border-blue-400/40 text-blue-300',
  'bg-purple-400/20 border-purple-400/40 text-purple-300',
  'bg-pink-400/20 border-pink-400/40 text-pink-300',
  'bg-cyan-400/20 border-cyan-400/40 text-cyan-300',
  'bg-lime-400/20 border-lime-400/40 text-lime-300',
]

const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th']

const RANK_BORDER: Record<number, string> = {
  1: 'border-yellow-400/50',
  2: 'border-slate-400/40',
  3: 'border-amber-600/40',
}

const RANK_LABEL: Record<number, string> = {
  1: 'text-yellow-400',
  2: 'text-slate-300',
  3: 'text-amber-500',
}

export default function KickLeaderboard() {
  const [entries, setEntries] = useState<KickEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeConfig, setActiveConfig] = useState<LeaderboardConfig | null>(null)
  const [pastConfigs, setPastConfigs] = useState<LeaderboardConfig[]>([])
  const [selectedId, setSelectedId] = useState<string>('current')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>('Loading...')

  // Load leaderboard configs from DB
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const res = await fetch('/api/leaderboard/kick-configs')
        if (res.ok) {
          const data = await res.json()
          setActiveConfig(data.active ?? null)
          setPastConfigs(data.past ?? [])
        }
      } catch {
        // Configs not critical — page still works without them
      }
    }
    loadConfigs()
  }, [])

  const loadEntries = async (configId: string) => {
    setLoading(true)
    setError(null)
    try {
      let url = '/api/leaderboard/kick'
      if (configId === 'current' && activeConfig) {
        url += `?start=${activeConfig.start_date}&end=${activeConfig.end_date}`
      } else if (configId !== 'current') {
        const cfg = pastConfigs.find(c => c.id === configId)
        if (cfg) url += `?start=${cfg.start_date}&end=${cfg.end_date}`
      }
      const res = await fetch(url)
      const data = await res.json()
      if (data.ok) {
        setEntries(data.data)
      } else {
        setError(data.error || 'Failed to load leaderboard')
      }
    } catch {
      setError('Failed to fetch leaderboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEntries(selectedId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, activeConfig])

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    const handler = () => setDropdownOpen(false)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [dropdownOpen])

  // Countdown timer
  useEffect(() => {
    if (!activeConfig || selectedId !== 'current') {
      setTimeRemaining('Ended')
      return
    }
    const interval = setInterval(() => {
      const endTime = new Date(`${activeConfig.end_date}T23:59:59Z`).getTime()
      const diff = endTime - Date.now()
      if (diff <= 0) { setTimeRemaining('Ended'); return }
      const days = Math.floor(diff / 86400000)
      const hours = Math.floor((diff % 86400000) / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      if (days > 0) setTimeRemaining(`${days}d ${hours}h ${minutes}m`)
      else if (hours > 0) setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`)
      else setTimeRemaining(`${minutes}m ${seconds}s`)
    }, 1000)
    return () => clearInterval(interval)
  }, [activeConfig, selectedId])

  const currentConfig = selectedId === 'current'
    ? activeConfig
    : pastConfigs.find(c => c.id === selectedId) ?? null

  const prizes = currentConfig?.prize_positions ?? []
  const totalPayout = prizes.reduce((s, p) => s + p.amount, 0)

  const formatPoints = (n: number) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <GiveawayCounter />
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-b from-green-500/10 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-green-500/20 border border-green-500/40">
              <MessageSquare className="h-6 w-6 text-green-400" />
              <span className="text-3xl font-bold text-green-400">
                {totalPayout > 0 ? `$${totalPayout.toLocaleString()}` : 'Kick Chatter'}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-balance">
              Kick Chatter{' '}
              <span className="text-green-400">
                {currentConfig?.name ?? 'Leaderboard'}
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Earn points by chatting in the stream. Every message and emote counts.
            </p>

            {prizes.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 text-sm font-semibold">
                {prizes
                  .sort((a, b) => a.position - b.position)
                  .map((p, i) => (
                    <span
                      key={p.position}
                      className={`px-3 py-1 rounded-full border ${PRIZE_COLORS[i] ?? PRIZE_COLORS[PRIZE_COLORS.length - 1]}`}
                    >
                      {ORDINALS[i] ?? `${p.position}th`} &mdash; ${p.amount.toLocaleString()}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-4xl mx-auto">
          <Card className="bg-card/50 backdrop-blur border-green-500/20">
            <CardContent className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5 tracking-wider">Total Chatters</p>
                  <p className="text-xl font-bold text-green-400">{entries.length.toLocaleString()}</p>
                </div>
                <Users className="h-5 w-5 text-green-400/40 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-primary/20">
            <CardContent className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5 tracking-wider">Total Points</p>
                  <p className="text-xl font-bold text-primary">
                    {formatPoints(entries.reduce((s, e) => s + e.total_points, 0))}
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-primary/40 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          {selectedId === 'current' && activeConfig && (
            <Card className="bg-card/50 backdrop-blur border-destructive/20">
              <CardContent className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5 tracking-wider">Time Remaining</p>
                    <p className="text-xl font-bold text-destructive truncate">{timeRemaining}</p>
                  </div>
                  <Clock className="h-5 w-5 text-destructive/40 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Period switcher */}
      {pastConfigs.length > 0 && (
        <section className="py-6 border-b border-border/40">
          <div className="container mx-auto px-4 flex flex-wrap gap-3 justify-center items-center">
            <Button
              variant={selectedId === 'current' ? 'default' : 'outline'}
              onClick={() => setSelectedId('current')}
              className={selectedId !== 'current' ? 'bg-transparent' : ''}
            >
              Current Leaderboard
            </Button>
            <div className="relative">
              <Button
                variant={selectedId !== 'current' ? 'default' : 'outline'}
                className={`flex items-center gap-2 ${selectedId === 'current' ? 'bg-transparent' : ''}`}
                onClick={() => setDropdownOpen(o => !o)}
              >
                {selectedId !== 'current'
                  ? pastConfigs.find(c => c.id === selectedId)?.name ?? 'Previous'
                  : 'Previous Leaderboards'}
                <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </Button>
              {dropdownOpen && (
                <div className="absolute top-full mt-1 left-0 z-50 min-w-[200px] rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                  {pastConfigs.map(cfg => (
                    <button
                      key={cfg.id}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-muted/60 transition-colors ${selectedId === cfg.id ? 'bg-primary/10' : ''}`}
                      onClick={() => { setSelectedId(cfg.id); setDropdownOpen(false) }}
                    >
                      <p className={`font-semibold ${selectedId === cfg.id ? 'text-primary' : 'text-foreground'}`}>{cfg.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{cfg.start_date} – {cfg.end_date}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Leaderboard table */}
      <section className="py-12 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-400" />
                <p className="mt-4 text-muted-foreground">Loading leaderboard...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-12 bg-destructive/10 rounded-lg border border-destructive/30 p-6">
                <p className="text-destructive font-semibold">Error Loading Leaderboard</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            )}

            {!loading && !error && entries.length === 0 && (
              <div className="text-center py-16 bg-muted/30 rounded-xl border border-border p-8">
                <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-lg font-semibold">No data yet</p>
                <p className="text-sm text-muted-foreground mt-1">Points will appear here as chatters earn them.</p>
              </div>
            )}

            {!loading && !error && entries.length > 0 && (
              <>
                {/* Top 3 podium */}
                {top3.length > 0 && (
                  <div className="space-y-3 mb-8">
                    <h2 className="text-2xl font-bold text-center mb-6">Top Chatters</h2>
                    {top3.map((entry) => {
                      const prize = prizes.find(p => p.position === entry.rank)
                      const borderColor = RANK_BORDER[entry.rank] ?? 'border-primary/20'
                      const labelColor = RANK_LABEL[entry.rank] ?? 'text-primary'
                      return (
                        <div
                          key={entry.kick_username}
                          className={`relative rounded-2xl border ${borderColor} bg-card overflow-hidden`}
                          style={entry.rank === 1 ? { boxShadow: '0 0 40px rgba(250,204,21,0.15)' } : undefined}
                        >
                          {entry.rank === 1 && <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-400" />}
                          {entry.rank === 2 && <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-400" />}
                          {entry.rank === 3 && <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-600" />}
                          <div className="p-4 flex items-center gap-4">
                            <div className={`text-2xl font-black w-10 text-center ${labelColor}`}>
                              {entry.rank === 1 ? '1st' : entry.rank === 2 ? '2nd' : '3rd'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-foreground truncate">{entry.kick_username}</p>
                              <p className="text-sm text-muted-foreground">{formatPoints(entry.total_points)} pts</p>
                            </div>
                            {prize && (
                              <div className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${PRIZE_COLORS[entry.rank - 1]}`}>
                                ${prize.amount.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Rest of the table */}
                {rest.length > 0 && (
                  <div className="space-y-1">
                    <div className="grid grid-cols-[3rem_1fr_auto] gap-3 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <div>Rank</div>
                      <div>Username</div>
                      <div>Points</div>
                    </div>
                    {rest.map((entry) => {
                      const prize = prizes.find(p => p.position === entry.rank)
                      return (
                        <div
                          key={entry.kick_username}
                          className="grid grid-cols-[3rem_1fr_auto] gap-3 px-4 py-3 items-center rounded-xl bg-card/50 border border-border/40 hover:border-green-500/30 transition-colors"
                        >
                          <div className="text-sm font-bold text-muted-foreground text-center">{entry.rank}</div>
                          <div className="font-medium text-foreground truncate">{entry.kick_username}</div>
                          <div className="flex items-center gap-3">
                            {prize && (
                              <span className="text-xs font-semibold text-green-400">${prize.amount.toLocaleString()}</span>
                            )}
                            <span className="text-sm font-semibold text-foreground">{formatPoints(entry.total_points)} pts</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
