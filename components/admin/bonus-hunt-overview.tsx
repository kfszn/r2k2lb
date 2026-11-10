'use client'

import { useState } from 'react'
import { Coins, Crosshair, HandCoins, Plus, TrendingDown, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreateHuntDialog } from '@/components/admin/bonus-hunt-create-dialog'
import { CURRENCIES, formatMoney, type Currency } from '@/lib/hunt/currency'
import type { OverviewHighlight, OverviewHunt, OverviewPeriod } from '@/lib/hunt/stats'
import { useHuntOverview } from '@/lib/hunt/use-bonus-hunt'

const PERIODS: { value: OverviewPeriod; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '30d', label: 'Last 30 days' },
  { value: '7d', label: 'Last 7 days' },
]

const tone = (value: number) => (value < 0 ? 'text-destructive' : value > 0 ? 'text-emerald-400' : 'text-foreground')

function StatCard({ icon: Icon, label, value, valueClass }: { icon: typeof Coins; label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className={`truncate text-xl font-bold tabular-nums ${valueClass ?? 'text-foreground'}`}>{value}</span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

function HighlightCard({ label, highlight, format }: { label: string; highlight: OverviewHighlight | null; format: (v: number) => string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
      {highlight?.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={highlight.imageUrl} alt="" referrerPolicy="no-referrer" className="size-16 shrink-0 rounded-lg object-cover" />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-muted text-xl font-bold uppercase text-muted-foreground"
        >
          {highlight?.game.charAt(0) ?? '–'}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm text-muted-foreground">{label}</span>
        {highlight ? (
          <>
            <span className="truncate font-semibold text-foreground">{highlight.game}</span>
            <span className="text-sm text-muted-foreground">Hunt #{highlight.huntNumber}</span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">No opened bonuses yet</span>
        )}
      </div>
      {highlight && <span className="shrink-0 text-lg font-bold tabular-nums text-foreground">{format(highlight.value)}</span>}
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
  const [currency, setCurrency] = useState<Currency>('CAD')
  const [period, setPeriod] = useState<OverviewPeriod>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const { data, error, isLoading, mutate } = useHuntOverview(currency, period)

  const money = (value: number) => formatMoney(value, currency)
  const multi = (value: number) => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}x`
  const stats = data?.stats

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="hunt-stats-title" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="hunt-stats-title" className="text-2xl font-semibold text-foreground">
            Statistics
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
              <TabsList aria-label="Currency">
                {CURRENCIES.map((code) => (
                  <TabsTrigger key={code} value={code}>
                    {code}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
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
              <StatCard icon={Crosshair} label="Bonus Hunts" value={stats ? String(stats.huntCount) : '—'} />
              <StatCard icon={Coins} label="Total Cost" value={stats ? money(stats.totalCost) : '—'} />
              <StatCard icon={HandCoins} label="Winnings" value={stats ? money(stats.winnings) : '—'} />
              <StatCard
                icon={stats && stats.pnl < 0 ? TrendingDown : TrendingUp}
                label="PnL"
                value={stats ? formatMoney(stats.pnl, currency, { signed: true }) : '—'}
                valueClass={stats ? tone(stats.pnl) : undefined}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <HighlightCard label="Highest Win" highlight={stats?.highestWin ?? null} format={money} />
              <HighlightCard label="Highest Multi" highlight={stats?.highestMulti ?? null} format={multi} />
              <HighlightCard label="Lowest Multi" highlight={stats?.lowestMulti ?? null} format={multi} />
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
              No {currency} hunts for this period yet. Create one to get started.
            </p>
          )}
          {isLoading && !data && <p className="px-4 py-10 text-center text-sm text-muted-foreground">Loading hunts…</p>}
        </div>
      </section>

      <CreateHuntDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultCurrency={currency}
        onCreated={async (hunt) => {
          setCurrency(hunt.currency)
          await mutate()
          onOpen(hunt.id)
        }}
      />
    </div>
  )
}
