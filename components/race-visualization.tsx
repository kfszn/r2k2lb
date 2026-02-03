'use client'

import { useMemo } from 'react'
import { CheckCircle2, Trophy } from 'lucide-react'

interface Player {
  username: string
  platform: string
  progress: number // 0-100
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
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-green-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-cyan-500',
  ]

  const currentMilestone = milestones[currentMilestoneIndex]
  const finishLine = currentMilestone?.wager_amount || 1000

  return (
    <div className="w-full bg-gradient-to-b from-background to-background/80 rounded-lg border border-secondary p-8">
      {/* Track Header */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-2">Wager Race Track</h3>
        <p className="text-sm text-muted-foreground">
          Milestone {currentMilestoneIndex + 1}: ${finishLine.toLocaleString()} target
        </p>
      </div>

      {/* Race Track Container */}
      <div className="space-y-6">
        {sortedPlayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">No players in this race yet</p>
          </div>
        ) : (
          sortedPlayers.map((player, index) => {
            const progressPercent = Math.min((player.progress / finishLine) * 100, 100)
            const colorClass = colors[index % colors.length]

            return (
              <div key={player.username} className="relative">
                {/* Player Label */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {player.isWinner && (
                      <Trophy className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{player.username}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {player.platform}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-sm font-bold">${player.progress.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{Math.round(progressPercent)}%</p>
                  </div>
                </div>

                {/* Track Background */}
                <div className="relative w-full h-12 bg-secondary rounded-full overflow-hidden border border-secondary-foreground/20">
                  {/* Finish Line Marker */}
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-green-600 z-10" />

                  {/* Player Position Bar */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 ${colorClass} rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-3`}
                    style={{
                      width: `${progressPercent}%`,
                      minWidth: '48px',
                    }}
                  >
                    {/* Player Avatar */}
                    <div
                      className={`h-10 w-10 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-xs font-bold text-white`}
                    >
                      {player.username.charAt(0).toUpperCase()}
                    </div>

                    {/* Winner Badge */}
                    {player.isWinner && (
                      <div className="absolute -right-1 -top-1 bg-yellow-500 rounded-full p-1 border-2 border-background">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Finish Line Label */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-green-500 z-20">
                    FINISH
                  </div>
                </div>

                {/* Achievement Info */}
                {player.isWinner && player.achievedAt && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-green-500">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Won ${player.rewardAmount} on {player.achievedAt}</span>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-secondary">
        <p className="text-xs text-muted-foreground mb-3">Legend:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Finish Line</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-3 w-3 text-yellow-500" />
            <span className="text-muted-foreground">First Place</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Player Position</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-white/20 border border-white text-xs flex items-center justify-center">
              P
            </div>
            <span className="text-muted-foreground">Avatar</span>
          </div>
        </div>
      </div>
    </div>
  )
}
