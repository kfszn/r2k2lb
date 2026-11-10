import { moneyFormatter, type Currency } from '@/lib/hunt/currency'
import type { HuntStats } from '@/lib/hunt/stats'

const multiple = (value: number | null) => (value === null ? '—' : `${value.toFixed(2)}x`)

export function BonusHuntFormulas({ stats, currency }: { stats: HuntStats; currency: Currency }) {
  const money = moneyFormatter(currency)
  const rows = [
    {
      label: 'Winnings',
      rule: 'Sum of payouts on opened bonuses',
      live: `${money(stats.winnings)} from ${stats.openedCount} opened`,
    },
    {
      label: 'Run Average',
      rule: 'Winnings ÷ total bet size of opened bonuses',
      live: `${money(stats.winnings)} ÷ ${money(stats.totalBetOpened)} = ${multiple(stats.runAverage)}`,
    },
    {
      label: 'Required Average',
      rule: 'Start balance ÷ total bet size of all bonuses',
      live: `${money(stats.start)} ÷ ${money(stats.totalBetAll)} = ${multiple(stats.requiredAverage)}`,
    },
    {
      label: 'Remaining',
      rule: 'Bonuses not yet opened',
      live: `${stats.totalBonuses} total − ${stats.openedCount} opened = ${stats.remaining}`,
    },
    {
      label: 'Best Win',
      rule: 'Largest payout among opened bonuses',
      live: stats.best ? `${stats.best.game}: ${money(stats.best.payout)}` : '—',
    },
    {
      label: 'Lucky Win',
      rule: 'Highest payout ÷ bet multiplier among opened bonuses',
      live: stats.lucky ? `${stats.lucky.game}: ${multiple(stats.lucky.multiplier)}` : '—',
    },
  ]

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-0.5 rounded-lg border border-border bg-muted/30 p-3">
          <dt className="text-sm font-semibold text-foreground">{row.label}</dt>
          <dd className="text-xs text-muted-foreground">{row.rule}</dd>
          <dd className="text-sm tabular-nums text-foreground">{row.live}</dd>
        </div>
      ))}
    </dl>
  )
}
