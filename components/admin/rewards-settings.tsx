'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Loader2, Save } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type SettingRow = { key: string; value: string }

export function RewardsSettings() {
  const { data, mutate } = useSWR<{ settings: SettingRow[] }>('/api/settings', fetcher)
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  const settings = data?.settings ?? []
  const getValue = (key: string) => values[key] ?? settings.find(s => s.key === key)?.value ?? ''

  const save = async () => {
    setSaving(true)
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: values }),
      })
      mutate()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const LABELS: Record<string, { label: string; description: string }> = {
    points_per_message: {
      label: 'Points per chat message',
      description: 'Points awarded each time a user sends a message in Kick chat',
    },
    points_per_10min_watch: {
      label: 'Points per 10 minutes watched',
      description: 'Points awarded for every 10 minutes a user watches the stream',
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Points Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {settings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        ) : (
          <>
            {settings.map(s => {
              const meta = LABELS[s.key]
              return (
                <div key={s.key} className="space-y-1.5">
                  <Label>{meta?.label ?? s.key}</Label>
                  {meta?.description && (
                    <p className="text-xs text-muted-foreground">{meta.description}</p>
                  )}
                  <Input
                    type="number"
                    min={0}
                    value={getValue(s.key)}
                    onChange={e => setValues(v => ({ ...v, [s.key]: e.target.value }))}
                    className="max-w-xs"
                  />
                </div>
              )
            })}

            <Button
              onClick={save}
              disabled={saving || Object.keys(values).length === 0}
              className="mt-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saved ? 'Saved!' : 'Save Settings'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
