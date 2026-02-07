'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, ArrowUp, ArrowDown } from 'lucide-react'

interface WagerStats {
  totalWagered: number
  totalDeposits: number
  totalEarnings: number
  activeMembers: number
}

interface LeaderboardEntry {
  name: string
  wagered: number
  deposited: number
  earned: number
  active: boolean
}

type SortField = 'name' | 'wagered' | 'deposited' | 'active' | 'earned'
type SortDirection = 'asc' | 'desc'

export function TotalWagerStats() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [stats, setStats] = useState<WagerStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sortField, setSortField] = useState<SortField>('wagered')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getSortedLeaderboard = () => {
    const sorted = [...leaderboard].sort((a, b) => {
      let aVal: any = a[sortField]
      let bVal: any = b[sortField]

      if (sortField === 'active') {
        aVal = a.active ? 1 : 0
        bVal = b.active ? 1 : 0
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
    })

    return sorted
  }

  const handleDateRangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) {
      setError('Please select both start and end dates')
      return
    }

    setLoading(true)
    setError('')

    try {
      const start = new Date(startDate).toISOString().split('T')[0]
      const end = new Date(endDate).toISOString().split('T')[0]
      
      const url = `/api/leaderboard?start_at=${start}&end_at=${end}`
      const response = await fetch(url)
      
      if (!response.ok) throw new Error('Failed to fetch leaderboard data')
      
      const data = await response.json()
      
      if (!data.ok || !data.data) {
        throw new Error('Invalid response from leaderboard API')
      }
      
      const leaderboardData = data.data
      
      const totalWagered = leaderboardData.reduce((sum: number, p: any) => {
        return sum + (p.wagered || 0)
      }, 0)
      
      const totalDeposits = leaderboardData.reduce((sum: number, p: any) => {
        return sum + (p.deposited || 0)
      }, 0)
      
      const totalEarnings = leaderboardData.reduce((sum: number, p: any) => {
        return sum + (p.earned || 0)
      }, 0)
      
      const activeMembers = leaderboardData.length

      setStats({
        totalWagered,
        totalDeposits,
        totalEarnings,
        activeMembers,
      })

      // Format leaderboard data
      const formatted: LeaderboardEntry[] = leaderboardData.map((p: any) => ({
        name: p.name || 'Unknown',
        wagered: p.wagered || 0,
        deposited: p.deposited || 0,
        earned: p.earned || 0,
        active: p.active || false,
      }))

      setLeaderboard(formatted)
    } catch (err) {
      console.error('[v0] Error fetching wager stats:', err)
      setError('Failed to fetch wager statistics. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <div className="w-4 h-4" />
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4" />
      : <ArrowDown className="w-4 h-4" />
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Wagered</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${(stats.totalWagered / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Deposits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${(stats.totalDeposits / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${(stats.totalEarnings / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.activeMembers.toLocaleString('en-US')}</p>
              </CardContent>
            </Card>
          </div>

          {leaderboard.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold">
                          <button
                            onClick={() => handleSort('name')}
                            className="flex items-center gap-2 hover:text-foreground/80"
                          >
                            User <SortIcon field="name" />
                          </button>
                        </th>
                        <th className="text-right py-3 px-4 font-semibold">
                          <button
                            onClick={() => handleSort('wagered')}
                            className="flex items-center justify-end gap-2 ml-auto hover:text-foreground/80"
                          >
                            Wagered <SortIcon field="wagered" />
                          </button>
                        </th>
                        <th className="text-right py-3 px-4 font-semibold">
                          <button
                            onClick={() => handleSort('deposited')}
                            className="flex items-center justify-end gap-2 ml-auto hover:text-foreground/80"
                          >
                            Deposited <SortIcon field="deposited" />
                          </button>
                        </th>
                        <th className="text-right py-3 px-4 font-semibold">
                          <button
                            onClick={() => handleSort('active')}
                            className="flex items-center justify-end gap-2 ml-auto hover:text-foreground/80"
                          >
                            Active <SortIcon field="active" />
                          </button>
                        </th>
                        <th className="text-right py-3 px-4 font-semibold">
                          <button
                            onClick={() => handleSort('earned')}
                            className="flex items-center justify-end gap-2 ml-auto hover:text-foreground/80"
                          >
                            Earned <SortIcon field="earned" />
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedLeaderboard().map((entry, idx) => (
                        <tr key={idx} className="border-b border-border/50 hover:bg-muted/50">
                          <td className="py-3 px-4 text-foreground">{entry.name}</td>
                          <td className="py-3 px-4 text-right text-green-500">${(entry.wagered / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-3 px-4 text-right text-green-500">${(entry.deposited / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-3 px-4 text-right">{entry.active ? <span className="text-green-500 font-medium">Yes</span> : <span className="text-muted-foreground">No</span>}</td>
                          <td className="py-3 px-4 text-right text-green-500 font-medium">${(entry.earned / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
