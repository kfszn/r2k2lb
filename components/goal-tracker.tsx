import { Card, CardContent } from '@/components/ui/card'
import { Target } from 'lucide-react'

interface GoalTrackerProps {
  current: number
  goal: number
  formatMoney: (amount: number) => string
  label?: string
}

export function GoalTracker({ current, goal, formatMoney, label = 'Goal Progress' }: GoalTrackerProps) {
  const percentage = Math.min((current / goal) * 100, 100)
  const remaining = Math.max(goal - current, 0)

  return (
    <Card className="bg-card/50 backdrop-blur border-accent/20">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground uppercase font-medium mb-1">{label}</p>
              <p className="text-xl font-bold text-accent">{formatMoney(current)} / {formatMoney(goal)}</p>
            </div>
            <Target className="h-12 w-12 text-accent/40" />
          </div>
          
          <div className="space-y-2">
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
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
