'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { huntRequest, useBonusHunt } from '@/lib/hunt/use-bonus-hunt'

const HUNT_URL = '/api/admin/bonus-hunt'
const money = (value: number) =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-base font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  )
}

function WidgetLink() {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}/widget/bonushunt`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>OBS browser source URL</Label>
      <div className="flex gap-2">
        <Input readOnly value="/widget/bonushunt" aria-label="Widget path" className="font-mono text-sm" />
        <Button variant="outline" onClick={copy}>
          {copied ? <Check className="mr-1 size-4" aria-hidden="true" /> : <Copy className="mr-1 size-4" aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy full URL'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Add it in OBS as a Browser source (about 480 wide, 700 tall). The background is transparent and it updates every 3 seconds.
      </p>
    </div>
  )
}

export function BonusHunts() {
  const { data, error, isLoading, mutate } = useBonusHunt()
  const [actionError, setActionError] = useState<string | null>(null)
  const [startBalance, setStartBalance] = useState('')
  const [huntNumber, setHuntNumber] = useState('')
  const [balanceDraft, setBalanceDraft] = useState<string | null>(null)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [busy, setBusy] = useState(false)

  const refresh = () => void mutate()

  async function run(body: Record<string, unknown>) {
    setBusy(true)
    const result = await huntRequest('POST', HUNT_URL, body)
    setBusy(false)
    setActionError(result.ok ? null : (result.error ?? 'Something went wrong.'))
    await mutate()
    return result.ok
  }

  if (isLoading && !data) return <p className="text-sm text-muted-foreground">Loading bonus hunt…</p>
  if (!data) return <p role="alert" className="text-sm text-destructive">{error?.message ?? 'Could not load bonus hunt data.'}</p>

  const { settings, hunt, entries, stats } = data
  const live = hunt?.status === 'live'

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Bonus Hunt</CardTitle>
            <CardDescription>
              Chat calls with !r or !request go straight into the live hunt while it is switched on.
            </CardDescription>
          </div>
          {hunt && (
            <Badge variant={live ? 'default' : 'secondary'}>
              {live ? 'Live' : 'Ended'} · #{hunt.number}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {(actionError || error) && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-foreground">
              {actionError ?? error?.message}
            </p>
          )}

          {!live ? (
            <form
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
              onSubmit={async (event) => {
                event.preventDefault()
                if (await run({ action: 'start', startBalance, number: huntNumber || undefined })) {
                  setStartBalance('')
                  setHuntNumber('')
                }
              }}
            >
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="hunt-start">Start balance</Label>
                <Input
                  id="hunt-start"
                  value={startBalance}
                  onChange={(event) => setStartBalance(event.target.value)}
                  inputMode="decimal"
                  placeholder="10000"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:w-40">
                <Label htmlFor="hunt-number">Hunt # (optional)</Label>
                <Input
                  id="hunt-number"
                  value={huntNumber}
                  onChange={(event) => setHuntNumber(event.target.value)}
                  inputMode="numeric"
                  placeholder={hunt ? String(hunt.number + 1) : '1'}
                />
              </div>
              <Button type="submit" disabled={busy || !startBalance.trim()}>
                Start new hunt
              </Button>
            </form>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="hunt-balance">Start balance</Label>
                <Input
                  id="hunt-balance"
                  value={balanceDraft ?? String(hunt?.startBalance ?? 0)}
                  onChange={(event) => setBalanceDraft(event.target.value)}
                  onBlur={async () => {
                    if (balanceDraft !== null && balanceDraft !== String(hunt?.startBalance)) {
                      await run({ action: 'balance', startBalance: balanceDraft })
                    }
                    setBalanceDraft(null)
                  }}
                  onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
                  inputMode="decimal"
                />
              </div>
              <Button variant="destructive" onClick={() => setConfirmEnd(true)} disabled={busy}>
                End hunt
              </Button>
            </div>
          )}

          <div className="grid gap-4 rounded-lg border border-border p-3 sm:grid-cols-3">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="hunt-on" className="flex flex-col gap-0.5">
                Accept chat calls
                <span className="text-xs font-normal text-muted-foreground">Needs a live hunt</span>
              </Label>
              <Switch
                id="hunt-on"
                checked={settings.huntOn}
                disabled={busy || !live}
                onCheckedChange={(huntOn) => void run({ action: 'settings', huntOn })}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="hunt-max">Max calls per user</Label>
              <Input
                id="hunt-max"
                key={settings.maxCallsPerUser}
                type="number"
                min={1}
                max={100}
                defaultValue={settings.maxCallsPerUser}
                className="w-20"
                onBlur={(event) => {
                  if (Number(event.target.value) !== settings.maxCallsPerUser) {
                    void run({ action: 'settings', maxCallsPerUser: event.target.value })
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="hunt-dupes">Reject duplicate slots</Label>
              <Switch
                id="hunt-dupes"
                checked={settings.rejectDuplicates}
                disabled={busy}
                onCheckedChange={(rejectDuplicates) => void run({ action: 'settings', rejectDuplicates })}
              />
            </div>
          </div>

          <WidgetLink />
        </CardContent>
      </Card>

      {hunt && stats && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Hunt #{hunt.number} at a glance</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Stat label="Start" value={money(stats.start)} />
                <Stat label="Winnings" value={money(stats.winnings)} />
                <Stat label="Total Bonuses" value={String(stats.totalBonuses)} />
                <Stat label="Remaining" value={String(stats.remaining)} />
                <Stat label="Run Average" value={stats.runAverage === null ? '—' : `${stats.runAverage.toFixed(2)}x`} />
                <Stat
                  label="Required Average"
                  value={stats.requiredAverage === null ? '—' : `${stats.requiredAverage.toFixed(2)}x`}
                />
              </div>
              <details className="group rounded-lg border border-border p-3">
                <summary className="cursor-pointer text-sm font-medium text-foreground">How these are calculated</summary>
                <div className="pt-3">
                  <BonusHuntFormulas stats={stats} />
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
                onRefresh={refresh}
                onError={setActionError}
              />
            </CardContent>
          </Card>
        </>
      )}

      <AlertDialog open={confirmEnd} onOpenChange={setConfirmEnd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End hunt #{hunt?.number}?</AlertDialogTitle>
            <AlertDialogDescription>
              Chat calls stop being added and !r goes back to the regular slot calls. The results stay on the widget until you start the next hunt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep going</AlertDialogCancel>
            <AlertDialogAction onClick={() => void run({ action: 'end' })}>End hunt</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
