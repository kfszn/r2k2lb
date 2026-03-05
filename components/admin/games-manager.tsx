'use client'

import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Gamepad2, TrendingUp, TrendingDown, DollarSign, Hash } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type Bet = {
  id: number
  game: string
  wager: number
  payout: number
  profit: number
  result: Record<string, unknown>
  created_at: string
  profiles: { account_id: string; email: string } | null
}

type Stats = {
  totalBets: number
  totalWagered: number
  totalPaidOut: number
  houseProfit: number
}

function StatCard({ label, value, icon: Icon, color = '' }: { label: string; value: string; icon: React.ElementType; color?: string }) {
  return (
    <div className="border border-border/40 rounded-lg p-4 space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

export function GamesManager() {
  const { data } = useSWR<{ stats: Stats; byGame: Record<string, { bets: number; wagered: number; paidOut: number }>; recentBets: Bet[] }>(
    '/api/admin/games', fetcher, { refreshInterval: 30000 }
  )

  const stats = data?.stats
  const byGame = data?.byGame ?? {}
  const recentBets = data?.recentBets ?? []

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gamepad2 className="h-5 w-5 text-primary" />
            Games Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Bets" value={(stats?.totalBets ?? 0).toLocaleString()} icon={Hash} />
            <StatCard label="Total Wagered" value={`${(stats?.totalWagered ?? 0).toLocaleString()} pts`} icon={DollarSign} />
            <StatCard label="Total Paid Out" value={`${(stats?.totalPaidOut ?? 0).toLocaleString()} pts`} icon={TrendingUp} />
            <StatCard
              label="House Profit"
              value={`${(stats?.houseProfit ?? 0).toLocaleString()} pts`}
              icon={stats?.houseProfit && stats.houseProfit >= 0 ? TrendingUp : TrendingDown}
              color={(stats?.houseProfit ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Per-game breakdown */}
      {Object.keys(byGame).length > 0 && (
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">By Game</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(byGame).map(([game, g]) => (
                <div key={game} className="border border-border/30 rounded-lg p-3 space-y-2">
                  <p className="font-semibold capitalize">{game}</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between"><span>Bets</span><span className="text-foreground font-medium">{g.bets.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Wagered</span><span className="text-foreground font-medium">{g.wagered.toLocaleString()} pts</span></div>
                    <div className="flex justify-between"><span>Paid Out</span><span className="text-foreground font-medium">{g.paidOut.toLocaleString()} pts</span></div>
                    <div className="flex justify-between border-t border-border/20 pt-1">
                      <span>House Profit</span>
                      <span className={`font-bold ${(g.wagered - g.paidOut) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(g.wagered - g.paidOut).toLocaleString()} pts
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent bets */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Bets</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentBets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No bets yet</p>
          ) : (
            <div className="divide-y divide-border/20">
              {recentBets.map(bet => (
                <div key={bet.id} className="px-6 py-3 flex items-center justify-between gap-4 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="outline" className="capitalize text-xs shrink-0">{bet.game}</Badge>
                    <span className="text-muted-foreground text-xs truncate">
                      {bet.profiles?.account_id ?? bet.profiles?.email ?? 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-xs">
                    <span className="text-muted-foreground">{bet.wager.toLocaleString()} → {bet.payout.toLocaleString()}</span>
                    <span className={bet.profit > 0 ? 'text-green-400 font-semibold' : bet.profit < 0 ? 'text-red-400 font-semibold' : 'text-muted-foreground'}>
                      {bet.profit > 0 ? '+' : ''}{bet.profit.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">{new Date(bet.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
