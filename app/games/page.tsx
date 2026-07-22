'use client'

import useSWR from 'swr'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ShieldCheck } from 'lucide-react'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Header } from '@/components/header'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const GAMES = [
  {
    id: 'limbo',
    name: 'Limbo',
    description: 'Set a target multiplier and see how high it climbs. Bigger targets, bigger wins.',
    href: '/games/limbo',
    image: '/games/limbo-cover.png',
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    description: 'Beat the dealer to 21. Splits, doubles, insurance and surrender all in play.',
    href: '/games/blackjack',
    image: '/games/blackjack-cover.png',
  },
  {
    id: 'keno',
    name: 'Keno',
    description: 'Pick 1–10 numbers from a 40-tile grid. Match the draw to win big.',
    href: '/games/keno',
    image: '/games/keno-cover.png',
  },
  {
    id: 'plinko',
    name: 'Plinko',
    description: 'Drop the ball through the pins. Pick your rows and risk level.',
    href: '/games/plinko',
    image: '/games/plinko-cover.png',
  },
]

export default function GamesPage() {
  const { data: profile } = useSWR('/api/games/profile', fetcher)
  const { data: balanceData } = useSWR('/api/games/v2/balance', fetcher, { refreshInterval: 8000 })
  const isLoggedIn = !!profile?.id
  const balance = balanceData?.balance ?? 0

  return (
    <main className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />

      <div className="container mx-auto px-4 py-10">

        {/* Page heading */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">R2K2 Games</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Wager your R2Koins in provably fair games. Every result is independently verifiable.
          </p>
          {isLoggedIn ? (
            <div className="mt-4 inline-flex items-center gap-2 bg-card border border-border/40 rounded-full px-4 py-2 text-sm">
              <span className="text-muted-foreground">Your balance:</span>
              <span className="font-bold text-amber-400">
                {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} R2K
              </span>
            </div>
          ) : (
            <div className="mt-4">
              <Link href="/auth/login">
                <Button variant="outline">Log in to play</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Game image grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-14">
          {GAMES.map(game => (
            <Link
              key={game.id}
              href={isLoggedIn ? game.href : '/auth/login'}
              className="group relative block rounded-2xl overflow-hidden border border-border/30 bg-card/40 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 cursor-pointer"
            >
              {/* Game image */}
              <div className="relative aspect-square w-full overflow-hidden">
                <Image
                  src={game.image}
                  alt={game.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                {/* Provably fair badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm border border-green-500/30 rounded-full px-2.5 py-1">
                  <ShieldCheck className="h-3 w-3 text-green-400" />
                  <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wider">Provably Fair</span>
                </div>

                {/* Game info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-xs text-white/60 leading-snug">{game.description}</p>
                </div>
              </div>

              {/* Play button footer */}
              <div className="px-4 py-3 flex items-center justify-between bg-card/80 backdrop-blur-sm">
                <span className="text-sm font-semibold text-foreground">
                  {isLoggedIn ? `Play ${game.name}` : 'Log in to play'}
                </span>
                <span className="text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                  {isLoggedIn ? 'Play' : 'Log in'} &rarr;
                </span>
              </div>
            </Link>
          ))}
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
            <Button variant="outline" size="sm">Learn how it works &amp; verify results</Button>
          </Link>
        </div>

      </div>
    </main>
  )
}
