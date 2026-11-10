'use client'

import { useState } from 'react'
import { Coins, Crosshair, HandCoins, Plus, TrendingDown, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreateHuntDialog } from '@/components/admin/bonus-hunt-create-dialog'
import { DEFAULT_CURRENCY, formatMoney, type Currency } from '@/lib/hunt/currency'
import type { CurrencyTotals, OverviewHighlight, OverviewHunt, OverviewPeriod } from '@/lib/hunt/stats'
import { useHuntOverview } from '@/lib/hunt/use-bonus-hunt'

const PERIODS: { value: OverviewPeriod; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '30d', label: 'Last 30 days' },
  { value: '7d', label: 'Last 7 days' },
]

const tone = (value: number) => (value < 0 ? 'text-destructive' : value > 0 ? 'text-emerald-400' : 'text-foreground')

interface StatLine {
  currency?: Currency
  text: string
  className?: string
}

// One line per currency in use, so mixed-currency hunts are never summed together.
function StatCard({ icon: Icon, label, lines }: { icon: typeof Coins; label: string; lines: StatLine[] }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col">
        {lines.length === 0 ? (
          <span className="text-xl font-bold text-foreground">—</span>
        ) : (
          lines.map((line) => (
            <span key={line.currency ?? line.text} className="flex items-baseline gap-2">
              <span className={`truncate font-bold tabular-nums ${lines.length > 1 ? 'text-base' : 'text-xl'} ${line.className ?? 'text-foreground'}`}>
                {line.text}
              </span>
              {lines.length > 1 && line.currency && <span className="text-xs text-muted-foreground">{line.currency}</span>}
            </span>
          ))
        )}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

function Thumb({ highlight }: { highlight: OverviewHighlight }) {
  return highlight.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={highlight.imageUrl} alt="" referrerPolicy="no-referrer" className="size-14 shrink-0 rounded-lg object-cover" />
  ) : (
    <span
      aria-hidden="true"
      className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted text-xl font-bold uppercase text-muted-foreground"
    >
      {highlight.game.charAt(0)}
    </span>
  )
}

function HighlightCard({ label, items }: { label: string; items: { highlight: OverviewHighlight; value: string }[] }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      {items.length === 0 ? (
        <span className="text-sm text-muted-foreground">No opened bonuses yet</span>
      ) : (
        items.map(({ highlight, value }) => (
          <div key={`${highlight.currency}-${highlight.game}`} className="flex items-center gap-4">
            <Thumb highlight={highlight} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-semibold text-foreground">{highlight.game}</span>
              <span className="text-sm text-muted-foreground">Hunt #{highlight.huntNumber}</span>
            </div>
            <span className="shrink-0 text-lg font-bold tabular-nums text-foreground">{value}</span>
          </div>
        ))
      )}
    </div>
  )
}

function ActivityRow({ hunt, onOpen }: { hunt: OverviewHunt; onOpen: (id: string) => void }) {
  const title = hunt.name ?? `Hunt #${hunt.number}`
  return (
    <tr
      className="cursor-pointer border-t border-border transition-colors hover:bg-muted/40 focus-within:bg-muted/40"
      onClick={() => onOpen(hunt.id)}
    >
      <td className="px-4 py-3">
        <button type="button" onClick={() => onOpen(hunt.id)} className="flex flex-col items-start text-left outline-none">
          <span className="flex items-center gap-2 font-medium text-foreground">
            {title}
            {hunt.status === 'live' && <Badge>Live</Badge>}
          </span>
          <span className="text-xs text-muted-foreground">
            #{hunt.number} · {new Date(hunt.date).toLocaleDateString('en-US')}
          </span>
        </button>
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-foreground">{formatMoney(hunt.startBalance, hunt.currency)}</td>
      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
        <span className="text-foreground">{hunt.opened}</span>
        {hunt.opened !== hunt.bonuses && <span>/{hunt.bonuses}</span>}
      </td>
      <td className="px-4 py-3 text-right tabular-nums">
        {hunt.pnl === null ? (
          <span className="text-muted-foreground">In progress</span>
        ) : (
          <div className={`flex flex-col ${tone(hunt.pnl)}`}>
            <span className="font-semibold">{formatMoney(hunt.pnl, hunt.currency, { signed: true })}</span>
            {hunt.pnlPercent !== null && (
              <span className="text-xs opacity-70">
                {hunt.pnlPercent > 0 ? '+' : ''}
                {hunt.pnlPercent.toFixed(1)}%
              </span>
            )}
          </div>
        )}
      </td>
    </tr>
  )
}

export function BonusHuntOverview({ onOpen }: { onOpen: (id: string) => void }) {
  const [period, setPeriod] = useState<OverviewPeriod>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const { data, error, isLoading, mutate } = useHuntOverview(period)

  const multi = (value: number) => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}x`
  const stats = data?.stats
  const totalLines = (pick: (t: CurrencyTotals) => number, colored = false, signed = false): StatLine[] =>
    (stats?.totals ?? []).map((t) => ({
      currency: t.currency,
      text: formatMoney(pick(t), t.currency, { signed }),
      className: colored ? tone(pick(t)) : undefined,
    }))

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="hunt-stats-title" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="hunt-stats-title" className="text-2xl font-semibold text-foreground">
            Statistics
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={period} onValueChange={(value) => setPeriod(value as OverviewPeriod)}>
              <SelectTrigger className="w-40" aria-label="Time period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && !data ? (
          <p role="alert" className="text-sm text-destructive">
            Could not load hunt statistics.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={Crosshair} label="Bonus Hunts" lines={stats ? [{ text: String(stats.huntCount) }] : []} />
              <StatCard icon={Coins} label="Total Cost" lines={totalLines((t) => t.totalCost)} />
              <StatCard icon={HandCoins} label="Winnings" lines={totalLines((t) => t.winnings)} />
              <StatCard
                icon={stats && stats.totals.some((t) => t.pnl < 0) ? TrendingDown : TrendingUp}
                label="PnL"
                lines={totalLines((t) => t.pnl, true, true)}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <HighlightCard
                label="Highest Win"
                items={(stats?.highestWins ?? []).map((h) => ({ highlight: h, value: formatMoney(h.value, h.currency) }))}
              />
              <HighlightCard
                label="Highest Multi"
                items={stats?.highestMulti ? [{ highlight: stats.highestMulti, value: multi(stats.highestMulti.value) }] : []}
              />
              <HighlightCard
                label="Lowest Multi"
                items={stats?.lowestMulti ? [{ highlight: stats.lowestMulti, value: multi(stats.lowestMulti.value) }] : []}
              />
            </div>
          </>
        )}
      </section>

      <section aria-labelledby="hunt-activity-title" className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id="hunt-activity-title" className="text-2xl font-semibold text-foreground">
            Activity
          </h2>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 size-4" aria-hidden="true" />
            Create Hunt
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-4 py-3 text-left font-medium">Hunt</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Start cost</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Bonuses</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Profit / loss</th>
              </tr>
            </thead>
            <tbody>
              {data?.hunts.map((hunt) => (
                <ActivityRow key={hunt.id} hunt={hunt} onOpen={onOpen} />
              ))}
            </tbody>
          </table>
          {data && data.hunts.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No hunts for this period yet. Create one to get started.
            </p>
          )}
          {isLoading && !data && <p className="px-4 py-10 text-center text-sm text-muted-foreground">Loading hunts…</p>}
        </div>
      </section>

      <CreateHuntDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultCurrency={DEFAULT_CURRENCY}
        onCreated={async (hunt) => {
          await mutate()
          onOpen(hunt.id)
        }}
      />
    </div>
  )
}
