'use client'

import { useEffect, useState, useMemo } from 'react'
import { RefreshCw, Trophy, Zap, Coins } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface LeaderboardEntry {
  userId: number
  name: string
  avatar: string
  wagered: number
  deposited: number
  earned: number
}

interface DynamicRaceTrackProps {
  platform?: 'acebet' | 'packdraw'
  targetWager?: number // in dollars
  showTop?: number
  autoRefresh?: number // milliseconds, 0 = disabled
  showPrevious?: boolean
  displayInPennies?: boolean // true = show all values in pennies
}

export function DynamicRaceTrack({
  platform = 'acebet',
  targetWager = 1000,
  showTop = 10,
  autoRefresh = 5000,
  showPrevious = false,
  displayInPennies = true,
}: DynamicRaceTrackProps) {
  const [players, setPlayers] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Convert dollars to pennies for calculations
  const targetInPennies = targetWager * 100

  const fetchLeaderboard = async () => {
    setIsRefreshing(true)
    try {
      const url = showPrevious ? '/api/leaderboard?prev=1' : '/api/leaderboard'
      const res = await fetch(url)
      const data = await res.json()

      if (data.ok && Array.isArray(data.data)) {
        console.log('[v0] Fetched leaderboard data:', data.data.length, 'players')
        setPlayers(data.data.slice(0, showTop))
        setLastUpdated(new Date())
        setError(null)
      } else {
        setError(data.error || 'Failed to load leaderboard')
      }
    } catch (e) {
      setError('Failed to fetch leaderboard data')
      console.error('[v0] Leaderboard fetch error:', e)
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
    { bg: 'bg-yellow-500', text: 'text-yellow-500', light: 'bg-yellow-500/20' },
    { bg: 'bg-teal-500', text: 'text-teal-500', light: 'bg-teal-500/20' },
  ]

  const formatValue = (value: number, isPennies: boolean = displayInPennies) => {
    if (isPennies) {
      return `¢${Math.round(value * 100).toLocaleString()}`
    }
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
      <Card className="w-full bg-gradient-to-br from-background via-background to-background/50 border-primary/20">
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Coins className="h-6 w-6 text-yellow-500" />
              <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Penny Race Track
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Target: {formatValue(targetWager)} ({formatValue(targetInPennies / 100)})
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

        {/* Empty State */}
        {sortedPlayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Zap className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground font-medium">No players racing yet</p>
            <p className="text-xs text-muted-foreground mt-1">Waiting for competitors to join...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {sortedPlayers.map((player, index) => {
              const playerWageredInPennies = (player.wagered || 0) * 100
              const progressPercent = Math.min((playerWageredInPennies / targetInPennies) * 100, 100)
              const color = colors[index % colors.length]
              const isFirstPlace = index === 0
              const isFinished = progressPercent >= 100

              return (
                <div key={`${player.userId}-${player.name}`} className="group">
                  {/* Player Info Bar */}
                  <div
                    className={`flex items-center justify-between mb-2 p-3 rounded-lg ${color.light} border ${isFirstPlace ? 'border-primary/50' : 'border-secondary'} transition-all duration-300`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Rank Badge */}
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full ${color.bg} flex items-center justify-center`}>
                        <span className="text-xs font-bold text-white">{index + 1}</span>
                      </div>

                      {/* Player Avatar and Details */}
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
                          <span>Earned: {formatValue(player.earned)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Stats */}
                    <div className="flex-shrink-0 text-right ml-4">
                      <p className={`text-lg font-bold ${color.text}`}>
                        {formatValue(player.wagered)}
                      </p>
                      <p className="text-xs text-muted-foreground">{Math.round(progressPercent)}%</p>
                    </div>
                  </div>

                  {/* Track Visualization */}
                  <div className="relative h-16 bg-gradient-to-r from-secondary via-secondary/50 to-secondary rounded-lg overflow-hidden border border-secondary-foreground/20">
                    {/* Background Grid */}
                    <div className="absolute inset-0 opacity-20">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 border-l border-foreground/10"
                          style={{ left: `${i * 5}%` }}
                        />
                      ))}
                    </div>

                    {/* Checkpoint Markers (25%, 50%, 75%) */}
                    {[25, 50, 75].map((checkpoint) => (
                      <div
                        key={checkpoint}
                        className="absolute top-0 bottom-0 border-l border-dashed border-foreground/20 z-0"
                        style={{ left: `${checkpoint}%` }}
                      />
                    ))}

                    {/* Finish Line - Right Side */}
                    <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-green-400 via-green-500 to-green-600 shadow-lg shadow-green-500/50 z-20" />

                    {/* Finish Line Glow */}
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-green-500/40 to-transparent z-10" />

                    {/* Finish Line Label */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30">
                      <div className="text-xs font-bold text-green-400 uppercase tracking-wider drop-shadow-lg">
                        FINISH
                      </div>
                    </div>

                    {/* Player Progress Bar */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 ${color.bg} transition-all duration-500 ease-out group-hover:brightness-110`}
                      style={{
                        width: `${progressPercent}%`,
                        minWidth: progressPercent > 0 ? '60px' : '0px',
                      }}
                    >
                      {/* Progress Shine Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Player Marker */}
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-2 z-20">
                        <div className={`h-12 w-12 rounded-full ${color.bg} border-3 border-white shadow-lg flex items-center justify-center`}>
                          <span className="text-xs font-bold text-white">
                            {player.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>

                        {/* Finish Badge */}
                        {isFinished && (
                          <div className="absolute -right-2 -top-2 bg-yellow-500 rounded-full p-1.5 border-2 border-white shadow-lg animate-pulse">
                            <Trophy className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Penny Count Badge */}
                  <div className={`mt-2 px-3 py-1.5 rounded-lg ${color.light} border border-${color.text.split('-')[1]}-500/30 flex items-center gap-2`}>
                    <Coins className={`h-3 w-3 ${color.text}`} />
                    <span className="text-xs font-semibold">{formatValue(playerWageredInPennies / 100)} in pennies</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div className="mt-10 pt-6 border-t border-secondary/50">
          <p className="text-xs font-semibold text-muted-foreground mb-3">How it works:</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">Finish Line</span>
            </div>
            <div className="flex items-start gap-2">
              <Coins className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">Pennies</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                1
              </div>
              <span className="text-muted-foreground">Player Rank</span>
            </div>
            <div className="flex items-start gap-2">
              <Trophy className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">Finished</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-4 w-4 rounded-full bg-gradient-to-r from-transparent to-secondary flex-shrink-0 mt-1" />
              <span className="text-muted-foreground">Progress</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

interface DynamicRaceTrackProps {
  platform?: 'acebet' | 'packdraw'
  targetWager?: number
  showTop?: number
  autoRefresh?: number // milliseconds, 0 = disabled
  showPrevious?: boolean
}

export function DynamicRaceTrack({
  platform = 'acebet',
  targetWager = 1000,
  showTop = 10,
  autoRefresh = 5000,
  showPrevious = false,
}: DynamicRaceTrackProps) {
  const [players, setPlayers] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

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
      console.error('[v0] Leaderboard fetch error:', e)
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
    { bg: 'bg-yellow-500', text: 'text-yellow-500', light: 'bg-yellow-500/20' },
    { bg: 'bg-teal-500', text: 'text-teal-500', light: 'bg-teal-500/20' },
  ]

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
          <Zap className="h-12 w-12 text-destructive/50 mb-4" />
          <p className="text-destructive font-medium">{error}</p>
          <Button onClick={fetchLeaderboard} className="mt-4" size="sm" variant="outline">
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="w-full bg-gradient-to-br from-background via-background to-background/50 border-primary/20 overflow-hidden">
      <div className="p-8">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Live Race Track
              </h3>
              <p className="text-sm text-muted-foreground mt-1 capitalize">
                {platform} • Target: ${targetWager.toLocaleString()} Wagers
              </p>
            </div>
            <div className="text-right">
              <Button
                onClick={fetchLeaderboard}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground mt-2">
                  Updated {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {sortedPlayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Zap className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground font-medium">No racers yet</p>
            <p className="text-xs text-muted-foreground mt-1">Waiting for players to start wagering...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {sortedPlayers.map((player, index) => {
              const progressPercent = Math.min((player.wagered / targetWager) * 100, 100)
              const color = colors[index % colors.length]
              const isFinished = player.wagered >= targetWager
              const placeDelta = index + 1

              return (
                <div key={`${player.userId}-${player.name}`} className="group">
                  {/* Player Info Bar */}
                  <div
                    className={`flex items-center justify-between mb-2 p-4 rounded-lg ${color.light} border ${
                      isFinished ? 'border-green-500/50' : 'border-secondary'
                    } transition-all duration-300`}
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Rank Badge */}
                      <div
                        className={`flex-shrink-0 h-10 w-10 rounded-full ${color.bg} flex items-center justify-center`}
                      >
                        <span className="text-sm font-bold text-white">#{placeDelta}</span>
                      </div>

                      {/* Player Avatar & Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {player.avatar && (
                            <img
                              src={player.avatar}
                              alt={player.name}
                              className="h-6 w-6 rounded-full border border-primary/30"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          )}
                          <p className="text-sm font-bold truncate">{player.name || `Player ${player.userId}`}</p>
                          {isFinished && (
                            <Trophy className="h-4 w-4 text-yellow-500 flex-shrink-0 animate-bounce" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>💰 ${(player.earned || 0).toLocaleString()}</span>
                          <span>•</span>
                          <span>📊 {(player.deposited || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Stats */}
                    <div className="flex-shrink-0 text-right ml-4">
                      <p className={`text-lg font-bold ${color.text}`}>
                        {Math.round(progressPercent)}%
                      </p>
                      <p className="text-xs text-muted-foreground">of target</p>
                    </div>
                  </div>

                  {/* Track Visualization */}
                  <div className="relative h-16 bg-gradient-to-r from-secondary via-secondary/50 to-secondary rounded-lg overflow-hidden border border-secondary-foreground/20 group-hover:border-primary/30 transition-colors duration-300">
                    {/* Background Grid */}
                    <div className="absolute inset-0 opacity-20">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 border-l border-foreground/10"
                          style={{ left: `${i * 5}%` }}
                        />
                      ))}
                    </div>

                    {/* Finish Line - Right Side */}
                    <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-green-400 via-green-500 to-green-600 shadow-lg shadow-green-500/50 z-20" />

                    {/* Finish Line Glow */}
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-green-500/40 to-transparent z-10" />

                    {/* Finish Line Label */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30">
                      <div className="text-xs font-bold text-green-400 uppercase tracking-wider drop-shadow-lg">
                        FINISH
                      </div>
                    </div>

                    {/* Player Progress Bar */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 ${color.bg} transition-all duration-500 ease-out group-hover:brightness-110`}
                      style={{
                        width: `${progressPercent}%`,
                        minWidth: progressPercent > 0 ? '60px' : '0px',
                      }}
                    >
                      {/* Progress Shine Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Player Avatar/Marker on Track */}
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-2 z-20">
                        <div
                          className={`h-12 w-12 rounded-full ${color.bg} border-3 border-white shadow-lg flex items-center justify-center overflow-hidden`}
                        >
                          {player.avatar ? (
                            <img
                              src={player.avatar}
                              alt={player.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <span className="text-xs font-bold text-white">
                              {player.name?.substring(0, 1).toUpperCase() || 'P'}
                            </span>
                          )}
                        </div>

                        {/* Winner Badge */}
                        {isFinished && (
                          <div className="absolute -right-2 -top-2 bg-yellow-500 rounded-full p-1.5 border-2 border-white shadow-lg animate-pulse">
                            <Trophy className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Checkpoint Markers */}
                    {[25, 50, 75].map((checkpoint) => (
                      <div
                        key={checkpoint}
                        className="absolute top-0 bottom-0 border-l border-dashed border-foreground/20 z-0"
                        style={{ left: `${checkpoint}%` }}
                      />
                    ))}
                  </div>

                  {/* Wager Amount Footer */}
                  <div className={`mt-2 px-3 py-2 rounded-lg ${color.light} border border-secondary flex items-center justify-between`}>
                    <span className="text-xs font-semibold">Wagered: ${player.wagered.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">
                      {targetWager - player.wagered > 0
                        ? `$${(targetWager - player.wagered).toLocaleString()} remaining`
                        : 'FINISHED!'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer Legend */}
        <div className="mt-10 pt-6 border-t border-secondary/50">
          <p className="text-xs font-semibold text-muted-foreground mb-3">How to read the track:</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
            <div className="flex items-start gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">Finish Line</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                1
              </div>
              <span className="text-muted-foreground">Player Rank</span>
            </div>
            <div className="flex items-start gap-2">
              <Trophy className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">Finished Race</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-4 w-4 rounded-full bg-gradient-to-r from-transparent to-secondary flex-shrink-0 mt-1" />
              <span className="text-muted-foreground">Wager Progress</span>
            </div>
            <div className="flex items-start gap-2">
              <RefreshCw className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">Live Updates</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
