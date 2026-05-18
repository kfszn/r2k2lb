'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Clock, Users, MessageSquare, TrendingUp, ExternalLink, ChevronDown } from 'lucide-react'
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
  'bg-green-500/20 border-green-500/40 text-green-400',
  'bg-blue-400/20 border-blue-400/40 text-blue-300',
  'bg-purple-400/20 border-purple-400/40 text-purple-300',
  'bg-pink-400/20 border-pink-400/40 text-pink-300',
  'bg-cyan-400/20 border-cyan-400/40 text-cyan-300',
  'bg-lime-400/20 border-lime-400/40 text-lime-300',
  'bg-orange-400/20 border-orange-400/40 text-orange-300',
]

const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th']

const RANK_BORDER: Record<number, string> = {
  1: 'border-yellow-400/50',
  2: 'border-slate-400/40',
  3: 'border-amber-600/40',
}

const RANK_GLOW: Record<number, string> = {
  1: '0 0 40px rgba(250,204,21,0.15)',
  2: '',
  3: '',
}

const RANK_TOP_BAR: Record<number, string> = {
  1: 'bg-yellow-400',
  2: 'bg-slate-400',
  3: 'bg-amber-600',
}

const RANK_LABEL: Record<number, string> = {
  1: 'text-yellow-400',
  2: 'text-slate-300',
  3: 'text-amber-500',
}

// Kick green brand color
const KICK_GREEN = '#53fc18'

export default function KickLeaderboard() {
  const [entries, setEntries] = useState<KickEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeConfig, setActiveConfig] = useState<LeaderboardConfig | null>(null)
  const [pastConfigs, setPastConfigs] = useState<LeaderboardConfig[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>('current')
  const [selectedPastId, setSelectedPastId] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>('Loading...')

  const showPrevious = selectedMonth !== 'current'

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
        // Configs not critical
      }
    }
    loadConfigs()
  }, [])

  const loadEntries = async (cfg: LeaderboardConfig | null) => {
    setLoading(true)
    setError(null)
    setEntries([])
    try {
      let url = '/api/leaderboard/kick'
      if (cfg) {
        url += `?start=${cfg.start_date}&end=${cfg.end_date}`
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

  // Load current leaderboard when active config is fetched
  useEffect(() => {
    if (selectedMonth === 'current') {
      loadEntries(activeConfig)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConfig, selectedMonth])

  // Countdown timer
  useEffect(() => {
    if (!activeConfig || selectedMonth !== 'current') {
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
  }, [activeConfig, selectedMonth])

  const selectedPastConfig = pastConfigs.find(c => c.id === selectedPastId) ?? null
  const currentConfig = !showPrevious ? activeConfig : selectedPastConfig

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
      <section className="relative overflow-hidden py-16" style={{ background: `linear-gradient(to bottom, ${KICK_GREEN}0d, transparent)` }}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full border"
              style={{ backgroundColor: `${KICK_GREEN}1a`, borderColor: `${KICK_GREEN}66` }}
            >
              <MessageSquare className="h-6 w-6" style={{ color: KICK_GREEN }} />
              <span className="text-3xl font-bold" style={{ color: KICK_GREEN }}>
                {totalPayout > 0 ? `$${totalPayout.toLocaleString()} Prize Pool` : 'Kick Chat Leaderboard'}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-balance">
              {currentConfig?.name
                ? <><span style={{ color: KICK_GREEN }}>{currentConfig.name}</span> Leaderboard</>
                : <>Kick <span style={{ color: KICK_GREEN }}>Chatter</span> Leaderboard</>
              }
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Earn points by chatting in the stream while it&apos;s live. Every message and emote adds to your score.
            </p>

            <div className="flex justify-center">
              <a
                href="https://kick.com/r2ktwo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: KICK_GREEN, color: '#000' }}
              >
                <TrendingUp className="h-4 w-4" />
                Watch Live on Kick
              </a>
            </div>

            {currentConfig && (
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Period:</span>{' '}
                {new Date(currentConfig.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' – '}
                {new Date(currentConfig.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            )}

            {prizes.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 text-sm font-semibold">
                {[...prizes]
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
          <Card className="bg-card/50 backdrop-blur" style={{ borderColor: `${KICK_GREEN}33` }}>
            <CardContent className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5 tracking-wider">Total Chatters</p>
                  <p className="text-xl font-bold" style={{ color: KICK_GREEN }}>{entries.length.toLocaleString()}</p>
                </div>
                <Users className="h-5 w-5 flex-shrink-0" style={{ color: `${KICK_GREEN}66` }} />
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

          {!showPrevious && activeConfig && (
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

      {/* Controls — matches acebet style */}
      <section className="py-6 border-b border-border/40">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center items-center">
            {/* Current button */}
            <Button
              variant={!showPrevious ? 'default' : 'outline'}
              onClick={() => {
                setSelectedMonth('current')
                setSelectedPastId(null)
                loadEntries(activeConfig)
              }}
              className={!showPrevious ? '' : 'bg-transparent'}
            >
              Current Leaderboard
            </Button>

            {/* Previous dropdown */}
            <div className="relative">
              <Button
                variant={showPrevious ? 'default' : 'outline'}
                className={`flex items-center gap-2 ${showPrevious ? '' : 'bg-transparent'}`}
                onClick={() => setDropdownOpen(o => !o)}
              >
                {showPrevious && selectedPastConfig ? selectedPastConfig.name : 'Previous Leaderboards'}
                <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </Button>
              {dropdownOpen && (
                <div className="absolute top-full mt-1 left-0 z-50 min-w-[220px] rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                  {pastConfigs.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-muted-foreground">No past leaderboards yet.</p>
                  ) : (
                    pastConfigs.map(cfg => {
                      const cfgPayout = (cfg.prize_positions as { position: number; amount: number }[])
                        .reduce((s, p) => s + p.amount, 0)
                      return (
                        <button
                          key={cfg.id}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-muted/60 transition-colors ${selectedPastId === cfg.id ? 'bg-primary/10' : ''}`}
                          onClick={() => {
                            setSelectedMonth(cfg.id)
                            setSelectedPastId(cfg.id)
                            setDropdownOpen(false)
                            loadEntries(cfg)
                          }}
                        >
                          <p className={`font-semibold ${selectedPastId === cfg.id ? 'text-primary' : 'text-foreground'}`}>{cfg.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(cfg.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {' – '}
                            {new Date(cfg.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          {cfgPayout > 0 && (
                            <p className="text-xs font-semibold mt-0.5" style={{ color: KICK_GREEN }}>
                              ${cfgPayout.toLocaleString()} prize pool
                            </p>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Selected period label */}
          {showPrevious && selectedPastConfig && (
            <p className="text-center text-sm text-muted-foreground mt-3">
              Viewing: <span className="text-foreground font-semibold">{selectedPastConfig.name}</span>
              <span className="ml-2 text-muted-foreground">
                ({new Date(selectedPastConfig.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' – '}
                {new Date(selectedPastConfig.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
              </span>
            </p>
          )}
        </div>
      </section>

      {/* Leaderboard */}
      <section className="py-12 pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-6">

            {loading && (
              <div className="text-center py-16">
                <div
                  className="inline-block animate-spin rounded-full h-12 w-12 border-b-2"
                  style={{ borderColor: KICK_GREEN }}
                />
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
              <div className="text-center py-20 bg-muted/20 rounded-2xl border border-border p-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4" style={{ color: `${KICK_GREEN}40` }} />
                <p className="text-xl font-bold text-foreground mb-1">
                  {showPrevious && !selectedPastId
                    ? 'Select a past leaderboard above'
                    : !showPrevious && !activeConfig
                    ? 'No active leaderboard'
                    : 'No points recorded yet'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {showPrevious && !selectedPastId
                    ? 'Choose a previous leaderboard period to view its results.'
                    : !showPrevious && !activeConfig
                    ? 'A leaderboard will appear here once the admin creates one.'
                    : 'Points will appear here as chatters earn them during the stream.'}
                </p>
                <a
                  href="https://kick.com/r2ktwo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-6 px-5 py-2 rounded-lg text-sm font-semibold border transition-colors"
                  style={{ color: KICK_GREEN, borderColor: `${KICK_GREEN}40`, backgroundColor: `${KICK_GREEN}10` }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Watch the Stream
                </a>
              </div>
            )}

            {!loading && !error && entries.length > 0 && (
              <>
                {/* Top 3 podium */}
                <div className="space-y-3 mb-8">
                  <h2 className="text-2xl font-bold text-center mb-6">Top Chatters</h2>
                  {top3.map((entry) => {
                    const prize = prizes.find(p => p.position === entry.rank)
                    const borderColor = RANK_BORDER[entry.rank] ?? 'border-primary/20'
                    const glow = RANK_GLOW[entry.rank] ?? ''
                    const topBar = RANK_TOP_BAR[entry.rank]
                    const labelColor = RANK_LABEL[entry.rank] ?? 'text-primary'
                    const rankLabel = entry.rank === 1 ? '1st' : entry.rank === 2 ? '2nd' : '3rd'
                    return (
                      <div
                        key={entry.kick_username}
                        className={`relative rounded-2xl border ${borderColor} bg-card overflow-hidden`}
                        style={glow ? { boxShadow: glow } : undefined}
                      >
                        {topBar && <div className={`absolute top-0 left-0 right-0 h-1 ${topBar}`} />}
                        <div className="p-4 md:p-5 flex items-center gap-4">
                          <div className={`text-xl md:text-2xl font-black w-12 text-center shrink-0 ${labelColor}`}>
                            {rankLabel}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {entry.rank === 1 && <Trophy className="h-4 w-4 text-yellow-400 shrink-0" />}
                              <p className="font-bold text-foreground truncate text-lg">{entry.kick_username}</p>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{formatPoints(entry.total_points)} points</p>
                          </div>
                          {prize && (
                            <div className={`px-3 py-1.5 rounded-lg text-sm font-bold border shrink-0 ${PRIZE_COLORS[entry.rank - 1]}`}>
                              ${prize.amount.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Rest of the table */}
                {rest.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-[3rem_1fr_auto] gap-3 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <div className="text-center">Rank</div>
                      <div>Username</div>
                      <div>Points</div>
                    </div>
                    {rest.map((entry) => {
                      const prize = prizes.find(p => p.position === entry.rank)
                      return (
                        <div
                          key={entry.kick_username}
                          className="grid grid-cols-[3rem_1fr_auto] gap-3 px-4 py-3 items-center rounded-xl bg-card/50 border border-border/40 transition-colors"
                          style={{ ['--hover-border' as string]: `${KICK_GREEN}33` }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = `${KICK_GREEN}33`)}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
                        >
                          <div className="text-sm font-bold text-muted-foreground text-center">{entry.rank}</div>
                          <div className="font-medium text-foreground truncate">{entry.kick_username}</div>
                          <div className="flex items-center gap-3 justify-end">
                            {prize && (
                              <span className="text-xs font-semibold" style={{ color: KICK_GREEN }}>
                                ${prize.amount.toLocaleString()}
                              </span>
                            )}
                            <span className="text-sm font-semibold text-foreground tabular-nums">
                              {formatPoints(entry.total_points)} pts
                            </span>
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
