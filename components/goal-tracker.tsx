import { Target } from 'lucide-react'

interface GoalTrackerProps {
  current: number
  goal: number
  formatMoney: (amount: number) => string
  label?: string
  className?: string
}

export function GoalTracker({ current, goal, formatMoney, label = 'Wager Goal', className = '' }: GoalTrackerProps) {
  const pct = Math.min((current / goal) * 100, 100)
  const reached = current >= goal
  const remaining = Math.max(goal - current, 0)

  return (
    <div className={`rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl px-5 py-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className={`h-4 w-4 ${reached ? 'text-green-400' : 'text-primary'}`} />
          <span className="text-sm font-semibold">
            {reached ? 'Goal Reached!' : label}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5 text-sm tabular-nums">
          <span className={`font-bold ${reached ? 'text-green-400' : 'text-foreground'}`}>
            {formatMoney(current)}
          </span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">{formatMoney(goal)}</span>
          <span className={`ml-1 text-xs font-semibold ${reached ? 'text-green-400' : 'text-primary'}`}>
            {pct.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/60">
        <div
          className={`h-full rounded-full transition-all duration-700 ${reached ? 'bg-green-400' : 'bg-primary'} shadow-[0_0_12px_-2px_rgba(80,120,255,0.7)]`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {!reached && (
        <p className="mt-2 text-xs text-muted-foreground">
          {formatMoney(remaining)} remaining to reach the goal
        </p>
      )}
    </div>
  )
}
