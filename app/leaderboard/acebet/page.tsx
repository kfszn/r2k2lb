'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Clock, DollarSign, TrendingUp } from 'lucide-react'
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

// Prize pool: $10,000 total - 1st: $4k, top 5 total $7k, bottom 5 total $3k
const REWARDS = [4000, 1650, 1050, 550, 200, 1000, 800, 600, 150, 100]

export default function AcebetLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPrevious, setShowPrevious] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>('Loading...')

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
    } catch (e) {
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

    const interval = setInterval(() => {
      // Set end date to 31 days from today at 2pm EST (7pm UTC)
      const today = new Date()
      const endDate = new Date(today.getTime() + 31 * 24 * 60 * 60 * 1000)
      endDate.setUTCHours(19, 0, 0, 0) // 2pm EST = 7pm UTC
      const endTime = endDate.getTime()
      const now = Date.now()
      const diff = endTime - now

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
    if (!avatar) return '/placeholder-user.jpg'
    
    // Check if it's the anonymous/default avatar path
    if (avatar.includes('avatar-anonymous') || avatar === '/assets/common/avatar-anonymous.png') {
      return '/placeholder-user.jpg'
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
              Acebet On Site <span className="text-primary">$10,000</span> Leaderboard
            </h1>
            <div className="flex justify-center">
              <a
                href="https://acebet.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors font-semibold"
              >
                <Trophy className="h-4 w-4" />
                View on Acebet
              </a>
            </div>
            <p className="text-lg text-muted-foreground">
              Every <strong>BET</strong> on Acebet under Code <strong>R2K2</strong> counts towards your score.
              <br />
              <em className="text-sm">31 Days Starting Today • 2pm EST End</em>
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 text-sm font-semibold">
              <span className="px-3 py-1 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-400">1st — $4,000</span>
              <span className="px-3 py-1 rounded-full bg-slate-400/20 border border-slate-400/40 text-slate-300">2nd — $1,650</span>
              <span className="px-3 py-1 rounded-full bg-amber-700/20 border border-amber-700/40 text-amber-500">3rd — $1,050</span>
              <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary">4th — $550</span>
              <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/40 text-green-400">5th — $200</span>
              <span className="px-3 py-1 rounded-full bg-blue-400/20 border border-blue-400/40 text-blue-300">6th — $1,000</span>
              <span className="px-3 py-1 rounded-full bg-purple-400/20 border border-purple-400/40 text-purple-300">7th — $800</span>
              <span className="px-3 py-1 rounded-full bg-pink-400/20 border border-pink-400/40 text-pink-300">8th — $600</span>
              <span className="px-3 py-1 rounded-full bg-cyan-400/20 border border-cyan-400/40 text-cyan-300">9th — $150</span>
              <span className="px-3 py-1 rounded-full bg-lime-400/20 border border-lime-400/40 text-lime-300">10th — $100</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      {leaderboard && (
        <section className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
            <Card className="bg-card/50 backdrop-blur border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase font-medium mb-1">Total Wagered</p>
                    <p className="text-3xl font-bold text-primary">{formatMoney(totalWagered)}</p>
                  </div>
                  <TrendingUp className="h-12 w-12 text-primary/40" />
                </div>
              </CardContent>
            </Card>
            
            <GoalTracker
              current={totalWagered}
              goal={120000000}
              formatMoney={formatMoney}
              label="Goal Progress"
            />
            
            {!showPrevious && (
              <Card className="bg-card/50 backdrop-blur border-destructive/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground uppercase font-medium mb-1">Time Remaining</p>
                      <p className="text-3xl font-bold text-destructive">{timeRemaining || 'Loading...'}</p>
                    </div>
                    <Clock className="h-12 w-12 text-destructive/40" />
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
                    <div className="mb-16">
                      <h2 className="text-2xl font-bold text-center mb-12">Top Performers</h2>
                  <div className="flex items-end justify-center gap-4 md:gap-6">
                    {/* 2nd Place */}
                    {leaderboard.data[1] && (
                      <div className="flex flex-col items-center">
                        <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-silver mb-4 shadow-lg hover:scale-110 transition-transform">
                          <img
                            src={getAvatarUrl(leaderboard.data[1].avatar)}
                            alt={leaderboard.data[1].name}
                            className="absolute inset-0 w-full h-full object-cover"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement
                              img.src = '/placeholder-user.jpg'
                            }}
                          />
                        </div>
                        <div className="bg-gradient-to-b from-slate-400 to-slate-600 rounded-t-2xl px-4 py-6 text-center w-32 md:w-40 shadow-xl border-4 border-slate-400">
                          <div className="text-3xl md:text-4xl font-bold text-white mb-2">🥈</div>
                          <p className="font-bold text-white truncate">{maskName(leaderboard.data[1].name)}</p>
                          <p className="text-xs md:text-sm text-slate-100 mb-2">{formatMoney(leaderboard.data[1].wagered)}</p>
                          <div className="bg-black/30 rounded px-2 py-1">
                            <p className="text-lg md:text-xl font-bold text-green-400">${REWARDS[1]}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 1st Place */}
                    {leaderboard.data[0] && (
                      <div className="flex flex-col items-center -mb-4">
                        <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-yellow-400 mb-4 shadow-2xl hover:scale-110 transition-transform" style={{ boxShadow: '0 0 30px rgba(250, 204, 21, 0.6)' }}>
                          <img
                            src={getAvatarUrl(leaderboard.data[0].avatar)}
                            alt={leaderboard.data[0].name}
                            className="absolute inset-0 w-full h-full object-cover"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement
                              img.src = '/placeholder-user.jpg'
                            }}
                          />
                        </div>
                        <div className="bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-t-2xl px-6 py-8 text-center w-40 md:w-48 shadow-2xl border-4 border-yellow-400" style={{ boxShadow: '0 10px 40px rgba(250, 204, 21, 0.4)' }}>
                          <div className="text-4xl md:text-5xl font-bold mb-2">👑</div>
                          <p className="font-bold text-gray-900 truncate text-lg">{maskName(leaderboard.data[0].name)}</p>
                          <p className="text-xs md:text-sm text-gray-800 mb-2">{formatMoney(leaderboard.data[0].wagered)}</p>
                          <div className="bg-black/20 rounded px-2 py-1">
                            <p className="text-2xl md:text-3xl font-bold text-green-600">${REWARDS[0]}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3rd Place */}
                    {leaderboard.data[2] && (
                      <div className="flex flex-col items-center">
                        <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-amber-700 mb-4 shadow-lg hover:scale-110 transition-transform">
                          <img
                            src={getAvatarUrl(leaderboard.data[2].avatar)}
                            alt={leaderboard.data[2].name}
                            className="absolute inset-0 w-full h-full object-cover"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement
                              img.src = '/placeholder-user.jpg'
                            }}
                          />
                        </div>
                        <div className="bg-gradient-to-b from-amber-600 to-amber-800 rounded-t-2xl px-4 py-6 text-center w-32 md:w-40 shadow-xl border-4 border-amber-600">
                          <div className="text-3xl md:text-4xl font-bold text-white mb-2">🥉</div>
                          <p className="font-bold text-white truncate">{maskName(leaderboard.data[2].name)}</p>
                          <p className="text-xs md:text-sm text-amber-100 mb-2">{formatMoney(leaderboard.data[2].wagered)}</p>
                          <div className="bg-black/30 rounded px-2 py-1">
                            <p className="text-lg md:text-xl font-bold text-green-400">${REWARDS[2]}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top 3 */}
                <div className="hidden">
                  <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {leaderboard.data.slice(0, 3).map((entry, idx) => (
                      <TopCard
                        key={entry.userId}
                        rank={idx + 1}
                        entry={entry}
                        reward={REWARDS[idx]}
                        formatMoney={formatMoney}
                        maskName={maskName}
                        getAvatarUrl={getAvatarUrl}
                      />
                    ))}
                  </div>
                </div>

                {/* Rest */}
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
              <p className="text-sm text-muted-foreground">© 2025 R2K2<br />All Rights Reserved</p>
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

function TopCard({ rank, entry, reward, formatMoney, maskName, getAvatarUrl }: {
  rank: number
  entry: LeaderboardEntry
  reward: number
  formatMoney: (n: number) => string
  maskName: (s: string) => string
  getAvatarUrl: (a: string | null) => string
}) {
  const colors = ['#FFD700', '#C0C0C0', '#CD7F32']
  const color = colors[rank - 1]
  const [imgError, setImgError] = useState(false)
  
  return (
    <Card className="relative overflow-hidden group hover:scale-105 transition-transform" style={{ boxShadow: `0 0 40px ${color}` }}>
      <CardContent className="p-6 text-center space-y-4">
        <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-lg font-bold text-2xl" style={{ background: color, color: '#000' }}>
          #{rank}
        </div>
        
        <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden border-4" style={{ borderColor: color }}>
          <img
            src={imgError ? '/placeholder-user.jpg' : getAvatarUrl(entry.avatar)}
            alt={entry.name}
            className="absolute inset-0 w-full h-full object-cover"
            crossOrigin="anonymous"
            onError={() => setImgError(true)}
          />
        </div>
        
        <div>
          <p className="text-lg font-bold">{maskName(entry.name)}</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Wagered:</span>
            <span className="font-bold text-foreground">{formatMoney(entry.wagered)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Prize:</span>
            <span className="font-bold" style={{ color: '#39ff93' }}>${reward}</span>
          </div>
        </div>
      </CardContent>
    </Card>
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
