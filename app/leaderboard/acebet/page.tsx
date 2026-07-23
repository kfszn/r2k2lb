'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trophy, Clock, TrendingUp, Users, Search, ChevronDown } from 'lucide-react'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Header } from '@/components/header'
import { GoalTracker } from '@/components/goal-tracker'
import {
  LeaderboardBackdrop,
  StatCard,
  PodiumCard,
  PlayerRow,
  TableHeader,
  PrizePool,
} from '@/components/leaderboard/leaderboard-ui'

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

// Prize pool: $20,000 total — top 15 paid spots (11th–15th = $40 Bonus Buy)
const REWARDS = [7000, 3500, 2750, 2000, 1500, 1250, 1000, 645, 250, 100, 1, 1, 1, 1, 1]
const REWARD_LABELS: (string | null)[] = [null, null, null, null, null, null, null, null, null, null, '$40 Bonus Buy', '$40 Bonus Buy', '$40 Bonus Buy', '$40 Bonus Buy', '$40 Bonus Buy']

interface MonthConfig {
  label: string
  start_at: string
  end_at: string
  display: string
  rewards: (number | string)[]
  labels?: (string | null)[]
  total: number
}

// Previous leaderboard months — top 10 paid spots each
const PREVIOUS_MONTHS: MonthConfig[] = [
  {
    label: 'January',
    start_at: '2025-12-26',
    end_at: '2026-01-24',
    display: 'Dec 26, 2025 – Jan 24, 2026',
    rewards: [800, 500, 375, 300, 200, 150, 100, 40, 20, 15],
    total: 2500,
  },
  {
    label: 'February',
    start_at: '2026-01-25',
    end_at: '2026-02-23',
    display: 'Jan 25 – Feb 23, 2026',
    rewards: [1000, 600, 400, 300, 250, 150, 120, 90, 60, 30],
    total: 3000,
  },
  {
    label: 'March',
    start_at: '2026-02-24',
    end_at: '2026-03-25',
    display: 'Feb 24 – Mar 25, 2026',
    rewards: [3200, 1650, 1000, 550, 250, 150, 95, 75, 30],
    total: 7000,
  },
  {
    label: 'April',
    start_at: '2026-03-26',
    end_at: '2026-04-24',
    display: 'Mar 26 – Apr 24, 2026',
    rewards: [4000, 2000, 1250, 1000, 650, 450, 300, 200, 100, 50],
    total: 10000,
  },
  {
    label: 'May',
    start_at: '2026-04-27',
    end_at: '2026-05-27',
    display: 'Apr 27 – May 27, 2026',
    rewards: [6000, 4000, 2500, 2000, 1500, 1250, 1000, 500, 400, 300, 200, 150, 100, 50, 50],
    total: 20000,
  },
  {
    label: 'June',
    start_at: '2026-05-27',
    end_at: '2026-06-27',
    display: 'May 27 – Jun 27, 2026',
    rewards: [7000, 3500, 2750, 2000, 1500, 1250, 1000, 645, 250, 100, 1, 1, 1, 1, 1],
    labels: [null, null, null, null, null, null, null, null, null, null, '$40 Bonus Buy', '$40 Bonus Buy', '$40 Bonus Buy', '$40 Bonus Buy', '$40 Bonus Buy'],
    total: 20000,
  },
]

export default function AcebetLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('current') // 'current' | month label
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [dateRange, setDateRange] = useState<string>('Loading...')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const showPrevious = selectedMonth !== 'current'

  const activeMonthConfig = PREVIOUS_MONTHS.find(m => m.label === selectedMonth) ?? null
  const activeRewards = showPrevious ? (activeMonthConfig?.rewards ?? []) : REWARDS
  const activeLabels = showPrevious ? (activeMonthConfig?.labels ?? null) : REWARD_LABELS
  const activeTotal = showPrevious ? (activeMonthConfig?.total ?? 0) : 20000

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
          // Dates TBD — show empty state
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

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return
    const handler = () => setDropdownOpen(false)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [dropdownOpen])

  // Compute time remaining immediately (not just inside setInterval)
  const computeTimeRemaining = (month: string) => {
    if (month !== 'current') return 'Ended'
    const endTime = new Date('2026-07-30T19:00:00Z').getTime()
    const diff = endTime - Date.now()
    if (diff <= 0) return 'Ended'
    const days = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
    if (minutes > 0) return `${minutes}m ${seconds}s`
    return `${seconds}s`
  }

  useEffect(() => {
    // Show the correct date range label for whichever period is selected
    if (selectedMonth !== 'current') {
      const found = PREVIOUS_MONTHS.find(m => m.label === selectedMonth)
      if (found) setDateRange(`${found.display}`)
    } else {
      setDateRange(`Jun 29 – Jul 30, 2026`)
    }

    // Set immediately so there's no blank flash
    setTimeRemaining(computeTimeRemaining(selectedMonth))

    const interval = setInterval(() => {
      setTimeRemaining(computeTimeRemaining(selectedMonth))
    }, 1000)
    
    return () => clearInterval(interval)
  }, [selectedMonth])

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
    
    // Check if it's the anonymous/default avatar path
    if (avatar.includes('avatar-anonymous') || avatar === '/assets/common/avatar-anonymous.png') {
      return '/assets/r2k2-circular-avatar.png'
    }
    
    // If it's already a full URL, use it directly and let the browser handle CORS
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      // Strip the hash fragment which can cause issues
      const url = avatar.split('#')[0]
      return url
    }
    
    // If it's a relative path, construct the full Acebet URL
    return `https://acebet.com${avatar.startsWith('/') ? avatar : '/' + avatar}`
  }

  const totalWagered = leaderboard?.data.reduce((sum, entry) => sum + entry.wagered, 0) || 0

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <LeaderboardBackdrop />
      <GiveawayCounter />
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary animate-fade-in-up">
              Live Competition
            </span>
            <img
              src="/assets/rainbet.png"
              alt="AceBet"
              className="h-24 md:h-28 w-auto max-w-[180px] mx-auto object-contain rounded-2xl animate-fade-in-up animation-delay-100 drop-shadow-[0_0_25px_rgba(80,120,255,0.35)]"
            />
            <div className="flex justify-center animate-fade-in-up animation-delay-200">
              <PrizePool total={`$${activeTotal.toLocaleString()}`} />
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight animate-fade-in-up animation-delay-200" suppressHydrationWarning>
              Monthly <span className="neon-text text-primary">Leaderboard</span>
            </h1>
            <div className="flex justify-center">
              <a
                href="https://acebet.co/affiliates/creator/r2k2?leaderboardId=427"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold shadow-[0_0_30px_-8px_rgba(80,120,255,0.7)] hover:shadow-[0_0_40px_-6px_rgba(80,120,255,0.9)]"
              >
                <Trophy className="h-4 w-4" />
                View on AceBet
              </a>
            </div>
            <div className="mt-4 p-4 rounded-lg bg-card/50 backdrop-blur-xl border border-border">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Raw Wager Statistics:</strong> These are raw wager stats. Please use these to view your wager amounts for reward purposes. Refer to the link above for the point values and official placement.
              </p>
            </div>
            <p className="text-lg text-muted-foreground">
              Every <strong>BET</strong> on AceBet under Code <strong>R2K2</strong> counts towards your score.
              <br />
              <em className="text-sm">{dateRange}</em>
            </p>
            
            <div className="flex flex-wrap justify-center gap-2 text-sm font-semibold">
              {activeRewards.map((prize, i) => {
                const ordinals = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th','13th','14th','15th']
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
                  'bg-orange-400/20 border-orange-400/40 text-orange-300',
                  'bg-rose-400/20 border-rose-400/40 text-rose-300',
                  'bg-teal-400/20 border-teal-400/40 text-teal-300',
                  'bg-indigo-400/20 border-indigo-400/40 text-indigo-300',
                  'bg-indigo-400/20 border-indigo-400/40 text-indigo-300',
                ]
                const customLabel = activeLabels?.[i]
                const displayValue = customLabel ?? `$${typeof prize === 'number' ? prize.toLocaleString() : prize}`
                return (
                  <span key={i} className={`px-3 py-1 rounded-full border ${colors[i] ?? colors[colors.length - 1]}`}>
                    {ordinals[i]} — {displayValue}
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
            <StatCard
              label="Total Wagered"
              value={formatMoney(totalWagered)}
              icon={<TrendingUp className="h-5 w-5" />}
              tone="primary"
            />
            <StatCard
              label="Participants"
              value={leaderboard.count.toLocaleString()}
              icon={<Users className="h-5 w-5" />}
              tone="accent"
            />

            <GoalTracker
              current={totalWagered}
              goal={400000000}
              formatMoney={formatMoney}
              label="Wager Goal"
            />

            {!showPrevious && (
              <StatCard
                label="Time Remaining"
                value={timeRemaining || '...'}
                icon={<Clock className="h-5 w-5" />}
                tone="destructive"
              />
            )}
          </div>
        </section>
      )}

      {/* Controls */}
      <section className="py-6 border-b border-border/40">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center items-center">
            {/* Current tab */}
            <Button
              variant={!showPrevious ? 'default' : 'outline'}
              onClick={() => { setSelectedMonth('current'); loadLeaderboard('current') }}
              className={!showPrevious ? '' : 'bg-transparent'}
            >
              Current Leaderboard
            </Button>

            {/* Previous months dropdown */}
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
                <div className="absolute top-full mt-1 left-0 z-50 min-w-[180px] rounded-xl border border-border bg-card/90 backdrop-blur-xl shadow-2xl overflow-hidden">
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

          {/* Selected month label */}
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
                      <h2 className="mb-8 text-center text-2xl font-bold">
                        <span className="neon-text text-primary">Top</span> Performers
                      </h2>
                      {/* Mobile: 1st on top, 2nd+3rd side by side. Desktop: all three side by side with 1st in center */}
                      <div className="flex flex-col gap-3 md:hidden">
                        {leaderboard.data[0] && (
                          <PodiumCard
                            rank={1}
                            size="md"
                            name={maskName(leaderboard.data[0].name)}
                            avatar={getAvatarUrl(leaderboard.data[0].avatar)}
                            wagered={formatMoney(leaderboard.data[0].wagered)}
                            prize={`$${activeRewards[0]?.toLocaleString() ?? '—'}`}
                            fallback="/placeholder-user.jpg"
                          />
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          {leaderboard.data[1] && (
                            <PodiumCard
                              rank={2}
                              size="sm"
                              name={maskName(leaderboard.data[1].name)}
                              avatar={getAvatarUrl(leaderboard.data[1].avatar)}
                              wagered={formatMoney(leaderboard.data[1].wagered)}
                              prize={`$${activeRewards[1]?.toLocaleString() ?? '—'}`}
                              fallback="/placeholder-user.jpg"
                            />
                          )}
                          {leaderboard.data[2] && (
                            <PodiumCard
                              rank={3}
                              size="sm"
                              name={maskName(leaderboard.data[2].name)}
                              avatar={getAvatarUrl(leaderboard.data[2].avatar)}
                              wagered={formatMoney(leaderboard.data[2].wagered)}
                              prize={`$${activeRewards[2]?.toLocaleString() ?? '—'}`}
                              fallback="/placeholder-user.jpg"
                            />
                          )}
                        </div>
                      </div>

                      {/* Desktop: 2nd | 1st | 3rd */}
                      <div className="hidden md:flex items-end justify-center gap-4">
                        {leaderboard.data[1] && (
                          <div className="flex-1 max-w-[220px]">
                            <PodiumCard
                              rank={2}
                              size="md"
                              name={maskName(leaderboard.data[1].name)}
                              avatar={getAvatarUrl(leaderboard.data[1].avatar)}
                              wagered={formatMoney(leaderboard.data[1].wagered)}
                              prize={`$${activeRewards[1]?.toLocaleString() ?? '—'}`}
                              fallback="/placeholder-user.jpg"
                            />
                          </div>
                        )}
                        {leaderboard.data[0] && (
                          <div className="flex-1 max-w-[280px]">
                            <PodiumCard
                              rank={1}
                              size="lg"
                              name={maskName(leaderboard.data[0].name)}
                              avatar={getAvatarUrl(leaderboard.data[0].avatar)}
                              wagered={formatMoney(leaderboard.data[0].wagered)}
                              prize={`$${activeRewards[0]?.toLocaleString() ?? '—'}`}
                              fallback="/placeholder-user.jpg"
                            />
                          </div>
                        )}
                        {leaderboard.data[2] && (
                          <div className="flex-1 max-w-[220px]">
                            <PodiumCard
                              rank={3}
                              size="md"
                              name={maskName(leaderboard.data[2].name)}
                              avatar={getAvatarUrl(leaderboard.data[2].avatar)}
                              wagered={formatMoney(leaderboard.data[2].wagered)}
                              prize={`$${activeRewards[2]?.toLocaleString() ?? '—'}`}
                              fallback="/placeholder-user.jpg"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                      <input
                        type="text"
                        placeholder="Search your exact username to see your wager amount..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-card/60 backdrop-blur-xl border border-border text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:shadow-[0_0_25px_-8px_rgba(80,120,255,0.6)] transition-all"
                      />
                    </div>

                    {/* Search Results */}
                    {searchQuery.trim() && (() => {
                      const q = searchQuery.trim().toLowerCase()
                      const matches = leaderboard.data.filter(e => e.name?.toLowerCase() === q)
                      if (matches.length === 0) {
                        return (
                          <div className="text-center py-4 rounded-xl bg-muted/30 border border-border text-sm text-muted-foreground">
                            No user found with that exact username. Usernames are case-insensitive but must be exact.
                          </div>
                        )
                      }
                      return (
                        <div className="space-y-2">
                          {matches.map((entry) => {
                            const rank = leaderboard.data.findIndex(e => e.userId === entry.userId) + 1
                            return (
                              <div key={entry.userId} className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-bold text-primary">#{rank}</span>
                                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-primary/30">
                                    <img
                                      src={getAvatarUrl(entry.avatar)}
                                      alt={entry.name}
                                      className="absolute inset-0 w-full h-full object-cover"
                                      crossOrigin="anonymous"
                                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-user.jpg' }}
                                    />
                                  </div>
                                  <span className="font-semibold text-sm text-foreground">{maskName(entry.name)}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Wagered</p>
                                    <p className="font-bold text-foreground">{formatMoney(entry.wagered)}</p>
                                  </div>
                                  {rank <= activeRewards.length && activeRewards[rank - 1] != null && (
                                    <div className="text-right">
                                      <p className="text-xs text-muted-foreground">Prize</p>
                                      <p className="font-bold text-green-600">
                                        {activeLabels?.[rank - 1] ?? `$${(activeRewards[rank - 1] as number).toLocaleString()}`}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}

                    {/* Rest of leaderboard */}
                    <div className="overflow-hidden rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl">
                      <TableHeader />
                      {/* Rows */}
                      <div className="divide-y divide-border/30">
                        {leaderboard.data.slice(3, activeRewards.length).map((entry, idx) => {
                          const reward = activeRewards[idx + 3] as number
                          const rewardLabel = activeLabels?.[idx + 3]
                          return (
                            <PlayerRow
                              key={entry.userId}
                              rank={idx + 4}
                              name={maskName(entry.name)}
                              avatar={getAvatarUrl(entry.avatar)}
                              wagered={formatMoney(entry.wagered)}
                              prize={rewardLabel ?? (reward != null ? `$${reward.toLocaleString()}` : '—')}
                              fallback="/placeholder-user.jpg"
                            />
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <p className="text-sm text-muted-foreground">© 2026 R2K2<br />All Rights Reserved</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Socials</h3>
              <div className="space-y-2">
                <a href="https://kick.com/R2Ktwo" target="_blank" rel="noopener" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Kick</a>
                <a href="https://discord.gg/DwpA8vaGPj" target="_blank" rel="noopener" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Discord</a>
              </div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h3 className="font-semibold mb-4">Responsible Gaming</h3>
              <p className="text-xs text-muted-foreground">
                Remember: Gambling over a long period will always result in losses. Please set limits and gamble responsibly.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
