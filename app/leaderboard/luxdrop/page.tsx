'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Clock, TrendingUp, Users, Search } from 'lucide-react'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Header } from '@/components/header'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const START_DATE = '2026-07-09'
const END_DATE   = '2026-08-08'
const DISPLAY_RANGE = 'Jul 9 – Aug 8, 2026'
const PRIZE_TOTAL = 2500

// Prize positions TBD — amounts will be updated once confirmed.
// Using 0 as a sentinel so UI shows "TBD" for each spot.
const REWARDS: number[] = []
// Placeholder: show top positions with TBD label until prizes are set
const REWARD_LABELS: (string | null)[] = []

// ---------------------------------------------------------------------------
// Types — LuxDrop API returns the array directly or wrapped
// ---------------------------------------------------------------------------
interface LuxDropEntry {
  userId?: number | string
  id?: number | string
  username?: string
  name?: string
  avatar?: string | null
  wagered?: number        // may be in cents or dollars — treat as cents
  wagerAmount?: number
  totalWagered?: number
  deposited?: number
  earned?: number
}

function normalizeEntries(raw: unknown): LuxDropEntry[] {
  if (Array.isArray(raw)) return raw as LuxDropEntry[]
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    // Common wrappers: { data: [...] }, { affiliates: [...] }, { results: [...] }
    for (const key of ['data', 'affiliates', 'results', 'leaderboard', 'entries']) {
      if (Array.isArray(obj[key])) return obj[key] as LuxDropEntry[]
    }
  }
  return []
}

function getEntryId(e: LuxDropEntry): string {
  return String(e.userId ?? e.id ?? Math.random())
}
function getEntryName(e: LuxDropEntry): string {
  return e.username ?? e.name ?? 'Unknown'
}
function getEntryWagered(e: LuxDropEntry): number {
  return e.wagered ?? e.wagerAmount ?? e.totalWagered ?? 0
}
function getEntryAvatar(e: LuxDropEntry): string | null {
  return e.avatar ?? null
}

export default function LuxdropLeaderboard() {
  const [entries, setEntries] = useState<LuxDropEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/luxdrop/affiliates?startDate=${START_DATE}&endDate=${END_DATE}`
        )
        const json = await res.json()
        if (!res.ok) {
          setError(json.error ?? 'Failed to load leaderboard')
          return
        }
        setEntries(normalizeEntries(json))
      } catch {
        setError('Failed to fetch leaderboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ---------------------------------------------------------------------------
  // Countdown timer
  // ---------------------------------------------------------------------------
  const computeTimeRemaining = () => {
    const end = new Date(END_DATE + 'T23:59:59Z').getTime()
    const diff = end - Date.now()
    if (diff <= 0) return 'Ended'
    const days    = Math.floor(diff / 86400000)
    const hours   = Math.floor((diff % 86400000) / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    if (days > 0)    return `${days}d ${hours}h ${minutes}m`
    if (hours > 0)   return `${hours}h ${minutes}m ${seconds}s`
    if (minutes > 0) return `${minutes}m ${seconds}s`
    return `${seconds}s`
  }

  useEffect(() => {
    setTimeRemaining(computeTimeRemaining())
    const interval = setInterval(() => setTimeRemaining(computeTimeRemaining()), 1000)
    return () => clearInterval(interval)
  }, [])

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const formatMoney = (cents: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(cents / 100)

  const maskName = (name: string) => {
    if (!name || name.length <= 3) return name
    return name.slice(0, 2) + '*'.repeat(name.length - 3) + name.slice(-1)
  }

  const getAvatarUrl = (avatar: string | null): string => {
    if (!avatar) return '/assets/r2k2-circular-avatar.png'
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar.split('#')[0]
    }
    return '/assets/r2k2-circular-avatar.png'
  }

  const totalWagered = entries.reduce((sum, e) => sum + getEntryWagered(e), 0)

  const prizeLabel = (rank: number): string => {
    if (REWARDS[rank - 1] != null && REWARDS[rank - 1] > 0) {
      return REWARD_LABELS[rank - 1] ?? `$${REWARDS[rank - 1].toLocaleString()}`
    }
    return 'TBD'
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-background text-foreground">
      <GiveawayCounter />
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <img
              src="/assets/luxdrop.png"
              alt="LuxDrop"
              className="h-12 md:h-14 w-auto mx-auto object-contain"
            />
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/20 border border-primary/40">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="text-3xl font-bold text-primary">${PRIZE_TOTAL.toLocaleString()}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-balance">
              LuxDrop <span className="text-primary">${PRIZE_TOTAL.toLocaleString()}</span> Leaderboard
            </h1>
            <div className="flex justify-center">
              <a
                href="https://luxdrop.com/r/R2K2"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors font-semibold"
              >
                <Trophy className="h-4 w-4" />
                Sign up on LuxDrop
              </a>
            </div>
            <p className="text-lg text-muted-foreground text-pretty">
              Every <strong>wager</strong> on LuxDrop under Code{' '}
              <strong className="text-primary">R2K2</strong> counts towards your score.
              <br />
              <em className="text-sm">{DISPLAY_RANGE}</em>
            </p>

            {/* Prize positions */}
            <div className="flex flex-wrap justify-center gap-2 text-sm font-semibold">
              {Array.from({ length: 5 }).map((_, i) => {
                const ordinals = ['1st', '2nd', '3rd', '4th', '5th']
                const colors = [
                  'bg-yellow-400/20 border-yellow-400/40 text-yellow-400',
                  'bg-slate-400/20 border-slate-400/40 text-slate-300',
                  'bg-amber-700/20 border-amber-700/40 text-amber-500',
                  'bg-primary/20 border-primary/40 text-primary',
                  'bg-green-600/20 border-green-600/40 text-green-500',
                ]
                return (
                  <span key={i} className={`px-3 py-1 rounded-full border ${colors[i]}`}>
                    {ordinals[i]} — TBD
                  </span>
                )
              })}
              <span className="px-3 py-1 rounded-full border bg-muted/30 border-border text-muted-foreground">
                +More positions coming soon
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats cards */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-4xl mx-auto">
          <Card className="bg-card/50 backdrop-blur border-primary/20">
            <CardContent className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5 tracking-wider">Total Wagered</p>
                  <p className="text-xl font-bold text-primary truncate">{formatMoney(totalWagered)}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-primary/40 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-blue-500/20">
            <CardContent className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5 tracking-wider">Participants</p>
                  <p className="text-xl font-bold text-blue-400">{entries.length.toLocaleString()}</p>
                </div>
                <Users className="h-5 w-5 text-blue-400/40 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 md:col-span-1 bg-card/50 backdrop-blur border-destructive/20">
            <CardContent className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5 tracking-wider">Time Remaining</p>
                  <p className="text-xl font-bold text-destructive truncate" suppressHydrationWarning>{timeRemaining || '...'}</p>
                </div>
                <Clock className="h-5 w-5 text-destructive/40 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="py-8 pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-6">

            {/* Loading */}
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                <p className="mt-4 text-muted-foreground">Loading leaderboard...</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-center py-12 bg-destructive/10 rounded-lg border border-destructive/30 p-6">
                <p className="text-destructive text-lg font-semibold mb-2">Error Loading Leaderboard</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && entries.length === 0 && (
              <div className="text-center py-16 bg-muted/30 rounded-2xl border border-border p-8">
                <Trophy className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">No entries yet</h2>
                <p className="text-muted-foreground text-pretty">
                  The leaderboard is live — sign up on LuxDrop with code{' '}
                  <strong className="text-primary">R2K2</strong> and start wagering to claim your spot.
                </p>
                <a
                  href="https://luxdrop.com/r/R2K2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex mt-4 items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold text-sm"
                >
                  Join LuxDrop with R2K2
                </a>
              </div>
            )}

            {/* Podium + table */}
            {!loading && !error && entries.length > 0 && (
              <>
                {/* Podium top 3 */}
                <div className="mb-10">
                  <h2 className="text-2xl font-bold text-center mb-8">Top Performers</h2>

                  {/* Mobile: 1st full width, 2nd+3rd side by side */}
                  <div className="flex flex-col gap-3 md:hidden">
                    {entries[0] && (
                      <div className="relative rounded-2xl border border-yellow-400/50 bg-card overflow-hidden" style={{ boxShadow: '0 0 40px rgba(250,204,21,0.2)' }}>
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-yellow-400" />
                        <div className="p-5 flex flex-col items-center text-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold uppercase tracking-widest text-yellow-400">1st Place</span>
                            <Trophy className="h-4 w-4 text-yellow-400" />
                          </div>
                          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-yellow-400/70" style={{ boxShadow: '0 0 20px rgba(250,204,21,0.3)' }}>
                            <img src={getAvatarUrl(getEntryAvatar(entries[0]))} alt={getEntryName(entries[0])} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-user.jpg' }} />
                          </div>
                          <p className="font-bold text-lg text-foreground truncate w-full">{maskName(getEntryName(entries[0]))}</p>
                          <div className="w-full space-y-2">
                            <div className="flex items-center justify-between text-sm bg-muted/40 rounded-lg px-3 py-2">
                              <span className="text-muted-foreground">Wagered</span>
                              <span className="font-semibold text-foreground">{formatMoney(getEntryWagered(entries[0]))}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-3 py-2">
                              <span className="text-yellow-400/80">Prize</span>
                              <span className="font-bold text-yellow-400">{prizeLabel(1)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {entries[1] && (
                        <div className="relative rounded-2xl border border-slate-400/40 bg-card overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-400" />
                          <div className="p-4 flex flex-col items-center text-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">2nd</span>
                            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-slate-400/60">
                              <img src={getAvatarUrl(getEntryAvatar(entries[1]))} alt={getEntryName(entries[1])} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-user.jpg' }} />
                            </div>
                            <p className="font-bold text-xs text-foreground truncate w-full">{maskName(getEntryName(entries[1]))}</p>
                            <div className="w-full space-y-1">
                              <div className="rounded-lg bg-muted/40 px-2 py-1.5 text-center">
                                <p className="text-xs text-muted-foreground">Wagered</p>
                                <p className="text-xs font-semibold">{formatMoney(getEntryWagered(entries[1]))}</p>
                              </div>
                              <div className="rounded-lg bg-slate-400/10 border border-slate-400/20 px-2 py-1.5 text-center">
                                <p className="text-xs text-slate-400/80">Prize</p>
                                <p className="text-xs font-bold text-slate-300">{prizeLabel(2)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {entries[2] && (
                        <div className="relative rounded-2xl border border-amber-700/40 bg-card overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-600" />
                          <div className="p-4 flex flex-col items-center text-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-amber-500">3rd</span>
                            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-amber-600/60">
                              <img src={getAvatarUrl(getEntryAvatar(entries[2]))} alt={getEntryName(entries[2])} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-user.jpg' }} />
                            </div>
                            <p className="font-bold text-xs text-foreground truncate w-full">{maskName(getEntryName(entries[2]))}</p>
                            <div className="w-full space-y-1">
                              <div className="rounded-lg bg-muted/40 px-2 py-1.5 text-center">
                                <p className="text-xs text-muted-foreground">Wagered</p>
                                <p className="text-xs font-semibold">{formatMoney(getEntryWagered(entries[2]))}</p>
                              </div>
                              <div className="rounded-lg bg-amber-600/10 border border-amber-600/20 px-2 py-1.5 text-center">
                                <p className="text-xs text-amber-500/80">Prize</p>
                                <p className="text-xs font-bold text-amber-500">{prizeLabel(3)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Desktop: 2nd | 1st | 3rd */}
                  <div className="hidden md:flex items-end justify-center gap-3">
                    {entries[1] && (
                      <div className="relative rounded-2xl border border-slate-400/40 bg-card overflow-hidden flex-1 max-w-[220px]" style={{ boxShadow: '0 0 20px rgba(148,163,184,0.1)' }}>
                        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-400" />
                        <div className="p-5 flex flex-col items-center text-center gap-3">
                          <span className="text-xs font-bold uppercase tracking-widest text-slate-300">2nd Place</span>
                          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-slate-400/60">
                            <img src={getAvatarUrl(getEntryAvatar(entries[1]))} alt={getEntryName(entries[1])} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-user.jpg' }} />
                          </div>
                          <p className="font-bold text-sm text-foreground truncate w-full">{maskName(getEntryName(entries[1]))}</p>
                          <div className="w-full space-y-1.5">
                            <div className="flex items-center justify-between text-xs bg-muted/40 rounded-lg px-3 py-1.5">
                              <span className="text-muted-foreground">Wagered</span>
                              <span className="font-semibold">{formatMoney(getEntryWagered(entries[1]))}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs bg-slate-400/10 border border-slate-400/20 rounded-lg px-3 py-1.5">
                              <span className="text-slate-400/80">Prize</span>
                              <span className="font-bold text-slate-300">{prizeLabel(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {entries[0] && (
                      <div className="relative rounded-2xl border border-yellow-400/50 bg-card overflow-hidden flex-1 max-w-[280px]" style={{ boxShadow: '0 0 40px rgba(250,204,21,0.2)' }}>
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-yellow-400" />
                        <div className="p-7 flex flex-col items-center text-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold uppercase tracking-widest text-yellow-400">1st Place</span>
                            <Trophy className="h-4 w-4 text-yellow-400" />
                          </div>
                          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-yellow-400/70" style={{ boxShadow: '0 0 20px rgba(250,204,21,0.3)' }}>
                            <img src={getAvatarUrl(getEntryAvatar(entries[0]))} alt={getEntryName(entries[0])} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-user.jpg' }} />
                          </div>
                          <p className="font-bold text-xl text-foreground truncate w-full">{maskName(getEntryName(entries[0]))}</p>
                          <div className="w-full space-y-2">
                            <div className="flex items-center justify-between text-sm bg-muted/40 rounded-lg px-3 py-2">
                              <span className="text-muted-foreground">Wagered</span>
                              <span className="font-semibold">{formatMoney(getEntryWagered(entries[0]))}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-3 py-2">
                              <span className="text-yellow-400/80">Prize</span>
                              <span className="font-bold text-yellow-400 text-lg">{prizeLabel(1)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {entries[2] && (
                      <div className="relative rounded-2xl border border-amber-700/40 bg-card overflow-hidden flex-1 max-w-[220px]" style={{ boxShadow: '0 0 20px rgba(180,83,9,0.1)' }}>
                        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-600" />
                        <div className="p-5 flex flex-col items-center text-center gap-3">
                          <span className="text-xs font-bold uppercase tracking-widest text-amber-500">3rd Place</span>
                          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-600/60">
                            <img src={getAvatarUrl(getEntryAvatar(entries[2]))} alt={getEntryName(entries[2])} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-user.jpg' }} />
                          </div>
                          <p className="font-bold text-sm text-foreground truncate w-full">{maskName(getEntryName(entries[2]))}</p>
                          <div className="w-full space-y-1.5">
                            <div className="flex items-center justify-between text-xs bg-muted/40 rounded-lg px-3 py-1.5">
                              <span className="text-muted-foreground">Wagered</span>
                              <span className="font-semibold">{formatMoney(getEntryWagered(entries[2]))}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs bg-amber-600/10 border border-amber-600/20 rounded-lg px-3 py-1.5">
                              <span className="text-amber-500/80">Prize</span>
                              <span className="font-bold text-amber-500">{prizeLabel(3)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search your exact username to see your wager amount..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                  />
                </div>

                {/* Search results */}
                {searchQuery.trim() && (() => {
                  const q = searchQuery.trim().toLowerCase()
                  const matches = entries.filter(e => getEntryName(e).toLowerCase() === q)
                  if (matches.length === 0) {
                    return (
                      <div className="text-center py-4 rounded-xl bg-muted/30 border border-border text-sm text-muted-foreground">
                        No user found with that exact username. Usernames are case-insensitive but must be exact.
                      </div>
                    )
                  }
                  return (
                    <div className="space-y-2">
                      {matches.map((entry) => {
                        const rank = entries.findIndex(e => getEntryId(e) === getEntryId(entry)) + 1
                        return (
                          <div key={getEntryId(entry)} className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-primary">#{rank}</span>
                              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-primary/30">
                                <img src={getAvatarUrl(getEntryAvatar(entry))} alt={getEntryName(entry)} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-user.jpg' }} />
                              </div>
                              <span className="font-semibold text-sm text-foreground">{maskName(getEntryName(entry))}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Wagered</p>
                                <p className="font-bold text-foreground">{formatMoney(getEntryWagered(entry))}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Prize</p>
                                <p className="font-bold text-green-600">{prizeLabel(rank)}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}

                {/* Table rows 4+ */}
                {entries.length > 3 && (
                  <div className="rounded-xl overflow-hidden border border-border/50">
                    <div className="grid grid-cols-[64px_1fr_140px_100px] px-4 py-3 bg-muted/40 border-b border-border/50">
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rank</span>
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Player</span>
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Wagered</span>
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Prize</span>
                    </div>
                    <div className="divide-y divide-border/30">
                      {entries.slice(3).map((entry, idx) => (
                        <LuxDropRow
                          key={getEntryId(entry)}
                          rank={idx + 4}
                          entry={entry}
                          prizeLabel={prizeLabel(idx + 4)}
                          formatMoney={formatMoney}
                          maskName={maskName}
                          getAvatarUrl={getAvatarUrl}
                          getEntryName={getEntryName}
                          getEntryWagered={getEntryWagered}
                          getEntryAvatar={getEntryAvatar}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <p className="text-sm text-muted-foreground">© 2026 R2K2<br />All Rights Reserved</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Socials</h3>
              <div className="space-y-2">
                <a href="https://kick.com/R2Ktwo" target="_blank" rel="noopener" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Kick</a>
                <a href="https://discord.gg/DwpA8vaGPj" target="_blank" rel="noopener" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Discord</a>
              </div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h3 className="font-semibold mb-4">Responsible Gaming</h3>
              <p className="text-xs text-muted-foreground">
                Remember: Gambling over a long period will always result in losses. Please set limits and gamble responsibly.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Row component
// ---------------------------------------------------------------------------
function LuxDropRow({
  rank, entry, prizeLabel, formatMoney, maskName, getAvatarUrl,
  getEntryName, getEntryWagered, getEntryAvatar,
}: {
  rank: number
  entry: LuxDropEntry
  prizeLabel: string
  formatMoney: (n: number) => string
  maskName: (s: string) => string
  getAvatarUrl: (a: string | null) => string
  getEntryName: (e: LuxDropEntry) => string
  getEntryWagered: (e: LuxDropEntry) => number
  getEntryAvatar: (e: LuxDropEntry) => string | null
}) {
  const [imgError, setImgError] = useState(false)
  return (
    <div className="grid grid-cols-[64px_1fr_140px_100px] items-center px-4 py-3 bg-card/50 hover:bg-muted/20 transition-colors">
      <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-primary/40 flex-shrink-0">
          <img
            src={imgError ? '/placeholder-user.jpg' : getAvatarUrl(getEntryAvatar(entry))}
            alt={getEntryName(entry)}
            className="absolute inset-0 w-full h-full object-cover"
            crossOrigin="anonymous"
            onError={() => setImgError(true)}
          />
        </div>
        <p className="font-semibold text-sm truncate">{maskName(getEntryName(entry))}</p>
      </div>
      <p className="text-sm font-semibold text-foreground text-right">{formatMoney(getEntryWagered(entry))}</p>
      <p className="text-sm font-bold text-right text-green-600">{prizeLabel}</p>
    </div>
  )
}
