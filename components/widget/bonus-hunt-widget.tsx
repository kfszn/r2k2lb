'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { AnimatedNumber } from '@/components/widget/animated-number'

interface WidgetEntry {
  position: number
  game: string
  imageUrl: string | null
  bet: number
  payout: number | null
  opened: boolean
}

interface WidgetData {
  hunt: { number: number; status: 'draft' | 'live' | 'ended' } | null
  stats?: {
    start: number
    winnings: number
    totalBonuses: number
    remaining: number
    runAverage: number | null
    requiredAverage: number | null
    best: { game: string; payout: number; bet: number } | null
    lucky: { game: string; multiplier: number; payout: number; bet: number } | null
    nextPosition: number | null
  }
  entries?: WidgetEntry[]
}

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then((res) => res.json() as Promise<WidgetData>)

const money = (value: number) =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const multiple = (value: number) => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}x`
const count = (value: number) => Math.round(value).toString()

function StatTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-lg border border-[var(--hunt-line)] bg-[var(--hunt-tile)] px-3 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--hunt-muted)]">{label}</span>
      <span className="truncate text-base font-bold text-[var(--hunt-text)]">{children}</span>
    </div>
  )
}

function Highlight({ label, game, main, sub }: { label: string; game: string | null; main: React.ReactNode; sub: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-lg border border-[var(--hunt-line)] bg-[var(--hunt-tile)] px-3 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--hunt-muted)]">{label}</span>
      {game ? (
        <>
          <span className="truncate text-sm font-semibold text-[var(--hunt-text)]">{game}</span>
          <span className="flex items-baseline justify-between gap-2">
            <span className="text-base font-bold text-[var(--hunt-gold)]">{main}</span>
            <span className="text-[11px] text-[var(--hunt-muted)]">{sub}</span>
          </span>
        </>
      ) : (
        <span className="text-sm text-[var(--hunt-muted)]">—</span>
      )}
    </div>
  )
}

function GameThumb({ game, imageUrl }: { game: string; imageUrl: string | null }) {
  const [failed, setFailed] = useState(false)

  useEffect(() => setFailed(false), [imageUrl])

  if (!imageUrl || failed) {
    return (
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[var(--hunt-line)] text-xs font-bold uppercase text-[var(--hunt-text)]"
      >
        {game.charAt(0)}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="size-8 shrink-0 rounded-md object-cover"
    />
  )
}

function EntryTable({ entries, nextPosition }: { entries: WidgetEntry[]; nextPosition: number | null }) {
  const scroller = useRef<HTMLDivElement>(null)

  // Long hunts auto-scroll: follow the next bonus while one is pending, otherwise sweep top to bottom.
  useEffect(() => {
    const el = scroller.current
    if (!el || el.scrollHeight <= el.clientHeight + 4) return

    if (nextPosition !== null) {
      const row = el.querySelector<HTMLElement>('[data-next="true"]')
      if (row) el.scrollTo({ top: Math.max(0, row.offsetTop - el.clientHeight / 3), behavior: 'smooth' })
      return
    }

    let atTop = false
    const timer = window.setInterval(() => {
      el.scrollTo({ top: atTop ? 0 : el.scrollHeight, behavior: 'smooth' })
      atTop = !atTop
    }, 5000)
    return () => window.clearInterval(timer)
  }, [nextPosition, entries.length])

  if (entries.length === 0) {
    return <p className="px-3 py-6 text-center text-sm text-[var(--hunt-muted)]">Waiting for the first bonus…</p>
  }

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[var(--hunt-line)] bg-[var(--hunt-tile)]">
      <div className="grid grid-cols-[2rem_1fr_5rem_6rem] gap-2 border-b border-[var(--hunt-line)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--hunt-muted)]">
        <span>#</span>
        <span>Game</span>
        <span className="text-right">Bet</span>
        <span className="text-right">Payout</span>
      </div>
      <div ref={scroller} className="relative max-h-[22rem] overflow-hidden">
        {entries.map((entry) => {
          const isNext = entry.position === nextPosition
          return (
            <div
              key={`${entry.position}-${entry.game}`}
              data-next={isNext ? 'true' : undefined}
              className={`grid grid-cols-[2rem_1fr_5rem_6rem] items-center gap-2 px-3 py-1.5 transition-colors duration-500 ${
                isNext ? 'bg-[var(--hunt-next)]' : ''
              }`}
            >
              <span className="text-xs font-semibold text-[var(--hunt-muted)]">{entry.position}</span>
              <span className="flex min-w-0 items-center gap-2">
                <GameThumb game={entry.game} imageUrl={entry.imageUrl} />
                <span
                  className={`truncate text-sm font-medium ${entry.opened ? 'text-[var(--hunt-muted)]' : 'text-[var(--hunt-text)]'}`}
                >
                  {entry.game}
                </span>
                {isNext && (
                  <span className="shrink-0 rounded bg-[var(--hunt-gold)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--hunt-surface)]">
                    Next
                  </span>
                )}
              </span>
              <span className="text-right text-xs tabular-nums text-[var(--hunt-muted)]">
                {entry.bet > 0 ? money(entry.bet) : '—'}
              </span>
              <span
                className={`text-right text-sm font-bold tabular-nums ${
                  entry.opened ? 'text-[var(--hunt-gold)]' : 'text-[var(--hunt-muted)]'
                }`}
              >
                {entry.opened && entry.payout !== null ? <AnimatedNumber value={entry.payout} format={money} /> : '—'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function BonusHuntWidget() {
  const { data } = useSWR('/api/widget/bonushunt', fetcher, {
    refreshInterval: 3000,
    refreshWhenHidden: true,
    revalidateOnFocus: false,
    keepPreviousData: true,
  })

  if (!data?.hunt || !data.stats) {
    return (
      <div className="hunt-widget w-full max-w-[30rem] rounded-xl border border-[var(--hunt-line)] bg-[var(--hunt-surface)] px-4 py-3 text-sm text-[var(--hunt-muted)]">
        {data ? 'No bonus hunt running yet.' : 'Loading bonus hunt…'}
      </div>
    )
  }

  const { hunt, stats, entries = [] } = data

  return (
    <div className="hunt-widget flex w-full max-w-[30rem] flex-col gap-2 rounded-xl border border-[var(--hunt-line)] bg-[var(--hunt-surface)] p-3 font-sans text-[var(--hunt-text)] shadow-2xl">
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-bold uppercase tracking-[0.2em]">Bonus Hunt</span>
        <span className="flex items-center gap-2 text-sm font-bold text-[var(--hunt-gold)]">
          #{hunt.number}
          {hunt.status === 'ended' && (
            <span className="rounded border border-[var(--hunt-line)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--hunt-muted)]">
              Ended
            </span>
          )}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Start">
          <AnimatedNumber value={stats.start} format={money} />
        </StatTile>
        <StatTile label="Winnings">
          <AnimatedNumber value={stats.winnings} format={money} />
        </StatTile>
        <StatTile label="Total Bonuses">
          <AnimatedNumber value={stats.totalBonuses} format={count} />
        </StatTile>
        <StatTile label="Remaining">
          <AnimatedNumber value={stats.remaining} format={count} />
        </StatTile>
        <StatTile label="Run Avg">
          <AnimatedNumber value={stats.runAverage} format={multiple} />
        </StatTile>
        <StatTile label="Required Avg">
          <AnimatedNumber value={stats.requiredAverage} format={multiple} />
        </StatTile>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Highlight
          label="Best Win"
          game={stats.best?.game ?? null}
          main={stats.best ? <AnimatedNumber value={stats.best.payout} format={money} /> : null}
          sub={stats.best && stats.best.bet > 0 ? `Bet ${money(stats.best.bet)}` : ''}
        />
        <Highlight
          label="Lucky Win"
          game={stats.lucky?.game ?? null}
          main={stats.lucky ? <AnimatedNumber value={stats.lucky.multiplier} format={multiple} /> : null}
          sub={stats.lucky ? `Bet ${money(stats.lucky.bet)}` : ''}
        />
      </div>

      <EntryTable entries={entries} nextPosition={stats.nextPosition} />
    </div>
  )
}
