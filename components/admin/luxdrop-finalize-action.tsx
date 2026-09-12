'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Trophy, CheckCircle2 } from 'lucide-react'
import { CURRENT_LUXDROP_PERIOD } from '@/lib/luxdrop/period'

interface FinalizeResult {
  created: { username: string; rank: number; amount: number }[]
  skipped: { username: string; rank: number; reason: string }[]
}

/**
 * One-click action to close out a LuxDrop leaderboard period: fetches
 * final standings for the given range and posts "leaderboard" category
 * reward_claims rows for each paid rank. LuxDrop has no automated weekly
 * cutover like Roobet, so this replaces fully-manual claim entry with a
 * single admin action once a period actually ends.
 */
export function LuxdropFinalizeAction() {
  const [startDate, setStartDate] = useState(CURRENT_LUXDROP_PERIOD.startDate)
  const [endDate, setEndDate] = useState(CURRENT_LUXDROP_PERIOD.endDate)
  const [periodLabel, setPeriodLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<FinalizeResult | null>(null)

  const handleFinalize = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/admin/luxdrop/finalize-period', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, periodLabel: periodLabel.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to finalize period')
      setResult(json)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to finalize period')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          LuxDrop Leaderboard Payout
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Close out a finished LuxDrop monthly leaderboard period — posts a pending reward claim for each paid rank.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>End Date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Period Label (optional)</Label>
            <Input placeholder="e.g. September 2026" value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} />
          </div>
        </div>

        {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

        <Button onClick={handleFinalize} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
          Finalize Period & Post Rewards
        </Button>

        {result && (
          <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-2 text-sm">
            <p className="font-semibold text-emerald-400">{result.created.length} reward claim(s) posted</p>
            {result.created.map((c) => (
              <p key={c.username} className="text-muted-foreground">
                #{c.rank} {c.username} — ${c.amount.toLocaleString()}
              </p>
            ))}
            {result.skipped.length > 0 && (
              <>
                <p className="font-semibold text-amber-400 pt-2">{result.skipped.length} skipped</p>
                {result.skipped.map((s) => (
                  <p key={s.username} className="text-muted-foreground">
                    #{s.rank} {s.username} — {s.reason}
                  </p>
                ))}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
