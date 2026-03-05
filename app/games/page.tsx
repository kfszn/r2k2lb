'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, Spade, Grid3X3, Gamepad2 } from 'lucide-react'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Header } from '@/components/header'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const GAMES = [
  {
    id: 'blackjack',
    name: 'Blackjack',
    description: 'Classic card game — beat the dealer to 21. Blackjack pays 2x, dealer stands on soft 17.',
    href: '/games/blackjack',
    icon: Spade,
    maxPayout: '20,000 pts',
    badge: 'Cards',
  },
  {
    id: 'keno',
    name: 'Keno',
    description: 'Pick 1–6 numbers from a 30-number grid. Match more numbers to win bigger. Choose your risk level.',
    href: '/games/keno',
    icon: Grid3X3,
    maxPayout: '20,000 pts',
    badge: 'Numbers',
  },
  {
    id: 'plinko',
    name: 'Plinko',
    description: 'Drop a ball through 16 rows of pegs. Watch it bounce to your multiplier. Low, Medium or High risk.',
    href: '/games/plinko',
    icon: Gamepad2,
    maxPayout: '20,000 pts',
    badge: 'Plinko',
  },
]

export default function GamesPage() {
  const { data: profile } = useSWR('/api/games/profile', fetcher)
  const isLoggedIn = !!profile?.id

  return (
    <main className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />

      <div className="container mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">R2K2 Games</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Wager your points in provably fair games. Every result is verifiable — no trust required.
          </p>
          {isLoggedIn && (
            <div className="mt-4 inline-flex items-center gap-2 bg-card border border-border/40 rounded-full px-4 py-2 text-sm">
              <span className="text-muted-foreground">Your balance:</span>
              <span className="font-bold text-primary">{(profile.points ?? 0).toLocaleString()} pts</span>
            </div>
          )}
          {!isLoggedIn && (
            <div className="mt-4">
              <Link href="/auth/login">
                <Button variant="outline">Log in to play</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Game cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          {GAMES.map(game => {
            const Icon = game.icon
            return (
              <Card key={game.id} className="border-border/40 bg-card/50 hover:border-primary/40 transition-all group">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-xs">{game.badge}</Badge>
                  </div>
                  <CardTitle className="text-xl">{game.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{game.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Max payout: <span className="text-foreground font-medium">{game.maxPayout}</span></span>
                    <div className="flex items-center gap-1 text-green-400">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Provably Fair</span>
                    </div>
                  </div>
                  <Link href={isLoggedIn ? game.href : '/auth/login'}>
                    <Button className="w-full" variant={isLoggedIn ? 'default' : 'outline'}>
                      {isLoggedIn ? `Play ${game.name}` : 'Log in to play'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Provably fair callout */}
        <div className="max-w-2xl mx-auto text-center border border-border/40 rounded-xl p-6 bg-card/30">
          <div className="flex items-center justify-center gap-2 mb-3">
            <ShieldCheck className="h-5 w-5 text-green-400" />
            <h2 className="font-semibold">Provably Fair Gaming</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Every game result is generated using HMAC-SHA256 with server and client seeds. The server seed is hashed before your bet and revealed after — you can independently verify any result.
          </p>
          <Link href="/games/fairness">
            <Button variant="outline" size="sm">Learn how it works & verify results</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
