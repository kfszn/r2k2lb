'use client'

import { useMemo } from 'react'
import { CheckCircle2, Trophy, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface Player {
  username: string
  platform: string
  progress: number // actual wager amount
  isWinner: boolean
  rewardAmount?: number
  achievedAt?: string
}

interface RaceVisualizationProps {
  players: Player[]
  milestones: Array<{ wager_amount: number; reward_amount: number }>
  currentMilestoneIndex: number
}

export function RaceVisualization({
  players,
  milestones,
  currentMilestoneIndex,
}: RaceVisualizationProps) {
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => b.progress - a.progress)
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

  const currentMilestone = milestones[currentMilestoneIndex]
  const finishLine = currentMilestone?.wager_amount || 1000
  const finishReward = currentMilestone?.reward_amount || 0

  return (
    <Card className="w-full bg-gradient-to-br from-background via-background to-background/50 border-primary/20 overflow-hidden">
      <div className="p-8">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Race Track
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Milestone {currentMilestoneIndex + 1}: ${finishLine.toLocaleString()} Wager Target
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-semibold">Reward: ${finishReward}</span>
              </div>
              <p className="text-xs text-muted-foreground">for first finisher</p>
            </div>
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
              const progressPercent = Math.min((player.progress / finishLine) * 100, 100)
              const color = colors[index % colors.length]
              const isFirstPlace = index === 0
              const isFinished = player.isWinner

              return (
                <div key={`${player.username}-${player.platform}`} className="group">
                  {/* Player Info Bar */}
                  <div className={`flex items-center justify-between mb-2 p-3 rounded-lg ${color.light} border ${isFirstPlace ? 'border-primary/50' : 'border-secondary'} transition-all duration-300`}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Rank Badge */}
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full ${color.bg} flex items-center justify-center`}>
                        <span className="text-xs font-bold text-white">{index + 1}</span>
                      </div>

                      {/* Player Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold truncate">{player.username}</p>
                          {isFinished && (
                            <Trophy className="h-4 w-4 text-yellow-500 flex-shrink-0 animate-bounce" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{player.platform}</span>
                          <span>•</span>
                          <span>${player.progress.toLocaleString()} wagered</span>
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
                  <div className="relative h-16 bg-gradient-to-r from-secondary via-secondary/50 to-secondary rounded-lg overflow-hidden border border-secondary-foreground/20">
                    {/* Background Grid */}
                    <div className="absolute inset-0 opacity-20">
                      {[...Array(20)].map((_, i) => (
                        <div key={i} className="absolute top-0 bottom-0 border-l border-foreground/10" style={{ left: `${i * 5}%` }} />
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

                      {/* Player Avatar/Marker */}
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-2 z-20">
                        <div className={`h-12 w-12 rounded-full ${color.bg} border-3 border-white shadow-lg flex items-center justify-center`}>
                          <span className="text-xs font-bold text-white">
                            {player.username.substring(0, 2).toUpperCase()}
                          </span>
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

                  {/* Achievement Footer */}
                  {isFinished && player.achievedAt && (
                    <div className={`mt-2 px-3 py-2 rounded-lg ${color.light} border border-${color.text.split('-')[1]}-500/30 flex items-center gap-2`}>
                      <CheckCircle2 className={`h-4 w-4 ${color.text}`} />
                      <div className="text-xs">
                        <span className={`font-semibold ${color.text}`}>Finished!</span>
                        <span className="text-muted-foreground ml-2">
                          Won ${player.rewardAmount} on {player.achievedAt}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Footer Legend */}
        <div className="mt-10 pt-6 border-t border-secondary/50">
          <p className="text-xs font-semibold text-muted-foreground mb-3">How it works:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
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
              <span className="text-muted-foreground">First Finisher</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-4 w-4 rounded-full bg-gradient-to-r from-transparent to-secondary flex-shrink-0 mt-1" />
              <span className="text-muted-foreground">Progress Bar</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
