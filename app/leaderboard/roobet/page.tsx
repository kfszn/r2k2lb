'use client'

import { useEffect, useState } from 'react'
import { Trophy, Clock, TrendingUp, Users, Search, BookOpen, ChevronDown } from 'lucide-react'
import { GoalTracker } from '@/components/goal-tracker'
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
// Config — rolling 7-day periods, must match app/api/cron/roobet-weekly-archive
// ---------------------------------------------------------------------------
const PERIOD_ANCHOR = '2026-08-28'
const PERIOD_DAYS = 7
const PRIZE_TOTAL = 5000
const REWARDS: number[] = [2000, 1000, 600, 400, 300, 250, 200, 150, 75, 25]

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatDisplay(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00Z')
  const e = new Date(end + 'T00:00:00Z')
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  return `${fmt(s)} – ${fmt(e)}, ${e.getUTCFullYear()}`
}

// Compute the current (in-progress) 7-day period from the anchor date
function currentPeriod(): { start: string; end: string } {
  const today = new Date().toISOString().slice(0, 10)
  let start = PERIOD_ANCHOR
  let end = addDays(start, PERIOD_DAYS - 1)
  while (addDays(end, 1) <= today) {
    start = addDays(end, 1)
    end = addDays(start, PERIOD_DAYS - 1)
  }
  return { start, end }
}

const CURRENT = currentPeriod()
const CURRENT_START = CURRENT.start
const CURRENT_END = CURRENT.end
const CURRENT_DISPLAY = formatDisplay(CURRENT_START, CURRENT_END)

// ---------------------------------------------------------------------------
// Types — normalize whatever shape the Roobet API returns
// ---------------------------------------------------------------------------
interface RoobetEntry {
  userId?: number | string
  id?: number | string
  username?: string
  name?: string
  avatar?: string | null
  wagered?: number
  weightedWagered?: number
  wagerAmount?: number
  totalWagered?: number
}

interface ArchivedPeriod {
  id: string
  label: string
  start_date: string
  end_date: string
  prize_total: number
  rewards: number[]
  entries: RoobetEntry[]
}

function normalizeEntries(raw: unknown): RoobetEntry[] {
  if (Array.isArray(raw)) return raw as RoobetEntry[]
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    for (const key of ['data', 'affiliates', 'results', 'leaderboard', 'entries']) {
      if (Array.isArray(obj[key])) return obj[key] as RoobetEntry[]
    }
  }
  return []
}

function getEntryId(e: RoobetEntry): string {
  return String(e.userId ?? e.id ?? Math.random())
}
function getEntryName(e: RoobetEntry): string {
  return e.username ?? e.name ?? 'Unknown'
}
function getEntryWagered(e: RoobetEntry): number {
  const weighted = Number(e.weightedWagered)
  if (Number.isFinite(weighted)) return weighted
  return Number(e.wagered ?? e.wagerAmount ?? e.totalWagered ?? 0) || 0
}

function sortByWeightedWager(entries: RoobetEntry[]): RoobetEntry[] {
  return [...entries].sort((a, b) => getEntryWagered(b) - getEntryWagered(a))
}
function getEntryAvatar(e: RoobetEntry): string | null {
  return e.avatar ?? null
}

export default function RoobetLeaderboard() {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'rules'>('leaderboard')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [entries, setEntries] = useState<RoobetEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [archivedPeriods, setArchivedPeriods] = useState<ArchivedPeriod[]>([])

  const showPrevious = selectedPeriod !== 'current'
  const activePeriodConfig = archivedPeriods.find(p => p.label === selectedPeriod) ?? null

  const activeStart = showPrevious ? (activePeriodConfig?.start_date ?? CURRENT_START) : CURRENT_START
  const activeEnd = showPrevious ? (activePeriodConfig?.end_date ?? CURRENT_END) : CURRENT_END
  const activeDisplay = showPrevious
    ? formatDisplay(activePeriodConfig?.start_date ?? CURRENT_START, activePeriodConfig?.end_date ?? CURRENT_END)
    : CURRENT_DISPLAY
  const activeRewards = showPrevious ? (activePeriodConfig?.rewards ?? []) : REWARDS
  const activeTotal = showPrevious ? (activePeriodConfig?.prize_total ?? 0) : PRIZE_TOTAL

  // ---------------------------------------------------------------------------
  // Fetch archived periods once
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetch('/api/roobet/archive', { cache: 'no-store' })
      .then(res => res.json())
      .then(json => setArchivedPeriods(json.periods ?? []))
      .catch(() => setArchivedPeriods([]))
  }, [])

  // ---------------------------------------------------------------------------
  // Fetch leaderboard entries (live for current, snapshot for archived)
  // ---------------------------------------------------------------------------
  const loadLeaderboard = async (period: string) => {
    setLoading(true)
    setError(null)
    setSearchQuery('')
    try {
      if (period !== 'current') {
        const found = archivedPeriods.find(p => p.label === period)
        setEntries(sortByWeightedWager(normalizeEntries(found?.entries ?? [])))
        return
      }

      const res = await fetch(
        `/api/roobet/affiliates?startDate=${CURRENT_START}&endDate=${CURRENT_END}`,
        { cache: 'no-store' }
      )
      const json = await res.json()
      if (!res.ok) {
        setError(`${json.error ?? 'Failed to load leaderboard'}${json.detail ? ` — ${json.detail}` : ''}`)
        return
      }
      setEntries(sortByWeightedWager(normalizeEntries(json)))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to fetch leaderboard — ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeaderboard('current')
  }, [])

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = () => setDropdownOpen(false)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [dropdownOpen])

  // ---------------------------------------------------------------------------
  // Countdown timer
  // ---------------------------------------------------------------------------
  const computeTimeRemaining = (period: string) => {
    if (period !== 'current') return 'Ended'
    const end = new Date(CURRENT_END + 'T23:59:59Z').getTime()
    const diff = end - Date.now()
    if (diff <= 0) return 'Ended'
    const days = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
    if (minutes > 0) return `${minutes}m ${seconds}s`
    return `${seconds}s`
  }

  useEffect(() => {
    setTimeRemaining(computeTimeRemaining(selectedPeriod))
    const interval = setInterval(() => setTimeRemaining(computeTimeRemaining(selectedPeriod)), 1000)
    return () => clearInterval(interval)
  }, [selectedPeriod])

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
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
    if (!avatar) return '/assets/roobet-icon.png'
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar.split('#')[0]
    }
    return '/assets/roobet-icon.png'
  }

  const totalWagered = entries.reduce((sum, e) => sum + getEntryWagered(e), 0)

  const prizeLabel = (rank: number): string => {
    if (activeRewards[rank - 1] != null && activeRewards[rank - 1] > 0) {
      return `$${activeRewards[rank - 1].toLocaleString()}`
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
              src="/assets/roobet.png"
              alt="Roobet"
              className="h-12 md:h-14 w-auto mx-auto object-contain animate-fade-in-up animation-delay-100 drop-shadow-[0_0_25px_rgba(0,231,1,0.35)]"
            />
            <div className="flex justify-center animate-fade-in-up animation-delay-200">
              <PrizePool total={`$${activeTotal.toLocaleString()}`} />
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight text-balance animate-fade-in-up animation-delay-200 tracking-tight">
              Weekly <span className="neon-text text-primary">Leaderboard</span>
            </h1>
            <div className="flex justify-center">
              <a
                href="https://roobet.com/?ref=R2K2"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold shadow-[0_0_30px_-8px_rgba(0,231,1,0.7)] hover:shadow-[0_0_40px_-6px_rgba(0,231,1,0.9)]"
              >
                <Trophy className="h-4 w-4" />
                Sign up on Roobet
              </a>
            </div>
            <p className="text-lg text-muted-foreground text-pretty">
              Every <strong>wager</strong> on Roobet under Code{' '}
              <strong className="text-primary">R2K2</strong> counts towards your score.
              <br />
              <em className="text-sm">{activeDisplay}</em>
            </p>

            <div className="flex flex-wrap justify-center gap-2 text-sm font-semibold">
              {activeRewards.slice(0, 5).map((amt, i) => {
                const ordinals = ['1st', '2nd', '3rd', '4th', '5th']
                const colors = [
                  'bg-yellow-400/20 border-yellow-400/40 text-yellow-400',
                  'bg-slate-400/20 border-slate-400/40 text-slate-300',
                  'bg-amber-700/20 border-amber-700/40 text-amber-500',
                  'bg-primary/20 border-primary/40 text-primary',
                  'bg-green-600/20 border-green-600/40 text-green-500',
                ]
                return (
                  <span key={ordinals[i]} className={`px-3 py-1 rounded-full border ${colors[i]}`}>
                    {ordinals[i]} — ${amt.toLocaleString()}
                  </span>
                )
              })}
              {activeRewards.length > 5 && (
                <span className="px-3 py-1 rounded-full border bg-muted/30 border-border text-muted-foreground">
                  +{activeRewards.length - 5} more positions paid
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats cards */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-4xl mx-auto">
          <StatCard
            label="Total Weighted Wager"
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
          {!showPrevious && (
            <StatCard
              label="Time Remaining"
              value={<span suppressHydrationWarning>{timeRemaining || '...'}</span>}
              icon={<Clock className="h-5 w-5" />}
              tone="destructive"
              className="col-span-2 md:col-span-1"
            />
          )}
        </div>
      </section>

      {/* Current / Previous controls */}
      <section className="py-6 border-b border-border/40">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center items-center">
            <button
              onClick={() => { setSelectedPeriod('current'); loadLeaderboard('current') }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                !showPrevious ? 'bg-primary text-primary-foreground' : 'border border-border bg-transparent hover:bg-muted/40'
              }`}
            >
              Current Leaderboard
            </button>

            <div className="relative">
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  showPrevious ? 'bg-primary text-primary-foreground' : 'border border-border bg-transparent hover:bg-muted/40'
                }`}
                onClick={(e) => { e.stopPropagation(); setDropdownOpen(o => !o) }}
              >
                {showPrevious ? selectedPeriod : 'Previous Weeks'}
                <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute top-full mt-1 left-0 z-50 min-w-[220px] max-h-80 overflow-y-auto rounded-xl border border-border bg-card/90 backdrop-blur-xl shadow-2xl">
                  {archivedPeriods.length === 0 && (
                    <p className="px-4 py-3 text-sm text-muted-foreground">No archived weeks yet</p>
                  )}
                  {archivedPeriods.map(p => (
                    <button
                      key={p.id}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-muted/60 transition-colors ${selectedPeriod === p.label ? 'bg-primary/10' : ''}`}
                      onClick={() => {
                        setSelectedPeriod(p.label)
                        setDropdownOpen(false)
                        loadLeaderboard(p.label)
                      }}
                    >
                      <p className={`font-semibold ${selectedPeriod === p.label ? 'text-primary' : 'text-foreground'}`}>{p.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDisplay(p.start_date, p.end_date)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tab Nav */}
      <section className="container mx-auto px-4 pb-2 pt-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex gap-1 p-1 rounded-xl bg-card/60 border border-border/40 w-fit backdrop-blur-xl">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-primary text-primary-foreground shadow-[0_0_20px_-4px_rgba(0,231,1,0.7)]'
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
                  ? 'bg-primary text-primary-foreground shadow-[0_0_20px_-4px_rgba(0,231,1,0.7)]'
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
                <div className="rounded-2xl border border-primary/20 bg-card/60 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Leaderboard Rules</h2>
                      <p className="text-sm text-muted-foreground">{activeDisplay}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The Roobet leaderboard tracks your wagering activity on{' '}
                    <a href="https://roobet.com/?ref=R2K2" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">roobet.com</a>{' '}
                    using code <strong className="text-primary">R2K2</strong>, over a rolling 7-day period. Each week resets automatically and is archived once it ends.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/50 overflow-hidden">
                  <div className="px-5 py-4 bg-muted/40 border-b border-border/50">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Prize Breakdown — ${activeTotal.toLocaleString()} Pool</h3>
                  </div>
                  <div className="divide-y divide-border/30">
                    {activeRewards.map((amt, i) => {
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

                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-5 py-4 space-y-2">
                  <h3 className="font-semibold text-sm text-blue-400">Eligibility</h3>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li>• You must be registered on Roobet using referral code <strong className="text-primary">R2K2</strong>.</li>
                    <li>• Wagers must be placed within the leaderboard period: <strong className="text-foreground">{activeDisplay}</strong>.</li>
                    <li>• Prizes are distributed at the end of each weekly period.</li>
                    <li>• R2K2 reserves the right to disqualify accounts suspected of abuse or multi-accounting.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <>
                {loading && (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                    <p className="mt-4 text-muted-foreground">Loading leaderboard...</p>
                  </div>
                )}

                {error && (
                  <div className="text-center py-12 bg-destructive/10 rounded-lg border border-destructive/30 p-6">
                    <p className="text-destructive text-lg font-semibold mb-2">Error Loading Leaderboard</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                )}

                {!loading && !error && entries.length === 0 && (
                  <div className="text-center py-16 bg-muted/30 rounded-2xl border border-border p-8">
                    <Trophy className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">No entries yet</h2>
                    <p className="text-muted-foreground text-pretty">
                      {showPrevious ? (
                        <>No recorded entries for this period.</>
                      ) : (
                        <>
                          The leaderboard is live — sign up on Roobet with code{' '}
                          <strong className="text-primary">R2K2</strong> and start wagering to claim your spot.
                        </>
                      )}
                    </p>
                    {!showPrevious && (
                      <a
                        href="https://roobet.com/?ref=R2K2"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex mt-4 items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold text-sm"
                      >
                        Join Roobet with R2K2
                      </a>
                    )}
                  </div>
                )}

                {!loading && !error && entries.length > 0 && (
                  <>
                    <div className="mb-10">
                      <h2 className="mb-8 text-center text-2xl font-bold">
                        <span className="neon-text text-primary">Top</span> Performers
                      </h2>

                      <div className="flex flex-col gap-3 md:hidden">
                        {entries[0] && (
                          <PodiumCard
                            rank={1}
                            size="md"
                            name={maskName(getEntryName(entries[0]))}
                            avatar={getAvatarUrl(getEntryAvatar(entries[0]))}
                            wagered={formatMoney(getEntryWagered(entries[0]))}
                            prize={prizeLabel(1)}
                            fallback="/assets/roobet-icon.png"
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
                              fallback="/assets/roobet-icon.png"
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
                              fallback="/assets/roobet-icon.png"
                            />
                          )}
                        </div>
                      </div>

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
                              fallback="/assets/roobet-icon.png"
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
                              fallback="/assets/roobet-icon.png"
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
                              fallback="/assets/roobet-icon.png"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                      <input
                        type="text"
                        placeholder="Search your exact username to see your wager amount..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-card/60 backdrop-blur-xl border border-border text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:shadow-[0_0_25px_-8px_rgba(0,231,1,0.6)] transition-all"
                      />
                    </div>

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
                                    <img src={getAvatarUrl(getEntryAvatar(entry))} alt={getEntryName(entry)} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" onError={(e) => { (e.target as HTMLImageElement).src = '/assets/roobet-icon.png' }} />
                                  </div>
                                  <span className="font-semibold text-sm text-foreground">{maskName(getEntryName(entry))}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Weighted Wager</p>
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
                              fallback="/assets/roobet-icon.png"
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
