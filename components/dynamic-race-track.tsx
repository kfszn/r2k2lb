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
}

export function DynamicRaceTrack({
  platform = 'acebet',
  targetWager = 1000, // Target in dollars
  showTop = 10,
  autoRefresh = 5000,
  showPrevious = false,
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
      const url = showPrevious ? '/api/leaderboard?prev=1' : '/api/leaderboard'
      const res = await fetch(url)
      const data = await res.json()

      if (data.ok && Array.isArray(data.data)) {
        setPlayers(data.data.slice(0, showTop))
        setLastUpdated(new Date())
        setError(null)
      } else {
        setError(data.error || 'Failed to load leaderboard')
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
  }, [showPrevious, showTop])

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
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{platform}</span>
                          <span>•</span>
                          <span>Earned: {formatDollars(player.earned)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right ml-4">
                      <p className={`text-lg font-bold ${color.text}`}>
                        {formatDollars(playerWageredPennies)}
                      </p>
                      <p className="text-xs text-muted-foreground">{Math.round(progressPercent)}%</p>
                    </div>
                  </div>

                  <div className="relative h-16 bg-gradient-to-r from-secondary via-secondary/50 to-secondary rounded-lg overflow-hidden border border-secondary-foreground/20">
                    <div className="absolute inset-0 opacity-20">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 border-l border-foreground/10"
                          style={{ left: `${i * 5}%` }}
                        />
                      ))}
                    </div>

                    {[25, 50, 75].map((checkpoint) => (
                      <div
                        key={checkpoint}
                        className="absolute top-0 bottom-0 border-l border-dashed border-foreground/20 z-0"
                        style={{ left: `${checkpoint}%` }}
                      />
                    ))}

                    <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-green-400 via-green-500 to-green-600 shadow-lg shadow-green-500/50 z-20" />
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-green-500/40 to-transparent z-10" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30">
                      <div className="text-xs font-bold text-green-400 uppercase tracking-wider drop-shadow-lg">
                        FINISH
                      </div>
                    </div>

                    <div
                      className={`absolute left-0 top-0 bottom-0 ${color.bg} transition-all duration-500 ease-out group-hover:brightness-110`}
                      style={{
                        width: `${progressPercent}%`,
                        minWidth: progressPercent > 0 ? '60px' : '0px',
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-2 z-20">
                        <div className={`h-12 w-12 rounded-full ${color.bg} border-3 border-white shadow-lg flex items-center justify-center`}>
                          <span className="text-xs font-bold text-white">
                            {player.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>

                        {isFinished && (
                          <div className="absolute -right-2 -top-2 bg-yellow-500 rounded-full p-1.5 border-2 border-white shadow-lg animate-pulse">
                            <Trophy className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={`mt-2 px-3 py-1.5 rounded-lg ${color.light} border border-secondary flex items-center gap-2`}>
                    <DollarSign className={`h-3 w-3 ${color.text}`} />
                    <span className="text-xs font-semibold">Wagered: {formatDollars(playerWageredPennies)}</span>
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
