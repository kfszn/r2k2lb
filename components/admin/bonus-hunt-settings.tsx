'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { huntRequest, useBonusHunt } from '@/lib/hunt/use-bonus-hunt'

const HUNT_URL = '/api/admin/bonus-hunt'

function WidgetLink() {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}/widget/bonushunt`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="widget-path">OBS browser source URL</Label>
      <div className="flex gap-2">
        <Input id="widget-path" readOnly value="/widget/bonushunt" className="font-mono text-sm" />
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

export function BonusHuntSettings() {
  const { data, mutate } = useBonusHunt()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function save(body: Record<string, unknown>) {
    setBusy(true)
    const result = await huntRequest('POST', HUNT_URL, { action: 'settings', ...body })
    setBusy(false)
    setError(result.ok ? null : (result.error ?? 'Something went wrong.'))
    await mutate()
  }

  if (!data) return null
  const { settings, hunt } = data
  const live = hunt?.status === 'live'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat calls and widget</CardTitle>
        <CardDescription>Calls with !r or !request go straight into the live hunt while it is switched on.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {error && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-foreground">
            {error}
          </p>
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
              onCheckedChange={(huntOn) => void save({ huntOn })}
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
                if (Number(event.target.value) !== settings.maxCallsPerUser) void save({ maxCallsPerUser: event.target.value })
              }}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="hunt-dupes">Reject duplicate slots</Label>
            <Switch
              id="hunt-dupes"
              checked={settings.rejectDuplicates}
              disabled={busy}
              onCheckedChange={(rejectDuplicates) => void save({ rejectDuplicates })}
            />
          </div>
        </div>
        <WidgetLink />
      </CardContent>
    </Card>
  )
}
