'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface WagerStats {
  totalWagered: number
  totalDeposits: number
  totalEarnings: number
  activeMembers: number
}

export function TotalWagerStats() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [stats, setStats] = useState<WagerStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleDateRangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) {
      setError('Please select both start and end dates')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Query acebet wagers within date range
      const { data: wagers, error: wagersError } = await supabase
        .from('user_wagers')
        .select('username, wager_amount, deposit_amount, earnings, created_at')
        .eq('platform', 'acebet')
        .gte('created_at', new Date(startDate).toISOString())
        .lte('created_at', new Date(endDate).toISOString())

      if (wagersError) throw wagersError

      // Calculate statistics
      const totalWagered = wagers?.reduce((sum, w) => sum + (w.wager_amount || 0), 0) || 0
      const totalDeposits = wagers?.reduce((sum, w) => sum + (w.deposit_amount || 0), 0) || 0
      const totalEarnings = wagers?.reduce((sum, w) => sum + (w.earnings || 0), 0) || 0
      const uniqueMembers = new Set(wagers?.map(w => w.username) || []).size

      setStats({
        totalWagered,
        totalDeposits,
        totalEarnings,
        activeMembers: uniqueMembers,
      })
    } catch (err) {
      console.error('[v0] Error fetching wager stats:', err)
      setError('Failed to fetch wager statistics')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Wager Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDateRangeSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Generate Report'
                  )}
                </Button>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Wagered</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${(stats.totalWagered / 100).toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Deposits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${(stats.totalDeposits / 100).toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${(stats.totalEarnings / 100).toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.activeMembers}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
