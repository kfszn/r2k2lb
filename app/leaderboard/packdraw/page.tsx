'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, TrendingUp, Clock, ArrowLeft, Loader2 } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  name: string
  avatar?: string
  wagered: number
  prize: number
}

interface LeaderboardData {
  entries: LeaderboardEntry[]
  totalWagered: number
  targetWager: number
  prizePool: number
  endsAt: string
}

export default function PackdrawLeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState('')
  const [viewPrevious, setViewPrevious] = useState(false)

  useEffect(() => {
    fetchLeaderboard()
  }, [viewPrevious])

  useEffect(() => {
    if (!data?.endsAt) return

    const updateCountdown = () => {
      const now = new Date().getTime()
      const end = new Date(data.endsAt).getTime()
      const diff = end - now

      if (diff <= 0) {
        setTimeLeft('ENDED')
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [data?.endsAt])

  const fetchLeaderboard = async () => {
    setLoading(true)
    setError('')

    try {
      const url = viewPrevious 
        ? '/api/packdraw?prev=1'
        : '/api/packdraw'
      
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch leaderboard')
      
      const result = await res.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const progress = data ? Math.min((data.totalWagered / data.targetWager) * 100, 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-destructive text-xl font-bold">Error</div>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => fetchLeaderboard()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const top3 = data?.entries.slice(0, 3) || []
  const rest = data?.entries.slice(3, 10) || []

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-3">
            <Image src="/assets/logo.png" alt="R2K2" width={48} height={48} className="rounded-lg" />
            <span className="text-2xl font-bold">
              R2K<span className="text-primary">2</span>
            </span>
          </Link>
          <Link href="/home">
            <Button variant="outline" size="sm" className="bg-transparent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-8">
            <div className="flex items-center justify-center gap-4">
              <Image src="/assets/packdraw.png" alt="Packdraw" width={64} height={64} className="rounded-lg" />
              <h1 className="text-4xl md:text-5xl font-bold">Packdraw Leaderboard</h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Live leaderboard tracking for code R2K2
            </p>
          </div>

          {/* Prize Pool Card */}
          <Card className="max-w-2xl mx-auto bg-gradient-to-br from-primary/20 to-background border-primary/30">
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Trophy className="h-6 w-6 text-primary" />
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Prize Pool</span>
              </div>
              <div className="text-5xl font-bold text-primary">
                ${data?.prizePool.toLocaleString() || '0'}
              </div>
              
              {!viewPrevious && (
                <>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-mono">{timeLeft}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Wagered</span>
                      <span className="font-bold">${data?.totalWagered.toLocaleString()}</span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {progress.toFixed(1)}% of ${data?.targetWager.toLocaleString()} target
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Toggle Button */}
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => setViewPrevious(!viewPrevious)}
              className="bg-transparent"
            >
              {viewPrevious ? 'View Current Leaderboard' : 'View Previous Leaderboard'}
            </Button>
          </div>
        </div>
      </section>

      {/* Top 3 */}
      {top3.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Top 3 Winners</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {top3.map((entry) => (
                <TopCard key={entry.rank} entry={entry} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ranks 4-10 */}
      {rest.length > 0 && (
        <section className="py-12 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Leaderboard Rankings</h2>
            <div className="max-w-4xl mx-auto space-y-3">
              {rest.map((entry) => (
                <LeaderboardRow key={entry.rank} entry={entry} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function TopCard({ entry }: { entry: LeaderboardEntry }) {
  const colors = {
    1: { border: '#FFD700', glow: 'rgba(255, 215, 0, 0.3)' },
    2: { border: '#C0C0C0', glow: 'rgba(192, 192, 192, 0.3)' },
    3: { border: '#CD7F32', glow: 'rgba(205, 127, 50, 0.3)' }
  }
  const color = colors[entry.rank as keyof typeof colors]?.border || '#888'
  const glow = colors[entry.rank as keyof typeof colors]?.glow || 'rgba(136, 136, 136, 0.3)'

  return (
    <Card 
      className="relative overflow-hidden border-2 transition-all duration-300 hover:scale-105"
      style={{ 
        borderColor: color,
        boxShadow: `0 0 30px ${glow}, 0 0 60px ${glow}`
      }}
    >
      <CardContent className="p-6 text-center space-y-4">
        <div className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold border-2" style={{ borderColor: color, background: 'rgba(0,0,0,0.5)' }}>
          #{entry.rank}
        </div>

        {entry.avatar ? (
          <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden border-4" style={{ borderColor: color }}>
            <Image src={entry.avatar || "/placeholder.svg"} alt={entry.name} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl font-bold border-4 bg-black" style={{ borderColor: color, color: '#fff' }}>
            {entry.name.charAt(0).toUpperCase()}
          </div>
        )}

        <div>
          <div className="font-bold text-lg">{entry.name}</div>
        </div>

        <div className="space-y-2 pt-4 border-t border-border/40">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Wagered</span>
            <span className="font-bold text-lg">${entry.wagered.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Prize</span>
            <span className="font-bold text-lg text-primary">${entry.prize.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <Card className="hover:shadow-lg hover:shadow-primary/20 transition-all">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 text-center">
            <div className="text-xl font-bold text-muted-foreground">#{entry.rank}</div>
          </div>

          {entry.avatar ? (
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
              <Image src={entry.avatar || "/placeholder.svg"} alt={entry.name} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold border-2 border-primary bg-black text-white">
              {entry.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="font-bold truncate">{entry.name}</div>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase">Wagered</div>
              <div className="font-bold text-lg">${entry.wagered.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase">Prize</div>
              <div className="font-bold text-lg text-primary">${entry.prize.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
