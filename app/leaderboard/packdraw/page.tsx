'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Clock, DollarSign, TrendingUp, Users, Search, ChevronDown } from 'lucide-react'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Header } from '@/components/header'
import { GoalTracker } from '@/components/goal-tracker'

interface LeaderboardEntry {
  userId: number
  name: string
  avatar: string
  wagered: number
  deposited: number
  earned: number
}

interface LeaderboardData {
  ok: boolean
  range: { start_at: string; end_at: string; days: number }
  count: number
  data: LeaderboardEntry[]
}

// Prize pool: $2,000 total - top 10 paid spots
const REWARDS = [400, 300, 250, 200, 150, 100, 75, 50, 25, 0]

interface MonthConfig {
  label: string
  start_at: string
  end_at: string
  display: string
  rewards: number[]
  total: number
}

// Previous leaderboard months
const PREVIOUS_MONTHS: MonthConfig[] = [
  {
    label: 'March',
    start_at: '2026-02-24',
    end_at: '2026-03-25',
    display: 'Feb 24 – Mar 25, 2026',
    rewards: [1500, 1000, 750, 500, 300, 200, 100, 50, 25, 10],
    total: 5000,
  },
  {
    label: 'April',
    start_at: '2026-03-26',
    end_at: '2026-04-24',
    display: 'Mar 26 – Apr 24, 2026',
    rewards: [2000, 1250, 800, 600, 400, 300, 200, 150, 100, 50],
    total: 7000,
  },
]

export default function PackdrawLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('current')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>('Loading...')
  const [dateRange, setDateRange] = useState<string>('Loading...')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const showPrevious = selectedMonth !== 'current'

  const activeMonthConfig = PREVIOUS_MONTHS.find(m => m.label === selectedMonth) ?? null
  const activeRewards = showPrevious ? (activeMonthConfig?.rewards ?? []) : REWARDS
  const activeTotal = showPrevious ? (activeMonthConfig?.total ?? 0) : 2000

  const loadLeaderboard = async (month: string) => {
    setLoading(true)
    setError(null)
    setSearchQuery('')
    try {
      let url = '/api/leaderboard'
      if (month !== 'current') {
        const found = PREVIOUS_MONTHS.find(m => m.label === month)
        if (found && found.start_at !== 'TBD') {
          url = `/api/leaderboard?start_at=${found.start_at}&end_at=${found.end_at}`
        } else {
          setLeaderboard({ ok: true, range: { start_at: 'TBD', end_at: 'TBD', days: 0 }, count: 0, data: [] })
          setLoading(false)
          return
        }
      }
      const res = await fetch(url)
      const data = await res.json()
      if (data.ok) {
        setLeaderboard(data)
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
    loadLeaderboard('current')
  }, [])

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = () => setDropdownOpen(false)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [dropdownOpen])

  useEffect(() => {
    if (!leaderboard) return

    if (selectedMonth !== 'current') {
      const found = PREVIOUS_MONTHS.find(m => m.label === selectedMonth)
      if (found) setDateRange(`${found.display}`)
    } else {
      setDateRange(`May 1 - May 31, 2026 • 11:59pm EST End`)
    }

    const interval = setInterval(() => {
      if (selectedMonth !== 'current') {
        setTimeRemaining('Ended')
        return
      }

      const endTime = new Date('2026-05-31T23:59:59Z').getTime()
      const diff = endTime - Date.now()

      if (diff <= 0) {
        setTimeRemaining('Ended')
        return
      }

      const days = Math.floor(diff / 86400000)
      const hours = Math.floor((diff % 86400000) / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      
      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`)
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`)
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`)
      } else {
        setTimeRemaining(`${seconds}s`)
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [leaderboard, selectedMonth])

  const formatMoney = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(cents / 100)
  }

  const maskName = (name: string) => {
    if (!name || name.length <= 3) return name
    return name.slice(0, 2) + '*'.repeat(name.length - 3) + name.slice(-1)
  }

  const getAvatarUrl = (avatar: string | null) => {
    if (!avatar) return '/assets/r2k2-circular-avatar.png'
    
    if (avatar.includes('avatar-anonymous') || avatar === '/assets/common/avatar-anonymous.png') {
      return '/assets/r2k2-circular-avatar.png'
    }
    
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      const url = avatar.split('#')[0]
      return url
    }
    
    return `https://packdraw.com${avatar.startsWith('/') ? avatar : '/' + avatar}`
  }

  const totalWagered = leaderboard?.data.reduce((sum, entry) => sum + entry.wagered, 0) || 0

  return (
    <div className="min-h-screen bg-background text-foreground">
      <GiveawayCounter />
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/20 border border-primary/40">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="text-3xl font-bold text-primary">${activeTotal.toLocaleString()}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight" suppressHydrationWarning>
              Packdraw <span className="text-primary">${activeTotal.toLocaleString()}</span> Monthly Leaderboard
            </h1>
            <div className="flex justify-center">
              <a
                href="https://packdraw.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors font-semibold"
              >
                <Trophy className="h-4 w-4" />
                View on Packdraw
              </a>
            </div>
            <div className="mt-4 p-4 rounded-lg bg-muted/40 border border-border">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Raw Wager Statistics:</strong> These are raw wager stats. Please use these to view your wager amounts for reward purposes.
              </p>
            </div>
            <p className="text-lg text-muted-foreground">
              Every <strong>BET</strong> on Packdraw counts towards your score.
              <br />
              <em className="text-sm">{dateRange}</em>
            </p>
            
            <div className="flex flex-wrap justify-center gap-2 text-sm font-semibold">
              {activeRewards.map((prize, i) => {
                const ordinals = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th']
                const colors = [
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
                return (
                  <span key={i} className={`px-3 py-1 rounded-full border ${colors[i] ?? colors[colors.length - 1]}`}>
                    {ordinals[i]} — ${prize.toLocaleString()}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      {leaderboard && (
        <section className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-6xl mx-auto">
            <Card className="bg-card/50 backdrop-blur border-primary/20">
              <CardContent className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5 tracking-wider">Total Wagered</p>
                    <p className="text-xl font-bold text-primary truncate">{formatMoney(totalWagered)}</p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-primary/40 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-blue-500/20">
              <CardContent className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5 tracking-wider">Participants</p>
                    <p className="text-xl font-bold text-blue-400">{leaderboard.count.toLocaleString()}</p>
                  </div>
                  <Users className="h-5 w-5 text-blue-400/40 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
            
            <GoalTracker
              current={totalWagered}
              goal={100000000}
              formatMoney={formatMoney}
              label="Wager Goal"
            />
            
            {!showPrevious && (
              <Card className="bg-card/50 backdrop-blur border-destructive/20">
                <CardContent className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5 tracking-wider">Time Remaining</p>
                      <p className="text-xl font-bold text-destructive truncate">{timeRemaining || 'Loading...'}</p>
                    </div>
                    <Clock className="h-5 w-5 text-destructive/40 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Controls */}
      <section className="py-6 border-b border-border/40">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center items-center">
            <Button
              variant={!showPrevious ? 'default' : 'outline'}
              onClick={() => { setSelectedMonth('current'); loadLeaderboard('current') }}
              className={!showPrevious ? '' : 'bg-transparent'}
            >
              Current Leaderboard
            </Button>

            <div className="relative">
              <Button
                variant={showPrevious ? 'default' : 'outline'}
                className={`flex items-center gap-2 ${showPrevious ? '' : 'bg-transparent'}`}
                onClick={() => setDropdownOpen(o => !o)}
              >
                {showPrevious ? selectedMonth : 'Previous Leaderboards'}
                <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </Button>
              {dropdownOpen && (
                <div className="absolute top-full mt-1 left-0 z-50 min-w-[180px] rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                  {PREVIOUS_MONTHS.map(m => (
                    <button
                      key={m.label}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-muted/60 transition-colors ${selectedMonth === m.label ? 'bg-primary/10' : ''}`}
                      onClick={() => {
                        setSelectedMonth(m.label)
                        setDropdownOpen(false)
                        loadLeaderboard(m.label)
                      }}
                    >
                      <p className={`font-semibold ${selectedMonth === m.label ? 'text-primary' : 'text-foreground'}`}>{m.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.display}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {showPrevious && (() => {
            const found = PREVIOUS_MONTHS.find(m => m.label === selectedMonth)
            return (
              <p className="text-center text-sm text-muted-foreground mt-3">
                Viewing: <span className="text-foreground font-semibold">{selectedMonth} Leaderboard</span>
                {found && <span className="ml-2 text-muted-foreground">({found.display})</span>}
              </p>
            )
          })()}
        </div>
      </section>

      {/* Leaderboard */}
      <section className="py-12 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-6">
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">Loading leaderboard...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-12 bg-destructive/10 rounded-lg border border-destructive/30 p-6">
                <p className="text-destructive text-lg font-semibold mb-2">Error Loading Leaderboard</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            )}

            {!loading && !error && leaderboard && (
              <>
                {leaderboard.data.length === 0 ? (
                  <div className="text-center py-12 bg-muted/40 rounded-lg border border-border p-6">
                    <p className="text-muted-foreground text-lg">No leaderboard data available for the selected period</p>
                    <p className="text-sm text-muted-foreground mt-2">Range: {leaderboard.range.start_at} to {leaderboard.range.end_at}</p>
                  </div>
                ) : leaderboard.range.start_at === 'TBD' ? (
                  <div className="text-center py-16 bg-muted/30 rounded-xl border border-border p-8">
                    <Trophy className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-foreground mb-1">{selectedMonth} Leaderboard</p>
                    <p className="text-sm text-muted-foreground">Date range coming soon. Check back later!</p>
                  </div>
                ) : (
                  <>
                    {/* Podium Top 3 */}
                    <div className="mb-10">
                      <h2 className="text-2xl font-bold text-center mb-8">Top Performers</h2>
                      <div className="flex flex-col gap-3 md:hidden">
                        {leaderboard.data[0] && (
                          <div className="relative rounded-2xl border border-yellow-400/50 bg-card overflow-hidden" style={{ boxShadow: '0 0 40px rgba(250,204,21,0.2)' }}>
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-yellow-400" />
                            <div className="p-5 flex flex-col items-center text-center gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold uppercase tracking-widest text-yellow-400">1st Place</span>
                                <Trophy className="h-4 w-4 text-yellow-400" />
                              </div>
                              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-yellow-400/70" style={{ boxShadow: '0 0 20px rgba(250,204,21,0.3)' }}>
                                <img src={getAvatarUrl(leaderboard.data[0].avatar)} alt={leaderboard.data[0].name} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-user.jpg' }} />
                              </div>
                              <p className="font-bold text-lg text-foreground truncate w-full">{maskName(leaderboard.data[0].name)}</p>
                              <div className="w-full space-y-2">
                                <div className="flex items-center justify-between text-sm bg-muted/40 rounded-lg px-3 py-2">
                                  <span className="text-muted-foreground">Wagered</span>
                                  <span className="font-semibold text-foreground">{formatMoney(leaderboard.data[0].wagered)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm bg-yellow-400/10 rounded-lg px-3 py-2 border border-yellow-400/30">
                                  <span className="text-yellow-400">Prize</span>
                                  <span className="font-semibold text-yellow-400">${activeRewards[0].toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {leaderboard.data[1] && (
                          <div className="relative rounded-2xl border border-slate-400/40 bg-card overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-400" />
                            <div className="p-4 flex items-center gap-4">
                              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-slate-400/50 flex-shrink-0">
                                <img src={getAvatarUrl(leaderboard.data[1].avatar)} alt={leaderboard.data[1].name} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-user.jpg' }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold uppercase tracking-widest text-slate-300">2nd Place</span>
                                </div>
                                <p className="font-bold text-foreground truncate">{maskName(leaderboard.data[1].name)}</p>
                                <div className="flex items-center justify-between text-xs mt-2">
                                  <span className="text-muted-foreground">Wagered: {formatMoney(leaderboard.data[1].wagered)}</span>
                                  <span className="text-slate-300 font-semibold">Prize: ${activeRewards[1].toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {leaderboard.data[2] && (
                          <div className="relative rounded-2xl border border-amber-700/40 bg-card overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-700" />
                            <div className="p-4 flex items-center gap-4">
                              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-700/50 flex-shrink-0">
                                <img src={getAvatarUrl(leaderboard.data[2].avatar)} alt={leaderboard.data[2].name} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-user.jpg' }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold uppercase tracking-widest text-amber-500">3rd Place</span>
                                </div>
                                <p className="font-bold text-foreground truncate">{maskName(leaderboard.data[2].name)}</p>
                                <div className="flex items-center justify-between text-xs mt-2">
                                  <span className="text-muted-foreground">Wagered: {formatMoney(leaderboard.data[2].wagered)}</span>
                                  <span className="text-amber-500 font-semibold">Prize: ${activeRewards[2].toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Desktop: All three side by side */}
                      <div className="hidden md:grid md:grid-cols-3 gap-4">
                        {leaderboard.data[1] && (
                          <div className="relative rounded-2xl border border-slate-400/40 bg-card overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-400" />
                            <div className="p-6 flex flex-col items-center text-center gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold uppercase tracking-widest text-slate-300">2nd Place</span>
                              </div>
                              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-slate-400/50">
                                <img src={getAvatarUrl(leaderboard.data[1].avatar)} alt={leaderboard.data[1].name} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-user.jpg' }} />
                              </div>
                              <p className="font-bold text-lg text-foreground truncate w-full">{maskName(leaderboard.data[1].name)}</p>
                              <div className="w-full space-y-2">
                                <div className="flex items-center justify-between text-sm bg-muted/40 rounded-lg px-3 py-2">
                                  <span className="text-muted-foreground">Wagered</span>
                                  <span className="font-semibold text-foreground">{formatMoney(leaderboard.data[1].wagered)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm bg-slate-400/10 rounded-lg px-3 py-2 border border-slate-400/30">
                                  <span className="text-slate-300">Prize</span>
                                  <span className="font-semibold text-slate-300">${activeRewards[1].toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {leaderboard.data[0] && (
                          <div className="relative rounded-2xl border border-yellow-400/50 bg-card overflow-hidden order-first md:order-none" style={{ boxShadow: '0 0 40px rgba(250,204,21,0.2)' }}>
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-yellow-400" />
                            <div className="p-6 flex flex-col items-center text-center gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold uppercase tracking-widest text-yellow-400">1st Place</span>
                                <Trophy className="h-4 w-4 text-yellow-400" />
                              </div>
                              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-yellow-400/70" style={{ boxShadow: '0 0 20px rgba(250,204,21,0.3)' }}>
                                <img src={getAvatarUrl(leaderboard.data[0].avatar)} alt={leaderboard.data[0].name} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-user.jpg' }} />
                              </div>
                              <p className="font-bold text-xl text-foreground truncate w-full">{maskName(leaderboard.data[0].name)}</p>
                              <div className="w-full space-y-2">
                                <div className="flex items-center justify-between text-sm bg-muted/40 rounded-lg px-3 py-2">
                                  <span className="text-muted-foreground">Wagered</span>
                                  <span className="font-semibold text-foreground">{formatMoney(leaderboard.data[0].wagered)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm bg-yellow-400/10 rounded-lg px-3 py-2 border border-yellow-400/30">
                                  <span className="text-yellow-400">Prize</span>
                                  <span className="font-semibold text-yellow-400">${activeRewards[0].toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {leaderboard.data[2] && (
                          <div className="relative rounded-2xl border border-amber-700/40 bg-card overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-700" />
                            <div className="p-6 flex flex-col items-center text-center gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold uppercase tracking-widest text-amber-500">3rd Place</span>
                              </div>
                              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-amber-700/50">
                                <img src={getAvatarUrl(leaderboard.data[2].avatar)} alt={leaderboard.data[2].name} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-user.jpg' }} />
                              </div>
                              <p className="font-bold text-lg text-foreground truncate w-full">{maskName(leaderboard.data[2].name)}</p>
                              <div className="w-full space-y-2">
                                <div className="flex items-center justify-between text-sm bg-muted/40 rounded-lg px-3 py-2">
                                  <span className="text-muted-foreground">Wagered</span>
                                  <span className="font-semibold text-foreground">{formatMoney(leaderboard.data[2].wagered)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm bg-amber-700/10 rounded-lg px-3 py-2 border border-amber-700/30">
                                  <span className="text-amber-500">Prize</span>
                                  <span className="font-semibold text-amber-500">${activeRewards[2].toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Full Leaderboard List */}
                    <div className="space-y-3">
                      <h2 className="text-2xl font-bold">Full Rankings</h2>
                      {leaderboard.data.map((entry, index) => (
                        <div key={entry.userId} className="flex items-center gap-4 p-4 rounded-lg bg-card/50 border border-border/40 hover:border-primary/40 transition-colors">
                          <div className="text-center min-w-[3rem]">
                            <p className="text-sm font-bold text-muted-foreground">#{index + 1}</p>
                          </div>
                          <div className="relative w-12 h-12 rounded-full overflow-hidden border border-border flex-shrink-0">
                            <img src={getAvatarUrl(entry.avatar)} alt={entry.name} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-user.jpg' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">{maskName(entry.name)}</p>
                            <p className="text-xs text-muted-foreground">Wagered: {formatMoney(entry.wagered)}</p>
                          </div>
                          {index < activeRewards.length && activeRewards[index] > 0 && (
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-bold text-primary">${activeRewards[index].toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">Prize</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </section>
    </div>
  )
}
