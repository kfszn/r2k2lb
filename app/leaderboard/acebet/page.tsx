'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Clock, DollarSign, TrendingUp, Users, Search } from 'lucide-react'
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

// Prize pool: $10,000 total - proper descending order 1-10
const REWARDS = [4000, 2000, 1250, 1000, 650, 450, 300, 200, 100, 50]

export default function AcebetLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPrevious, setShowPrevious] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>('Loading...')
  const [dateRange, setDateRange] = useState<string>('Loading...')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const loadLeaderboard = async (previous: boolean) => {
    setLoading(true)
    setError(null)
    try {
      const url = previous ? '/api/leaderboard?prev=1' : '/api/leaderboard'
      const res = await fetch(url)
      const data = await res.json()
      if (data.ok) {
        setLeaderboard(data)
        setShowPrevious(previous)
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
    loadLeaderboard(false)
  }, [])

  useEffect(() => {
    if (!leaderboard) return

    // Hardcoded cycle: Mar 28 - Apr 27, 2026
    setDateRange(`Mar 28 - Apr 27, 2026 • 11am EST End`)

    const interval = setInterval(() => {
      // Countdown ends Apr 27, 2026 at 11am EST (4pm UTC)
      const endTime = new Date('2026-04-27T16:00:00Z').getTime()
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
  }, [leaderboard])

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
    <div className="min-h-screen bg-background text-foreground">
      <GiveawayCounter />
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/20 border border-primary/40">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="text-3xl font-bold text-primary">$10,000</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight" suppressHydrationWarning>
              AceBet <span className="text-primary">$10,000</span> Monthly Leaderboard
            </h1>
            <div className="flex justify-center">
              <a
                href="https://acebet.co/affiliates/creator/r2k2?leaderboardId=306"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors font-semibold"
              >
                <Trophy className="h-4 w-4" />
                View on AceBet
              </a>
            </div>
            <div className="mt-4 p-4 rounded-lg bg-muted/40 border border-border">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Raw Wager Statistics:</strong> These are raw wager stats. Please use these to view your wager amounts for reward purposes. Refer to the link above for the point values and official placement.
              </p>
            </div>
            <p className="text-lg text-muted-foreground">
              Every <strong>BET</strong> on AceBet under Code <strong>R2K2</strong> counts towards your score.
              <br />
              <em className="text-sm">{dateRange}</em>
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 text-sm font-semibold">
              <span className="px-3 py-1 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-400">1st — $4,000</span>
              <span className="px-3 py-1 rounded-full bg-slate-400/20 border border-slate-400/40 text-slate-300">2nd — $2,000</span>
              <span className="px-3 py-1 rounded-full bg-amber-700/20 border border-amber-700/40 text-amber-500">3rd — $1,250</span>
              <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary">4th — $1,000</span>
              <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/40 text-green-400">5th — $650</span>
              <span className="px-3 py-1 rounded-full bg-blue-400/20 border border-blue-400/40 text-blue-300">6th — $450</span>
              <span className="px-3 py-1 rounded-full bg-purple-400/20 border border-purple-400/40 text-purple-300">7th — $300</span>
              <span className="px-3 py-1 rounded-full bg-pink-400/20 border border-pink-400/40 text-pink-300">8th — $200</span>
              <span className="px-3 py-1 rounded-full bg-cyan-400/20 border border-cyan-400/40 text-cyan-300">9th — $100</span>
              <span className="px-3 py-1 rounded-full bg-lime-400/20 border border-lime-400/40 text-lime-300">10th — $50</span>
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
              goal={180000000}
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
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => loadLeaderboard(true)}
              disabled={showPrevious}
              className="bg-transparent"
            >
              Previous Leaderboard
            </Button>
            <Button
              variant="outline"
              onClick={() => loadLeaderboard(false)}
              disabled={!showPrevious}
              className="bg-transparent"
            >
              Current Leaderboard
            </Button>
          </div>
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
                ) : (
                  <>
                    {/* Podium Top 3 */}
                    <div className="mb-10">
                      <h2 className="text-2xl font-bold text-center mb-8">Top Performers</h2>
                      <div className="flex items-end justify-center gap-3">

                        {/* 2nd Place — left */}
                        {leaderboard.data[1] && (
                          <div className="relative rounded-2xl border border-slate-400/40 bg-card overflow-hidden flex-1 max-w-[220px]" style={{ boxShadow: '0 0 20px rgba(148,163,184,0.1)' }}>
                            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-400" />
                            <div className="p-5 flex flex-col items-center text-center gap-3">
                              <span className="text-xs font-bold uppercase tracking-widest text-slate-300">2nd Place</span>
                              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-slate-400/60">
                                <img
                                  src={getAvatarUrl(leaderboard.data[1].avatar)}
                                  alt={leaderboard.data[1].name}
                                  className="absolute inset-0 w-full h-full object-cover"
                                  crossOrigin="anonymous"
                                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-user.jpg' }}
                                />
                              </div>
                              <p className="font-bold text-sm text-foreground truncate w-full">{maskName(leaderboard.data[1].name)}</p>
                              <div className="w-full space-y-1.5">
                                <div className="flex items-center justify-between text-xs bg-muted/40 rounded-lg px-3 py-1.5">
                                  <span className="text-muted-foreground">Wagered</span>
                                  <span className="font-semibold text-foreground">{formatMoney(leaderboard.data[1].wagered)}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs bg-slate-400/10 border border-slate-400/20 rounded-lg px-3 py-1.5">
                                  <span className="text-slate-400/80">Prize</span>
                                  <span className="font-bold text-slate-300">${REWARDS[1].toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 1st Place — center, tallest */}
                        {leaderboard.data[0] && (
                          <div className="relative rounded-2xl border border-yellow-400/50 bg-card overflow-hidden flex-1 max-w-[280px]" style={{ boxShadow: '0 0 40px rgba(250,204,21,0.2)' }}>
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-yellow-400" />
                            <div className="p-7 flex flex-col items-center text-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold uppercase tracking-widest text-yellow-400">1st Place</span>
                                <Trophy className="h-4 w-4 text-yellow-400" />
                              </div>
                              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-yellow-400/70" style={{ boxShadow: '0 0 20px rgba(250,204,21,0.3)' }}>
                                <img
                                  src={getAvatarUrl(leaderboard.data[0].avatar)}
                                  alt={leaderboard.data[0].name}
                                  className="absolute inset-0 w-full h-full object-cover"
                                  crossOrigin="anonymous"
                                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-user.jpg' }}
                                />
                              </div>
                              <p className="font-bold text-xl text-foreground truncate w-full">{maskName(leaderboard.data[0].name)}</p>
                              <div className="w-full space-y-2">
                                <div className="flex items-center justify-between text-sm bg-muted/40 rounded-lg px-3 py-2">
                                  <span className="text-muted-foreground">Wagered</span>
                                  <span className="font-semibold text-foreground">{formatMoney(leaderboard.data[0].wagered)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-3 py-2">
                                  <span className="text-yellow-400/80">Prize</span>
                                  <span className="font-bold text-yellow-400 text-lg">${REWARDS[0].toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 3rd Place — right */}
                        {leaderboard.data[2] && (
                          <div className="relative rounded-2xl border border-amber-700/40 bg-card overflow-hidden flex-1 max-w-[220px]" style={{ boxShadow: '0 0 20px rgba(180,83,9,0.1)' }}>
                            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-600" />
                            <div className="p-5 flex flex-col items-center text-center gap-3">
                              <span className="text-xs font-bold uppercase tracking-widest text-amber-500">3rd Place</span>
                              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-600/60">
                                <img
                                  src={getAvatarUrl(leaderboard.data[2].avatar)}
                                  alt={leaderboard.data[2].name}
                                  className="absolute inset-0 w-full h-full object-cover"
                                  crossOrigin="anonymous"
                                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-user.jpg' }}
                                />
                              </div>
                              <p className="font-bold text-sm text-foreground truncate w-full">{maskName(leaderboard.data[2].name)}</p>
                              <div className="w-full space-y-1.5">
                                <div className="flex items-center justify-between text-xs bg-muted/40 rounded-lg px-3 py-1.5">
                                  <span className="text-muted-foreground">Wagered</span>
                                  <span className="font-semibold text-foreground">{formatMoney(leaderboard.data[2].wagered)}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs bg-amber-600/10 border border-amber-600/20 rounded-lg px-3 py-1.5">
                                  <span className="text-amber-500/80">Prize</span>
                                  <span className="font-bold text-amber-500">${REWARDS[2].toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search your exact username to see your wager amount..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
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
                                  {rank <= 10 && REWARDS[rank - 1] && (
                                    <div className="text-right">
                                      <p className="text-xs text-muted-foreground">Prize</p>
                                      <p className="font-bold text-green-400">${REWARDS[rank - 1].toLocaleString()}</p>
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
                    <div className="space-y-3">
                      {leaderboard.data.slice(3, 10).map((entry, idx) => (
                        <LeaderboardRow
                          key={entry.userId}
                          rank={idx + 4}
                          entry={entry}
                          reward={REWARDS[idx + 3]}
                          formatMoney={formatMoney}
                          maskName={maskName}
                          getAvatarUrl={getAvatarUrl}
                        />
                      ))}
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


function LeaderboardRow({ rank, entry, reward, formatMoney, maskName, getAvatarUrl }: {
  rank: number
  entry: LeaderboardEntry
  reward: number
  formatMoney: (n: number) => string
  maskName: (s: string) => string
  getAvatarUrl: (a: string | null) => string
}) {
  const [imgError, setImgError] = useState(false)
  
  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/10 transition-all">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-muted-foreground w-12">#{rank}</div>
          
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
            <img
              src={imgError ? '/placeholder-user.jpg' : getAvatarUrl(entry.avatar)}
              alt={entry.name}
              className="absolute inset-0 w-full h-full object-cover"
              crossOrigin="anonymous"
              onError={() => setImgError(true)}
            />
          </div>
          
          <div className="flex-1">
            <p className="font-bold">{maskName(entry.name)}</p>
          </div>
          
          <div className="flex gap-8 items-center">
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase">Wagered</p>
              <p className="text-lg font-bold text-foreground">{formatMoney(entry.wagered)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase">Prize</p>
              <p className="text-lg font-bold" style={{ color: '#39ff93' }}>${reward}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
