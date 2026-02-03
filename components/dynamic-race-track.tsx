'use client'

import { useEffect, useState, useMemo } from 'react'
import { RefreshCw, Trophy, Zap, DollarSign } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface LeaderboardEntry {
  userId: number
  name: string
  avatar: string
  wagered: number // API returns values in pennies/cents
  deposited: number
  earned: number
}

interface DynamicRaceTrackProps {
  platform?: 'acebet' | 'packdraw'
  targetWager?: number // Target in dollars
  showTop?: number
  autoRefresh?: number
  showPrevious?: boolean
  startDate?: string // ISO date string for race start (used for Packdraw timeframe)
  endDate?: string // ISO date string for race end (optional, for display)
}

export function DynamicRaceTrack({
  platform = 'acebet',
  targetWager = 1000, // Target in dollars
  showTop = 10,
  autoRefresh = 5000,
  showPrevious = false,
  startDate,
  endDate,
}: DynamicRaceTrackProps) {
  const [players, setPlayers] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Target in pennies for comparison (API returns pennies)
  const targetInPennies = targetWager * 100

  const fetchLeaderboard = async () => {
    setIsRefreshing(true)
    try {
      let url: string
      let transformedPlayers: LeaderboardEntry[] = []

      if (platform === 'packdraw') {
        // Fetch from Packdraw API with race timeframe
        // Convert ISO date to M-D-YYYY format for Packdraw API
        let afterDate = '1-1-2026' // Default
        if (startDate) {
          const date = new Date(startDate)
          afterDate = `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`
        }
        url = `/api/packdraw?after=${encodeURIComponent(afterDate)}`
        const res = await fetch(url)
        const data = await res.json()

        // Transform Packdraw response format to our interface
        // Packdraw returns: { leaderboard: [{ username, wagerAmount, image, userId }] }
        let leaderboardData: any[] = []
        if (Array.isArray(data)) {
          leaderboardData = data
        } else if (data.leaderboard && Array.isArray(data.leaderboard)) {
          leaderboardData = data.leaderboard
        } else if (data.data && Array.isArray(data.data)) {
          leaderboardData = data.data
        }

        // Transform to our interface - Packdraw wagerAmount is already in dollars
        transformedPlayers = leaderboardData.map((item: any) => ({
          userId: item.userId || 0,
          name: item.username || item.name || 'Unknown',
          avatar: item.image || item.avatar || '',
          wagered: (item.wagerAmount || 0) * 100, // Convert dollars to pennies for consistent handling
          deposited: 0,
          earned: 0,
        }))

        setPlayers(transformedPlayers.slice(0, showTop))
        setLastUpdated(new Date())
        setError(null)
      } else {
        // Fetch from Acebet API (default)
        url = showPrevious ? '/api/leaderboard?prev=1' : '/api/leaderboard'
        const res = await fetch(url)
        const data = await res.json()

        if (data.ok && Array.isArray(data.data)) {
          setPlayers(data.data.slice(0, showTop))
          setLastUpdated(new Date())
          setError(null)
        } else {
          setError(data.error || 'Failed to load leaderboard')
        }
      }
    } catch (e) {
      setError('Failed to fetch leaderboard data')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [showPrevious, showTop, platform, startDate])

  useEffect(() => {
    if (autoRefresh <= 0) return

    const interval = setInterval(() => {
      fetchLeaderboard()
    }, autoRefresh)

    return () => clearInterval(interval)
  }, [autoRefresh])

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => (b.wagered || 0) - (a.wagered || 0))
  }, [players])

  const colors = [
    { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-500/20' },
    { bg: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-500/20' },
    { bg: 'bg-pink-500', text: 'text-pink-500', light: 'bg-pink-500/20' },
    { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-500/20' },
    { bg: 'bg-green-600', text: 'text-green-600', light: 'bg-green-600/20' },
    { bg: 'bg-red-500', text: 'text-red-500', light: 'bg-red-500/20' },
    { bg: 'bg-indigo-500', text: 'text-indigo-500', light: 'bg-indigo-500/20' },
    { bg: 'bg-cyan-500', text: 'text-cyan-500', light: 'bg-cyan-500/20' },
  ]

  // Format pennies to dollars with 2 decimal places
  const formatDollars = (pennies: number): string => {
    const dollars = pennies / 100
    return `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  if (loading) {
    return (
      <Card className="w-full bg-gradient-to-br from-background via-background to-background/50 border-primary/20">
        <div className="p-8 flex flex-col items-center justify-center py-16">
          <div className="animate-spin mb-4">
            <RefreshCw className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading race track...</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full bg-gradient-to-br from-background via-background to-background/50 border-destructive/20">
        <div className="p-8 flex flex-col items-center justify-center py-16">
          <Zap className="h-8 w-8 text-destructive mb-4" />
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={fetchLeaderboard} variant="outline" size="sm" className="mt-4">
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="w-full bg-gradient-to-br from-background via-background to-background/50 border-primary/20 overflow-hidden">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-6 w-6 text-green-500" />
              <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Wager Race Track
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Target: ${targetWager.toLocaleString()}.00 • Platform: {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </p>
          </div>
          <div className="text-right">
            <Button
              onClick={fetchLeaderboard}
              disabled={isRefreshing}
              variant="ghost"
              size="sm"
              className="mb-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {sortedPlayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Zap className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground font-medium">No players racing yet</p>
            <p className="text-xs text-muted-foreground mt-1">Waiting for competitors to join...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {sortedPlayers.map((player, index) => {
              // API returns values in pennies, calculate progress against target (also in pennies)
              const playerWageredPennies = player.wagered || 0
              const progressPercent = Math.min((playerWageredPennies / targetInPennies) * 100, 100)
              const color = colors[index % colors.length]
              const isFirstPlace = index === 0
              const isFinished = progressPercent >= 100

              return (
                <div key={`${player.userId}-${player.name}`} className="group">
                  <div className={`flex items-center justify-between mb-2 p-3 rounded-lg ${color.light} border ${isFirstPlace ? 'border-primary/50' : 'border-secondary'} transition-all duration-300`}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full ${color.bg} flex items-center justify-center`}>
                        <span className="text-xs font-bold text-white">{index + 1}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {player.avatar && (
                            <img
                              src={player.avatar}
                              alt={player.name}
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          )}
                          <p className="text-sm font-bold truncate">{player.name}</p>
                          {isFinished && (
                            <Trophy className="h-4 w-4 text-yellow-500 flex-shrink-0 animate-bounce" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">{platform}</p>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right ml-4">
                      <p className={`text-lg font-bold ${color.text}`}>
                        {formatDollars(playerWageredPennies)}
                      </p>
                      <p className="text-xs text-muted-foreground">{Math.round(progressPercent)}%</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary to-primary/70 h-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-secondary/50">
          <p className="text-xs font-semibold text-muted-foreground mb-3">Legend:</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">Finish Line</span>
            </div>
            <div className="flex items-start gap-2">
              <DollarSign className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">USD Amounts</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                1
              </div>
              <span className="text-muted-foreground">Rank</span>
            </div>
            <div className="flex items-start gap-2">
              <Trophy className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">Finished</span>
            </div>
            <div className="flex items-start gap-2">
              <RefreshCw className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">Auto-refresh</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
