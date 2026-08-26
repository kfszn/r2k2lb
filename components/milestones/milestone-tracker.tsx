'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { Loader2, LogIn, Link2, AlertTriangle, Trophy, Target } from 'lucide-react'
import { MilestoneTierRow, type MilestoneTier } from './milestone-tier-row'

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
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString('en-US')
}

function fmtDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function MilestoneTracker({ platform, sponsor, tiers, discordUrl }: MilestoneTrackerProps) {
  const { data, isLoading } = useSWR<Progress>(
    `/api/milestones/progress?platform=${platform}`,
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

  const resetDate = data?.window ? fmtDate(data.window.end) : null

  return (
    <div className="space-y-5">
      {/* ── Personal progress card ─────────────────────────────────────── */}
      <MilestoneStatusCard
        isLoading={isLoading}
        data={data}
        sponsor={sponsor}
        platform={platform}
        hasWager={hasWager}
        wagered={wagered}
        currentTier={currentTier}
        nextTier={nextTier}
        resetDate={resetDate}
      />

      {/* ── Tier table ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/50 bg-gradient-to-b from-card/70 to-card/30 overflow-hidden shadow-[0_0_50px_-24px_rgba(0,0,0,0.7)]">
        <div className="hidden items-center gap-4 px-5 py-3 border-b border-border/50 bg-muted/20 sm:flex">
          <div className="w-14 shrink-0" />
          <p className="w-28 shrink-0 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Tier</p>
          <p className="flex-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Wager Required</p>
          <p className="w-28 shrink-0 text-right text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Reward</p>
          <div className="shrink-0 ml-2 w-[130px]" />
        </div>
        <div className="flex items-center px-4 py-2.5 border-b border-border/50 bg-muted/20 sm:hidden">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Milestone Tiers</p>
        </div>

        {sorted.map((tier, i) => (
          <MilestoneTierRow
            key={tier.tier}
            tier={tier}
            discordUrl={discordUrl}
            isLast={i === sorted.length - 1}
            reached={hasWager ? wagered >= tier.wager : undefined}
          />
        ))}
      </div>
    </div>
  )
}

function MilestoneStatusCard({
  isLoading,
  data,
  sponsor,
  platform,
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
              {platform === 'acebet'
                ? 'Link your AceBet account to track your milestone progress automatically.'
                : `Link your ${sponsor} account in Discord to track your milestone progress automatically.`}
            </p>
          </div>
        </div>
        {platform === 'acebet' ? (
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

  return (
    <div className={base}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-400/30">
            <Target className="h-5 w-5 text-blue-300" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Your Progress</p>
            <p className="text-sm font-semibold text-foreground">
              Linked as <span className="text-blue-300">{data.username}</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Wagered This Cycle</p>
          <p className="text-2xl sm:text-3xl font-black tabular-nums text-emerald-400 leading-tight [text-shadow:0_0_22px_rgba(52,211,153,0.35)]">
            {fmt(wagered)}
          </p>
        </div>
      </div>

      {/* Current tier + progress bar */}
      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-semibold text-foreground">
            {currentTier ? (
              <>
                <Trophy className="h-3.5 w-3.5 text-yellow-300" />
                {currentTier.label} unlocked
              </>
            ) : (
              <span className="text-muted-foreground">No tier reached yet</span>
            )}
          </span>
          {nextTier ? (
            <span className="text-muted-foreground">
              {fmt(remaining)} to <span className="text-foreground font-semibold">{nextTier.label}</span>
            </span>
          ) : (
            <span className="text-emerald-400 font-semibold">Max tier reached</span>
          )}
        </div>

        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted/40">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 shadow-[0_0_16px_-2px_rgba(52,211,153,0.7)] transition-[width] duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {resetDate && (
        <p className="mt-4 text-xs text-muted-foreground">
          Progress resets with the {sponsor} leaderboard on{' '}
          <span className="text-foreground font-medium">{resetDate}</span>.
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
