'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { Loader2, LogIn, Link2, AlertTriangle, Lock, TrendingUp } from 'lucide-react'
import type { MilestoneTier } from './milestone-tier-row'
import { MilestoneTierCard, compact } from './milestone-tier-card'
import { getCurrentRoobetRewardsGroupLabel } from '@/lib/roobet/period'

type Progress = {
  authenticated: boolean
  linked: boolean
  username?: string
  wagered?: number | null
  apiError?: boolean
  notFound?: boolean
  window: { start: string; end: string }
}

interface MilestoneTrackerProps {
  platform: 'acebet' | 'luxdrop' | 'roobet'
  sponsor: string
  tiers: MilestoneTier[]
  discordUrl: string
  /** "leaderboard" (default) resets weekly with the leaderboard; "rewards" is
   *  Roobet's independent 30-day Wager Rewards cycle. */
  cycle?: 'leaderboard' | 'rewards'
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString('en-US')
}

function fmtDate(value: string | null | undefined) {
  if (!value) return null
  // Date-only values ("2026-11-30") are calendar days; full timestamps are
  // period cutovers, which happen at 6 PM ET.
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  const d = new Date(isDateOnly ? `${value}T00:00:00Z` : value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: isDateOnly ? 'UTC' : 'America/New_York',
  })
}

export function MilestoneTracker({ platform, sponsor, tiers, discordUrl, cycle = 'leaderboard' }: MilestoneTrackerProps) {
  const { data, isLoading } = useSWR<Progress>(
    `/api/milestones/progress?platform=${platform}&cycle=${cycle}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  // Whether we have a real wager number to drive per-tier unlocked state.
  const hasWager =
    !!data?.authenticated && !!data?.linked && !data?.apiError && typeof data?.wagered === 'number'
  const wagered = hasWager ? (data!.wagered as number) : 0

  const sorted = [...tiers].sort((a, b) => a.wager - b.wager)
  const reachedTiers = sorted.filter((t) => wagered >= t.wager)
  const currentTier = reachedTiers[reachedTiers.length - 1] ?? null
  const nextTier = sorted.find((t) => wagered < t.wager) ?? null

  const resetDate = fmtDate(data?.window?.end)

  return (
    <div className="space-y-5">
      {/* ── Personal progress card ─────────────────────────────────────── */}
      <MilestoneStatusCard
        isLoading={isLoading}
        data={data}
        sponsor={sponsor}
        platform={platform}
        cycle={cycle}
        hasWager={hasWager}
        wagered={wagered}
        currentTier={currentTier}
        nextTier={nextTier}
        resetDate={resetDate}
      />

      <section aria-labelledby="milestone-tiers-heading" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2
            id="milestone-tiers-heading"
            className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Milestone Tiers
          </h2>
          <p className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
            {hasWager ? (
              `${reachedTiers.length} of ${sorted.length} reached`
            ) : (
              <>
                <Lock className="h-3 w-3" aria-hidden="true" />
                Sign in &amp; link to track
              </>
            )}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
          {sorted.map((tier) => (
            <MilestoneTierCard
              key={tier.tier}
              tier={tier}
              wagered={wagered}
              discordUrl={discordUrl}
              tracking={hasWager}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function MilestoneStatusCard({
  isLoading,
  data,
  sponsor,
  platform,
  cycle,
  hasWager,
  wagered,
  currentTier,
  nextTier,
  resetDate,
}: {
  isLoading: boolean
  data: Progress | undefined
  sponsor: string
  platform: string
  cycle: 'leaderboard' | 'rewards'
  hasWager: boolean
  wagered: number
  currentTier: MilestoneTier | null
  nextTier: MilestoneTier | null
  resetDate: string | null
}) {
  const base =
    'rounded-2xl border border-border/50 bg-gradient-to-b from-card/70 to-card/30 p-5 sm:p-6 shadow-[0_0_50px_-24px_rgba(0,0,0,0.7)]'

  // Loading
  if (isLoading || !data) {
    return (
      <div className={`${base} flex items-center gap-3 text-sm text-muted-foreground`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your progress…
      </div>
    )
  }

  // Signed out
  if (!data.authenticated) {
    return (
      <div className={`${base} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-400/30">
            <LogIn className="h-5 w-5 text-blue-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Track your progress</p>
            <p className="text-sm text-muted-foreground">Sign in to see your live {sponsor} wager progress.</p>
          </div>
        </div>
        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_20px_-6px_rgba(96,165,250,0.7)] transition-all hover:from-blue-300 hover:to-blue-500 active:scale-95"
        >
          <LogIn className="h-3.5 w-3.5" strokeWidth={2.5} />
          Sign In
        </Link>
      </div>
    )
  }

  // Signed in but no linked account
  if (!data.linked) {
    return (
      <div className={`${base} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/40 ring-1 ring-border/50">
            <Link2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">No {sponsor} account linked</p>
            <p className="text-sm text-muted-foreground">
              {platform === 'acebet' || platform === 'roobet'
                ? `Link your ${sponsor} account to track your milestone progress automatically.`
                : `Link your ${sponsor} account in Discord to track your milestone progress automatically.`}
            </p>
          </div>
        </div>
        {platform === 'acebet' || platform === 'roobet' ? (
          <Link
            href="/account"
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-foreground transition-all hover:bg-muted/50 active:scale-95"
          >
            <Link2 className="h-3.5 w-3.5" strokeWidth={2.5} />
            Link Account
          </Link>
        ) : (
          <a
            href={discordUrlFromWindow()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-foreground transition-all hover:bg-muted/50 active:scale-95"
          >
            <Link2 className="h-3.5 w-3.5" strokeWidth={2.5} />
            Link in Discord
          </a>
        )}
      </div>
    )
  }

  // Linked, but live API failed
  if (data.apiError) {
    return (
      <div className={`${base} flex items-start gap-3`}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-400/30">
          <AlertTriangle className="h-5 w-5 text-amber-300" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Linked as <span className="text-blue-300">{data.username}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t reach {sponsor} right now. Your live wager progress will appear shortly — try refreshing.
          </p>
        </div>
      </div>
    )
  }

  // Linked and progress available
  const pct = nextTier
    ? Math.min(100, Math.max(0, (wagered / nextTier.wager) * 100))
    : 100
  const remaining = nextTier ? Math.max(0, nextTier.wager - wagered) : 0
  const cycleStart = fmtDate(data.window?.start)
  const cycleEnd = fmtDate(data.window?.end)
  const cycleLabel =
    cycleStart && cycleEnd
      ? `${cycleStart.replace(/, \d{4}$/, '')} – ${cycleEnd.replace(/, \d{4}$/, '')}`
      : null

  return (
    <div className={base}>
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-400/30">
          <TrendingUp className="h-5 w-5 text-blue-300" aria-hidden="true" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            @{data.username}
            {cycleLabel ? ` · ${cycleLabel}` : ''}
          </p>
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-3xl font-black leading-none tabular-nums text-foreground sm:text-4xl">
              {fmt(wagered)}
            </span>
            <span className="text-sm text-muted-foreground">wagered this cycle</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {nextTier ? (
              <>
                Next: <span className="font-semibold text-blue-300">{fmt(nextTier.wager)}</span> —{' '}
                {compact(remaining)} to go
              </>
            ) : (
              <span className="font-semibold text-emerald-400">All milestones reached</span>
            )}
          </p>
        </div>
      </div>

      <div
        className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted/40"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label="Progress to next milestone"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-[width] duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      {resetDate && (
        <p className="mt-4 text-xs text-muted-foreground">
          {cycle === 'rewards' ? (
            <>
              Progress resets after the{' '}
              <span className="text-foreground font-medium">
                {getCurrentRoobetRewardsGroupLabel()} IV
              </span>{' '}
              leaderboard — unclaimed wager beyond your last claim does not carry over.
            </>
          ) : (
            <>
              Progress resets with the {sponsor} leaderboard on{' '}
              <span className="text-foreground font-medium">{resetDate}</span>.
            </>
          )}
        </p>
      )}
    </div>
  )
}

// The Discord invite is passed to rows; the status card's "Link in Discord"
// falls back to the shared community invite.
function discordUrlFromWindow() {
  return 'https://discord.gg/RsjSPzGKTR'
}
