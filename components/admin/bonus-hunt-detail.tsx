'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { BonusHuntEntries } from '@/components/admin/bonus-hunt-entries'
import { BonusHuntFormulas } from '@/components/admin/bonus-hunt-formulas'
import { CURRENCIES, formatMoney, type Currency } from '@/lib/hunt/currency'
import { huntRequest, useBonusHunt } from '@/lib/hunt/use-bonus-hunt'

const HUNT_URL = '/api/admin/bonus-hunt'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-base font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  )
}

export function BonusHuntDetail({ huntId, onBack }: { huntId: string; onBack: () => void }) {
  const { data, error, isLoading, mutate } = useBonusHunt(huntId)
  const [actionError, setActionError] = useState<string | null>(null)
  const [balanceDraft, setBalanceDraft] = useState<string | null>(null)
  const [nameDraft, setNameDraft] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<'end' | 'delete' | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(body: Record<string, unknown>) {
    setBusy(true)
    const result = await huntRequest('POST', HUNT_URL, { huntId, ...body })
    setBusy(false)
    setActionError(result.ok ? null : (result.error ?? 'Something went wrong.'))
    await mutate()
    return result.ok
  }

  if (isLoading && !data) return <p className="text-sm text-muted-foreground">Loading hunt…</p>
  const { hunt, entries, stats } = data ?? {}
  if (!hunt || !stats || !entries) {
    return (
      <div className="flex flex-col gap-3">
        <Button variant="ghost" onClick={onBack} className="self-start">
          <ArrowLeft className="mr-1 size-4" aria-hidden="true" />
          All hunts
        </Button>
        <p role="alert" className="text-sm text-destructive">
          {error?.message ?? 'This hunt could not be found.'}
        </p>
      </div>
    )
  }

  const live = hunt.status === 'live'
  const money = (value: number) => formatMoney(value, hunt.currency)

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" onClick={onBack} className="self-start">
        <ArrowLeft className="mr-1 size-4" aria-hidden="true" />
        All hunts
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <CardTitle>{hunt.name ?? `Hunt #${hunt.number}`}</CardTitle>
            <CardDescription>
              Hunt #{hunt.number} · {hunt.currency}
            </CardDescription>
          </div>
          <Badge variant={live ? 'default' : 'secondary'}>{live ? 'Live' : 'Ended'}</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {(actionError || error) && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-foreground">
              {actionError ?? error?.message}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hunt-name">Name</Label>
              <Input
                id="hunt-name"
                value={nameDraft ?? hunt.name ?? ''}
                maxLength={60}
                placeholder={`Hunt #${hunt.number}`}
                onChange={(event) => setNameDraft(event.target.value)}
                onBlur={async () => {
                  if (nameDraft !== null && nameDraft !== (hunt.name ?? '')) await run({ action: 'details', name: nameDraft })
                  setNameDraft(null)
                }}
                onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hunt-currency">Currency</Label>
              <Select value={hunt.currency} onValueChange={(currency) => void run({ action: 'details', currency: currency as Currency })}>
                <SelectTrigger id="hunt-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hunt-balance">Start balance</Label>
              <Input
                id="hunt-balance"
                value={balanceDraft ?? String(hunt.startBalance)}
                inputMode="decimal"
                onChange={(event) => setBalanceDraft(event.target.value)}
                onBlur={async () => {
                  if (balanceDraft !== null && balanceDraft !== String(hunt.startBalance)) {
                    await run({ action: 'balance', startBalance: balanceDraft })
                  }
                  setBalanceDraft(null)
                }}
                onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {live && (
              <Button variant="destructive" onClick={() => setConfirm('end')} disabled={busy}>
                End hunt
              </Button>
            )}
            {!live && (
              <Button variant="outline" onClick={() => setConfirm('delete')} disabled={busy}>
                Delete hunt
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>At a glance</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label="Start" value={money(stats.start)} />
            <Stat label="Winnings" value={money(stats.winnings)} />
            <Stat label="Total Bonuses" value={String(stats.totalBonuses)} />
            <Stat label="Remaining" value={String(stats.remaining)} />
            <Stat label="Run Average" value={stats.runAverage === null ? '—' : `${stats.runAverage.toFixed(2)}x`} />
            <Stat label="Required Average" value={stats.requiredAverage === null ? '—' : `${stats.requiredAverage.toFixed(2)}x`} />
          </div>
          <details className="group rounded-lg border border-border p-3">
            <summary className="cursor-pointer text-sm font-medium text-foreground">How these are calculated</summary>
            <div className="pt-3">
              <BonusHuntFormulas stats={stats} currency={hunt.currency} />
            </div>
          </details>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bonuses</CardTitle>
          <CardDescription>
            Edit a field and click away to save. Setting a payout marks the bonus opened. Click a thumbnail to set the game image.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BonusHuntEntries
            entries={entries}
            nextPosition={stats.nextPosition}
            huntId={hunt.id}
            currency={hunt.currency}
            onRefresh={() => void mutate()}
            onError={setActionError}
          />
        </CardContent>
      </Card>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === 'delete' ? `Delete hunt #${hunt.number}?` : `End hunt #${hunt.number}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === 'delete'
                ? 'The hunt and all of its bonuses are removed from the statistics. This cannot be undone.'
                : 'Chat calls stop being added and !r goes back to the regular slot calls. The results stay on the widget until you start the next hunt.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const ok = await run({ action: confirm })
                if (ok && confirm === 'delete') onBack()
              }}
            >
              {confirm === 'delete' ? 'Delete' : 'End hunt'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
