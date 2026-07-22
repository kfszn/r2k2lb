'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ShieldCheck, RefreshCw, Loader2, TrendingUp, TrendingDown, Minus, Coins } from 'lucide-react'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export const BALANCE_KEY = '/api/games/v2/balance'
export const seedKey = () => '/api/games/v2/seed'
export const historyKey = (game: string) => `/api/games/v2/history?game=${game}&limit=12`

/** Games call this after a settled round to refresh the shell instantly. */
export function refreshShell(game: string, balance?: number) {
  if (balance !== undefined) {
    mutate(BALANCE_KEY, { balance }, false)
  } else {
    mutate(BALANCE_KEY)
  }
  mutate(historyKey(game))
}

export function formatKoins(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

interface Round {
  id: string
  game: string
  bet_amount: number
  payout: number
  profit: number
  server_seed_hash: string
  client_seed: string
  nonce: number
  created_at: string
}

function formatProfit(profit: number) {
  if (profit > 0)
    return (
      <span className="text-emerald-400 flex items-center gap-1">
        <TrendingUp className="h-3 w-3" />+{formatKoins(profit)}
      </span>
    )
  if (profit < 0)
    return (
      <span className="text-red-400 flex items-center gap-1">
        <TrendingDown className="h-3 w-3" />
        {formatKoins(profit)}
      </span>
    )
  return (
    <span className="text-muted-foreground flex items-center gap-1">
      <Minus className="h-3 w-3" />0
    </span>
  )
}

function ProvablyFairModal() {
  const { data: seed, mutate: mutateSeed } = useSWR(seedKey(), fetcher)
  const [newClientSeed, setNewClientSeed] = useState('')
  const [rotating, setRotating] = useState(false)
  const [revealed, setRevealed] = useState<string | null>(null)

  const rotate = async () => {
    setRotating(true)
    try {
      const res = await fetch('/api/games/v2/rotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientSeed: newClientSeed || undefined }),
      })
      const data = await res.json()
      setRevealed(data?.revealed?.serverSeed ?? null)
      setNewClientSeed('')
      mutateSeed()
    } finally {
      setRotating(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          Provably Fair
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            Provably Fair
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Every round is verifiable. The server seed is hashed and shown before you play; after you
            rotate seeds the real server seed is revealed so you can independently verify every result.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Active Server Seed Hash
            </label>
            <code className="block break-all bg-muted rounded px-3 py-2 text-xs">
              {seed?.serverSeedHash ?? '...'}
            </code>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Client Seed
              </label>
              <code className="block break-all bg-muted rounded px-3 py-2 text-xs">
                {seed?.clientSeed ?? '...'}
              </code>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Nonce
              </label>
              <code className="block bg-muted rounded px-3 py-2 text-xs">{seed?.nonce ?? 0}</code>
            </div>
          </div>

          {revealed && (
            <div className="space-y-2 border border-emerald-500/30 rounded-lg p-3 bg-emerald-500/5">
              <label className="text-xs font-medium uppercase tracking-wider text-emerald-400">
                Revealed Server Seed (previous)
              </label>
              <code className="block break-all bg-muted rounded px-3 py-2 text-xs">{revealed}</code>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-border/40">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              New Client Seed (optional)
            </label>
            <Input
              placeholder="Leave blank for random"
              value={newClientSeed}
              onChange={(e) => setNewClientSeed(e.target.value)}
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

export function GameShell({
  title,
  game,
  children,
}: {
  title: string
  game: string
  children: React.ReactNode
}) {
  const { data: balanceData } = useSWR(BALANCE_KEY, fetcher, { refreshInterval: 8000 })
  const { data: historyData } = useSWR(historyKey(game), fetcher, { refreshInterval: 6000 })
  const rounds: Round[] = historyData?.rounds ?? []
  const balance = balanceData?.balance ?? 0

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/40 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/games"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Games
            </Link>
            <span className="text-border/60">/</span>
            <span className="text-sm font-semibold">{title}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm">
              <Coins className="h-4 w-4 text-amber-400" />
              <span className="font-bold text-amber-400 tabular-nums">{formatKoins(balance)}</span>
              <span className="text-muted-foreground text-xs">R2K</span>
            </div>
            <ProvablyFairModal />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">{children}</div>

          <div>
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Recent Rounds
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {rounds.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6 px-4">No rounds yet</p>
                ) : (
                  <div className="divide-y divide-border/20">
                    {rounds.map((r) => (
                      <div key={r.id} className="px-4 py-2.5 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="text-xs capitalize px-1.5 py-0">
                            {r.game}
                          </Badge>
                          {formatProfit(Number(r.profit))}
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>
                            {formatKoins(Number(r.bet_amount))} → {formatKoins(Number(r.payout))}
                          </span>
                          <span>
                            {new Date(r.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
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
