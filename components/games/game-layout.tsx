'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ShieldCheck, RefreshCw, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type Bet = {
  id: number
  game: string
  wager: number
  payout: number
  profit: number
  server_seed_hash: string
  client_seed: string
  nonce: number
  created_at: string
}

function formatProfit(profit: number) {
  if (profit > 0) return <span className="text-blue-400 flex items-center gap-1"><TrendingUp className="h-3 w-3" />+{profit.toLocaleString()}</span>
  if (profit < 0) return <span className="text-red-400 flex items-center gap-1"><TrendingDown className="h-3 w-3" />{profit.toLocaleString()}</span>
  return <span className="text-muted-foreground flex items-center gap-1"><Minus className="h-3 w-3" />0</span>
}

function ProvablyFairModal() {
  const { data: seeds, mutate: mutateSeeds } = useSWR('/api/games/seeds', fetcher)
  const [newClientSeed, setNewClientSeed] = useState('')
  const [rotating, setRotating] = useState(false)
  const [revealed, setRevealed] = useState<string | null>(null)

  const rotate = async () => {
    setRotating(true)
    const res = await fetch('/api/games/seeds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_seed: newClientSeed || undefined }),
    })
    const data = await res.json()
    setRevealed(data.revealed_server_seed)
    setNewClientSeed('')
    mutateSeeds()
    setRotating(false)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
          Provably Fair
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
            Provably Fair
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">Every bet is verifiable. The server seed is hashed before your bet — after rotating, the real seed is revealed so you can verify results yourself.</p>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active Server Seed Hash</label>
            <code className="block break-all bg-muted rounded px-3 py-2 text-xs">{seeds?.active_server_seed_hash ?? '...'}</code>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Client Seed</label>
            <code className="block break-all bg-muted rounded px-3 py-2 text-xs">{seeds?.client_seed ?? '...'}</code>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nonce</label>
            <code className="block bg-muted rounded px-3 py-2 text-xs">{seeds?.nonce ?? 0}</code>
          </div>

          {revealed && (
            <div className="space-y-2 border border-blue-500/30 rounded-lg p-3 bg-blue-500/5">
              <label className="text-xs font-medium uppercase tracking-wider text-blue-400">Revealed Server Seed</label>
              <code className="block break-all bg-muted rounded px-3 py-2 text-xs">{revealed}</code>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-border/40">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">New Client Seed (optional)</label>
            <Input
              placeholder="Leave blank for random"
              value={newClientSeed}
              onChange={e => setNewClientSeed(e.target.value)}
              className="text-xs"
            />
            <Button onClick={rotate} disabled={rotating} className="w-full gap-2" variant="outline">
              {rotating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Rotate Seeds
            </Button>
          </div>

          <Link href="/games/fairness" className="block text-center text-xs text-primary hover:underline">
            Verify past results on the Fairness page
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function GameLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const { data: profile } = useSWR('/api/games/profile', fetcher, { refreshInterval: 5000 })
  const { data: historyData } = useSWR('/api/games/history', fetcher)
  const bets: Bet[] = historyData?.bets ?? []

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border/40 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/games" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Games</Link>
            <span className="text-border/60">/</span>
            <span className="text-sm font-semibold">{title}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Balance: </span>
              <span className="font-bold text-blue-400">{(profile?.points ?? 0).toLocaleString()} pts</span>
            </div>
            <ProvablyFairModal />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">{children}</div>

          {/* Bet history sidebar */}
          <div>
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Bets</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {bets.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6 px-4">No bets yet</p>
                ) : (
                  <div className="divide-y divide-border/20">
                    {bets.slice(0, 10).map(bet => (
                      <div key={bet.id} className="px-4 py-2.5 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="text-xs capitalize px-1.5 py-0">{bet.game}</Badge>
                          {formatProfit(bet.profit)}
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>{bet.wager.toLocaleString()} → {bet.payout.toLocaleString()}</span>
                          <span>{new Date(bet.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
