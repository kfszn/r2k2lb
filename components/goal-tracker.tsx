import { Card, CardContent } from '@/components/ui/card'
import { Target } from 'lucide-react'

interface GoalTrackerProps {
  current: number
  goal: number
  formatMoney: (amount: number) => string
  label?: string
  prizePool?: number
}

export function GoalTracker({ current, goal, formatMoney, label = 'Goal Progress', prizePool }: GoalTrackerProps) {
  const percentage = Math.min((current / goal) * 100, 100)
  const remaining = Math.max(goal - current, 0)

  return (
    <Card className="bg-card/50 backdrop-blur border-accent/20">
      <CardContent className="px-4 py-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">{label}</p>
                {prizePool != null && prizePool > 0 && (
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary leading-none">
                    ${prizePool.toLocaleString()} Prize Pool
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-accent truncate">{formatMoney(current)} / {formatMoney(goal)}</p>
            </div>
            <Target className="h-5 w-5 text-accent/40 flex-shrink-0" />
          </div>
          
          <div className="space-y-1">
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-accent/60 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{percentage.toFixed(1)}% Complete</span>
              <span>Remaining: {formatMoney(remaining)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
