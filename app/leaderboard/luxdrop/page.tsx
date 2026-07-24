'use client'

import { useEffect, useState } from 'react'
import { Trophy, Clock, TrendingUp, Users, Search, BookOpen, CheckCircle, AlertCircle, Target } from 'lucide-react'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Header } from '@/components/header'
import {
  LeaderboardBackdrop,
  StatCard,
  PodiumCard,
  PlayerRow,
  TableHeader,
  PrizePool,
} from '@/components/leaderboard/leaderboard-ui'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
// Query start pulled back 1 day (Jul 7) to make sure wagers near the
// boundary/timezone edge are captured. Displayed range stays Jul 8.
const START_DATE = '2026-07-07'
const END_DATE   = '2026-08-08'
const DISPLAY_RANGE = 'Jul 8 – Aug 8, 2026'
const PRIZE_TOTAL = 2500
const WAGER_GOAL = 65000

// Top 10 prize breakdown — $2,500 total pool
// 1st $1,000 · 2nd $500 · 3rd $300 · 4th $175 · 5th $125
// 6th $100 · 7th $100 · 8th $75 · 9th $75 · 10th $50
const REWARDS: number[] = [1000, 500, 300, 175, 125, 100, 100, 75, 75, 50]
const REWARD_LABELS: (string | null)[] = REWARDS.map(
  (amt) => `$${amt.toLocaleString()}`
)

// ---------------------------------------------------------------------------
// Types — LuxDrop API returns the array directly or wrapped
// ---------------------------------------------------------------------------
interface LuxDropEntry {
  userId?: number | string
  id?: number | string
  username?: string
  name?: string
  avatar?: string | null
  wagered?: number        // LuxDrop returns this in dollars
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
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'rules'>('leaderboard')
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
          `/api/luxdrop/affiliates?startDate=${START_DATE}&endDate=${END_DATE}`,
          { cache: 'no-store' }
        )
        const json = await res.json()
        if (!res.ok) {
          setError(`${json.error ?? 'Failed to load leaderboard'}${json.detail ? ` — ${json.detail}` : ''}`)
          return
        }
        setEntries(normalizeEntries(json))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        setError(`Failed to fetch leaderboard — ${msg}`)
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
  // LuxDrop returns wager amounts already in dollars (unlike AceBet which uses cents)
  const formatMoney = (dollars: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(dollars)

  const maskName = (name: string) => {
    if (!name || name.length <= 3) return name
    return name.slice(0, 2) + '*'.repeat(name.length - 3) + name.slice(-1)
  }

  const getAvatarUrl = (avatar: string | null): string => {
    if (!avatar) return '/assets/luxdrop-icon.png'
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar.split('#')[0]
    }
    return '/assets/luxdrop-icon.png'
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
    <div className="relative min-h-screen bg-background text-foreground">
      <LeaderboardBackdrop />
      <GiveawayCounter />
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary animate-fade-in-up">
              Live Competition
            </span>
            <img
              src="/assets/luxdrop.png"
              alt="LuxDrop"
              className="h-12 md:h-14 w-auto mx-auto object-contain animate-fade-in-up animation-delay-100 drop-shadow-[0_0_25px_rgba(80,120,255,0.35)]"
            />
            <div className="flex justify-center animate-fade-in-up animation-delay-200">
              <PrizePool total={`$${PRIZE_TOTAL.toLocaleString()}`} />
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight text-balance animate-fade-in-up animation-delay-200 tracking-tight">
              Monthly <span className="neon-text text-primary">Leaderboard</span>
            </h1>
            <div className="flex justify-center">
              <a
                href="https://luxdrop.com/r/R2K2"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold shadow-[0_0_30px_-8px_rgba(80,120,255,0.7)] hover:shadow-[0_0_40px_-6px_rgba(80,120,255,0.9)]"
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

            {/* Prize positions — top 5 displayed */}
            <div className="flex flex-wrap justify-center gap-2 text-sm font-semibold">
              {[
                { label: '1st', prize: '$1,000', color: 'bg-yellow-400/20 border-yellow-400/40 text-yellow-400' },
                { label: '2nd', prize: '$500',   color: 'bg-slate-400/20 border-slate-400/40 text-slate-300' },
                { label: '3rd', prize: '$300',   color: 'bg-amber-700/20 border-amber-700/40 text-amber-500' },
                { label: '4th', prize: '$175',   color: 'bg-primary/20 border-primary/40 text-primary' },
                { label: '5th', prize: '$125',   color: 'bg-green-600/20 border-green-600/40 text-green-500' },
              ].map(({ label, prize, color }) => (
                <span key={label} className={`px-3 py-1 rounded-full border ${color}`}>
                  {label} — {prize}
                </span>
              ))}
              <span className="px-3 py-1 rounded-full border bg-muted/30 border-border text-muted-foreground">
                +5 more positions paid
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats cards */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-4xl mx-auto">
          <StatCard
            label="Total Wagered"
            value={formatMoney(totalWagered)}
            icon={<TrendingUp className="h-5 w-5" />}
            tone="primary"
          />
          <StatCard
            label="Participants"
            value={entries.length.toLocaleString()}
            icon={<Users className="h-5 w-5" />}
            tone="accent"
          />
          <StatCard
            label="Time Remaining"
            value={<span suppressHydrationWarning>{timeRemaining || '...'}</span>}
            icon={<Clock className="h-5 w-5" />}
            tone="destructive"
            className="col-span-2 md:col-span-1"
          />
        </div>

        {/* Wager Goal */}
        {(() => {
          const pct = Math.min((totalWagered / WAGER_GOAL) * 100, 100)
          const reached = totalWagered >= WAGER_GOAL
          return (
            <div className="max-w-4xl mx-auto mt-3 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className={`h-4 w-4 ${reached ? 'text-green-400' : 'text-primary'}`} />
                  <span className="text-sm font-semibold">
                    {reached ? 'Goal Reached!' : 'Wager Goal'}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 text-sm tabular-nums">
                  <span className={`font-bold ${reached ? 'text-green-400' : 'text-foreground'}`}>
                    {formatMoney(totalWagered)}
                  </span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-muted-foreground">{formatMoney(WAGER_GOAL)}</span>
                  <span className={`ml-1 text-xs font-semibold ${reached ? 'text-green-400' : 'text-primary'}`}>
                    {pct.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/60">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${reached ? 'bg-green-400' : 'bg-primary'} shadow-[0_0_12px_-2px_rgba(80,120,255,0.7)]`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {!reached && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatMoney(WAGER_GOAL - totalWagered)} remaining to reach the goal
                </p>
              )}
            </div>
          )
        })()}
      </section>

      {/* Tab Nav */}
      <section className="container mx-auto px-4 pb-2">
        <div className="max-w-5xl mx-auto">
          <div className="flex gap-1 p-1 rounded-xl bg-card/60 border border-border/40 w-fit backdrop-blur-xl">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-primary text-primary-foreground shadow-[0_0_20px_-4px_rgba(80,120,255,0.7)]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Trophy className="h-4 w-4" />
              Leaderboard
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'rules'
                  ? 'bg-primary text-primary-foreground shadow-[0_0_20px_-4px_rgba(80,120,255,0.7)]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Rules
            </button>
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="py-8 pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-6">

            {activeTab === 'rules' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="rounded-2xl border border-primary/20 bg-card/60 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Leaderboard Rules</h2>
                      <p className="text-sm text-muted-foreground">{DISPLAY_RANGE}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The LuxDrop leaderboard tracks your wagering activity on{' '}
                    <a href="https://luxdrop.com/r/R2K2" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">luxdrop.com</a>{' '}
                    using code <strong className="text-primary">R2K2</strong>. Your score is calculated based on the type of game you play — see the breakdown below.
                  </p>
                </div>

                {/* Wager contribution table */}
                <div className="rounded-2xl border border-border/50 overflow-hidden">
                  <div className="px-5 py-4 bg-muted/40 border-b border-border/50">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Wager Contribution by Game Type</h3>
                  </div>
                  <div className="divide-y divide-border/30">
                    {/* Packs, Battles, Deals, Mines row */}
                    <div className="flex items-center justify-between px-5 py-4 bg-card/50 hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm">Packs, Battles, Deals &amp; Mines</p>
                          <p className="text-xs text-muted-foreground">Full wager value counts toward your leaderboard score</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-4">
                        <span className="text-lg font-bold text-green-500">100%</span>
                        <span className="text-xs text-muted-foreground">of wager counts</span>
                      </div>
                    </div>

                    {/* Blackjack row */}
                    <div className="flex items-center justify-between px-5 py-4 bg-card/50 hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm">Blackjack</p>
                          <p className="text-xs text-muted-foreground">Only 5% of your wager counts toward your leaderboard score</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-4">
                        <span className="text-lg font-bold text-yellow-500">5%</span>
                        <span className="text-xs text-muted-foreground">of wager counts</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Example callout */}
                <div className="rounded-xl bg-muted/30 border border-border/40 px-5 py-4">
                  <p className="text-sm font-semibold mb-2">Example</p>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li>• A <strong className="text-foreground">$100</strong> wager on Packs, Battles, Deals, or Mines → <strong className="text-green-500">$100</strong> added to your leaderboard score.</li>
                    <li>• A <strong className="text-foreground">$100</strong> wager on Blackjack → <strong className="text-yellow-500">$5</strong> added to your leaderboard score.</li>
                  </ul>
                </div>

                {/* Prize breakdown */}
                <div className="rounded-2xl border border-border/50 overflow-hidden">
                  <div className="px-5 py-4 bg-muted/40 border-b border-border/50">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Prize Breakdown — ${PRIZE_TOTAL.toLocaleString()} Pool</h3>
                  </div>
                  <div className="divide-y divide-border/30">
                    {REWARDS.map((amt, i) => {
                      const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th']
                      return (
                        <div key={i} className="flex items-center justify-between px-5 py-3 bg-card/50">
                          <div className="flex items-center gap-3">
                            <span className="text-sm w-8 text-center font-bold text-muted-foreground">{ordinals[i]}</span>
                            <Trophy className={`h-4 w-4 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-500' : 'text-muted-foreground/40'}`} />
                          </div>
                          <span className={`font-bold text-sm ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-500' : 'text-foreground'}`}>
                            ${amt.toLocaleString()}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Eligibility */}
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-5 py-4 space-y-2">
                  <h3 className="font-semibold text-sm text-blue-400">Eligibility</h3>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li>• You must be registered on LuxDrop using referral code <strong className="text-primary">R2K2</strong>.</li>
                    <li>• Wagers must be placed within the leaderboard period: <strong className="text-foreground">{DISPLAY_RANGE}</strong>.</li>
                    <li>• Prizes are distributed at the end of the leaderboard period.</li>
                    <li>• R2K2 reserves the right to disqualify accounts suspected of abuse or multi-accounting.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <>
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
                  <h2 className="mb-8 text-center text-2xl font-bold">
                    <span className="neon-text text-primary">Top</span> Performers
                  </h2>

                  {/* Mobile: 1st full width, 2nd+3rd side by side */}
                  <div className="flex flex-col gap-3 md:hidden">
                    {entries[0] && (
                      <PodiumCard
                        rank={1}
                        size="md"
                        name={maskName(getEntryName(entries[0]))}
                        avatar={getAvatarUrl(getEntryAvatar(entries[0]))}
                        wagered={formatMoney(getEntryWagered(entries[0]))}
                        prize={prizeLabel(1)}
                        fallback="/assets/luxdrop-icon.png"
                      />
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {entries[1] && (
                        <PodiumCard
                          rank={2}
                          size="sm"
                          name={maskName(getEntryName(entries[1]))}
                          avatar={getAvatarUrl(getEntryAvatar(entries[1]))}
                          wagered={formatMoney(getEntryWagered(entries[1]))}
                          prize={prizeLabel(2)}
                          fallback="/assets/luxdrop-icon.png"
                        />
                      )}
                      {entries[2] && (
                        <PodiumCard
                          rank={3}
                          size="sm"
                          name={maskName(getEntryName(entries[2]))}
                          avatar={getAvatarUrl(getEntryAvatar(entries[2]))}
                          wagered={formatMoney(getEntryWagered(entries[2]))}
                          prize={prizeLabel(3)}
                          fallback="/assets/luxdrop-icon.png"
                        />
                      )}
                    </div>
                  </div>

                  {/* Desktop: 2nd | 1st | 3rd */}
                  <div className="hidden md:flex items-end justify-center gap-4">
                    {entries[1] && (
                      <div className="flex-1 max-w-[220px]">
                        <PodiumCard
                          rank={2}
                          size="md"
                          name={maskName(getEntryName(entries[1]))}
                          avatar={getAvatarUrl(getEntryAvatar(entries[1]))}
                          wagered={formatMoney(getEntryWagered(entries[1]))}
                          prize={prizeLabel(2)}
                          fallback="/assets/luxdrop-icon.png"
                        />
                      </div>
                    )}
                    {entries[0] && (
                      <div className="flex-1 max-w-[280px]">
                        <PodiumCard
                          rank={1}
                          size="lg"
                          name={maskName(getEntryName(entries[0]))}
                          avatar={getAvatarUrl(getEntryAvatar(entries[0]))}
                          wagered={formatMoney(getEntryWagered(entries[0]))}
                          prize={prizeLabel(1)}
                          fallback="/assets/luxdrop-icon.png"
                        />
                      </div>
                    )}
                    {entries[2] && (
                      <div className="flex-1 max-w-[220px]">
                        <PodiumCard
                          rank={3}
                          size="md"
                          name={maskName(getEntryName(entries[2]))}
                          avatar={getAvatarUrl(getEntryAvatar(entries[2]))}
                          wagered={formatMoney(getEntryWagered(entries[2]))}
                          prize={prizeLabel(3)}
                          fallback="/assets/luxdrop-icon.png"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                  <input
                    type="text"
                    placeholder="Search your exact username to see your wager amount..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-card/60 backdrop-blur-xl border border-border text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:shadow-[0_0_25px_-8px_rgba(80,120,255,0.6)] transition-all"
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
                                <img src={getAvatarUrl(getEntryAvatar(entry))} alt={getEntryName(entry)} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" onError={(e) => { (e.target as HTMLImageElement).src = '/assets/luxdrop-icon.png' }} />
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
                  <div className="overflow-hidden rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl">
                    <TableHeader />
                    <div className="divide-y divide-border/30">
                      {entries.slice(3).map((entry, idx) => (
                        <PlayerRow
                          key={getEntryId(entry)}
                          rank={idx + 4}
                          name={maskName(getEntryName(entry))}
                          avatar={getAvatarUrl(getEntryAvatar(entry))}
                          wagered={formatMoney(getEntryWagered(entry))}
                          prize={prizeLabel(idx + 4)}
                          fallback="/assets/luxdrop-icon.png"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
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
