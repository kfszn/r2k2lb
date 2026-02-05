'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

interface WagerStats {
  totalWagered: number
  totalDeposits: number
  totalEarnings: number
  activeMembers: number
}

interface LeaderboardEntry {
  name: string
  wagered: number // in pennies
  deposits?: number
  earnings?: number
}

export function TotalWagerStats() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [stats, setStats] = useState<WagerStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDateRangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) {
      setError('Please select both start and end dates')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Fetch acebet leaderboard data from the correct endpoint
      const response = await fetch('/api/leaderboard')
      if (!response.ok) throw new Error('Failed to fetch leaderboard data')
      
      const data = await response.json()
      
      // Extract leaderboard array from response (handle multiple response formats)
      let leaderboardData = []
      if (Array.isArray(data)) {
        leaderboardData = data
      } else if (data.leaderboard && Array.isArray(data.leaderboard)) {
        leaderboardData = data.leaderboard
      } else if (data.data && Array.isArray(data.data)) {
        leaderboardData = data.data
      } else {
        throw new Error('Unexpected response format from leaderboard API')
      }
      
      // Calculate statistics from leaderboard data
      const totalWagered = leaderboardData.reduce((sum: number, p: any) => {
        const wagered = (p.wagerAmount || p.wagered || 0)
        return sum + wagered * 100 // Convert to pennies
      }, 0)
      
      const totalDeposits = leaderboardData.reduce((sum: number, p: any) => {
        return sum + ((p.deposits || p.depositAmount || 0) * 100)
      }, 0)
      
      const totalEarnings = leaderboardData.reduce((sum: number, p: any) => {
        return sum + ((p.earnings || p.earnedAmount || 0) * 100)
      }, 0)
      
      const activeMembers = leaderboardData.length

      setStats({
        totalWagered,
        totalDeposits,
        totalEarnings,
        activeMembers,
      })
    } catch (err) {
      console.error('[v0] Error fetching wager stats:', err)
      setError('Failed to fetch wager statistics. Please try again.')
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
