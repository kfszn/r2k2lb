'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Header } from '@/components/header'
import { Loader2, Trophy, TrendingUp } from 'lucide-react'

interface LeaderboardEntry {
  username: string;
  wagerAmount: number;
  image?: string;
  avatar?: string;
  userId?: string;
}

export default function PackdrawLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/packdraw')
      const data = await res.json()
      
      console.log('[v0] Packdraw API response:', data)
      
      // Handle different possible response formats
      let leaderboardData: LeaderboardEntry[] = []
      
      if (Array.isArray(data)) {
        leaderboardData = data
      } else if (data.leaderboard && Array.isArray(data.leaderboard)) {
        // Map the API response to our interface format
        leaderboardData = data.leaderboard.map((item: any) => ({
          username: item.username,
          wagerAmount: item.wagerAmount,
          image: item.image,
          avatar: item.image,
          userId: item.userId,
        }))
      } else if (data.entries && Array.isArray(data.entries)) {
        leaderboardData = data.entries
      } else if (data.data && Array.isArray(data.data)) {
        leaderboardData = data.data
      }
      
      setEntries(leaderboardData.slice(0, 10))
    } catch (e) {
      console.error('[v0] Failed to fetch Packdraw leaderboard:', e)
      setError('Failed to fetch leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const maskName = (name: string) => {
    if (!name || name.length <= 3) return name
    return name.slice(0, 2) + '*'.repeat(name.length - 3) + name.slice(-1)
  }

  const getAvatarUrl = (avatar: string | null | undefined, userId?: string) => {
    if (!avatar && !userId) return '/placeholder.svg'
    // If it's already a full URL, return as is
    if (avatar && (avatar.startsWith('http://') || avatar.startsWith('https://'))) {
      return avatar
    }
    // If we have a userId and image ID, construct the Packdraw avatar URL
    if (userId && avatar) {
      return `https://packdraw.com/api/v1/avatar/${avatar}`
    }
    // If it's a relative path, construct the full Packdraw URL
    if (avatar && !avatar.includes('/')) {
      return `https://packdraw.com/api/v1/avatar/${avatar}`
    }
    if (avatar) {
      return `https://packdraw.com${avatar.startsWith('/') ? avatar : '/' + avatar}`
    }
    return '/placeholder.svg'
  }

  const totalWagered = entries.reduce((sum, entry: any) => sum + (entry.wagerAmount || 0), 0)
  
  // Calculate time remaining (30 day period from 1-17-2026)
  const [timeRemaining, setTimeRemaining] = useState('')
  
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const startDate = new Date('2026-01-17T00:00:00.000Z')
      const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
      const now = new Date()
      const diff = endDate.getTime() - now.getTime()
      
      if (diff <= 0) {
        setTimeRemaining('Period Ended')
        return
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`)
    }
    
    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)
    return () => clearInterval(interval)
  }, [])

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
              <span className="text-3xl font-bold text-primary">$2,000</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Monthly Code <span className="text-primary">R2K2</span> Leaderboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Every <strong>PACK</strong> opened on Packdraw under Code <strong>R2K2</strong> counts towards your score.
              <br />
              <em className="text-sm">The leaderboard updates in real-time.</em>
            </p>
            <div className="inline-block px-4 py-2 bg-destructive/10 border border-destructive/40 rounded-lg">
              <p className="text-destructive font-bold">It Only Takes One!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
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
          
          <Card className="bg-card/50 backdrop-blur border-destructive/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground uppercase font-medium mb-1">Time Remaining</p>
                  <p className="text-3xl font-bold text-destructive">{timeRemaining || 'Loading...'}</p>
                </div>
                <Trophy className="h-12 w-12 text-destructive/40" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Leaderboard */}
      {!loading && entries.length > 0 && (
        <section className="py-12 pb-20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto space-y-6">
            </div>
          </div>
        </section>
      )}

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
              <div className="text-center py-12">
                <p className="text-destructive text-lg">{error}</p>
              </div>
            )}

            {!loading && !error && entries.length > 0 && (
              <>
                {/* Podium Top 3 */}
                <div className="mb-16">
                  <h2 className="text-2xl font-bold text-center mb-12">Top Performers</h2>
                  <div className="flex items-end justify-center gap-4 md:gap-6">
                    {/* 2nd Place */}
                    {entries[1] && (
                      <div className="flex flex-col items-center">
                        <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-silver mb-4 shadow-lg hover:scale-110 transition-transform">
                          <Image
                            src={getAvatarUrl(entries[1].avatar, entries[1].userId)}
                            alt={entries[1].username}
                            fill
                            className="object-cover"
                            crossOrigin="anonymous"
                            onError={(e) => { e.currentTarget.src = '/placeholder.svg' }}
                          />
                        </div>
                        <div className="bg-gradient-to-b from-slate-400 to-slate-600 rounded-t-2xl px-4 py-6 text-center w-32 md:w-40 shadow-xl border-4 border-slate-400">
                          <div className="text-3xl md:text-4xl font-bold text-white mb-2">🥈</div>
                          <p className="font-bold text-white truncate">{maskName(entries[1].username)}</p>
                          <p className="text-xs md:text-sm text-slate-100 mb-2">{formatMoney(entries[1].wagerAmount || 0)}</p>
                          <div className="bg-black/30 rounded px-2 py-1">
                            <p className="text-lg md:text-xl font-bold text-green-400">${REWARDS[1]}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 1st Place */}
                    {entries[0] && (
                      <div className="flex flex-col items-center -mb-4">
                        <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-yellow-400 mb-4 shadow-2xl hover:scale-110 transition-transform" style={{ boxShadow: '0 0 30px rgba(250, 204, 21, 0.6)' }}>
                          <Image
                            src={getAvatarUrl(entries[0].avatar, entries[0].userId)}
                            alt={entries[0].username}
                            fill
                            className="object-cover"
                            crossOrigin="anonymous"
                            onError={(e) => { e.currentTarget.src = '/placeholder.svg' }}
                          />
                        </div>
                        <div className="bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-t-2xl px-6 py-8 text-center w-40 md:w-48 shadow-2xl border-4 border-yellow-400" style={{ boxShadow: '0 10px 40px rgba(250, 204, 21, 0.4)' }}>
                          <div className="text-4xl md:text-5xl font-bold mb-2">👑</div>
                          <p className="font-bold text-gray-900 truncate text-lg">{maskName(entries[0].username)}</p>
                          <p className="text-xs md:text-sm text-gray-800 mb-2">{formatMoney(entries[0].wagerAmount || 0)}</p>
                          <div className="bg-black/20 rounded px-2 py-1">
                            <p className="text-2xl md:text-3xl font-bold text-green-600">${REWARDS[0]}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3rd Place */}
                    {entries[2] && (
                      <div className="flex flex-col items-center">
                        <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-amber-700 mb-4 shadow-lg hover:scale-110 transition-transform">
                          <Image
                            src={getAvatarUrl(entries[2].avatar, entries[2].userId)}
                            alt={entries[2].username}
                            fill
                            className="object-cover"
                            crossOrigin="anonymous"
                            onError={(e) => { e.currentTarget.src = '/placeholder.svg' }}
                          />
                        </div>
                        <div className="bg-gradient-to-b from-amber-600 to-amber-800 rounded-t-2xl px-4 py-6 text-center w-32 md:w-40 shadow-xl border-4 border-amber-600">
                          <div className="text-3xl md:text-4xl font-bold text-white mb-2">🥉</div>
                          <p className="font-bold text-white truncate">{maskName(entries[2].username)}</p>
                          <p className="text-xs md:text-sm text-amber-100 mb-2">{formatMoney(entries[2].wagerAmount || 0)}</p>
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
                    {entries.slice(0, 3).map((entry, idx) => (
                      <TopCard
                        key={idx}
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
                  {entries.slice(3, 10).map((entry, idx) => (
                    <LeaderboardRow
                      key={idx}
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

            {!loading && !error && entries.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No leaderboard data available</p>
              </div>
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
  entry: any
  reward: number
  formatMoney: (n: number) => string
  maskName: (s: string) => string
  getAvatarUrl: (a: string | null | undefined, u?: string) => string
}) {
  const colors = ['#FFD700', '#C0C0C0', '#CD7F32']
  const color = colors[rank - 1]
  
  return (
    <Card className="relative overflow-hidden group hover:scale-105 transition-transform" style={{ boxShadow: `0 0 40px ${color}` }}>
      <CardContent className="p-6 text-center space-y-4">
        <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-lg font-bold text-2xl" style={{ background: color, color: '#000' }}>
          #{rank}
        </div>
        
        <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden border-4" style={{ borderColor: color }}>
          <Image
            src={getAvatarUrl(entry.avatar, entry.userId)}
            alt={entry.username}
            fill
            className="object-cover"
            crossOrigin="anonymous"
            onError={(e) => { e.currentTarget.src = '/placeholder.svg' }}
          />
        </div>
        
        <div>
          <p className="text-lg font-bold">{maskName(entry.username)}</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Wagered:</span>
            <span className="font-bold text-foreground">{formatMoney(entry.wagerAmount || 0)}</span>
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
  entry: any
  reward: number
  formatMoney: (n: number) => string
  maskName: (s: string) => string
  getAvatarUrl: (a: string | null | undefined, u?: string) => string
}) {
  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/10 transition-all">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-muted-foreground w-12">#{rank}</div>
          
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
            <Image
              src={getAvatarUrl(entry.avatar, entry.userId)}
              alt={entry.username}
              fill
              className="object-cover"
              crossOrigin="anonymous"
              onError={(e) => { e.currentTarget.src = '/placeholder.svg' }}
            />
          </div>
          
          <div className="flex-1">
            <p className="font-bold">{maskName(entry.username)}</p>
          </div>
          
          <div className="flex gap-8 items-center">
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase">Wagered</p>
              <p className="text-lg font-bold text-foreground">{formatMoney(entry.wagerAmount || 0)}</p>
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

const REWARDS = [1000, 550, 250, 150, 50, 0, 0, 0, 0, 0]
