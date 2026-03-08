'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Loader2, Save } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface SettingsData {
  pointsPerMessage: number
  pointsPer10Min: number
}

export function RewardsSettings() {
  const { data, mutate, isLoading } = useSWR<SettingsData>('/api/settings', fetcher)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pointsPerMessage, setPointsPerMessage] = useState('')
  const [pointsPer10Min, setPointsPer10Min] = useState('')

  // Populate fields when data loads
  useEffect(() => {
    if (data && !('error' in data)) {
      setPointsPerMessage(String(data.pointsPerMessage))
      setPointsPer10Min(String(data.pointsPer10Min))
    }
  }, [data])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pointsPerMessage: Number(pointsPerMessage),
          pointsPer10Min: Number(pointsPer10Min),
        }),
      })
      if (res.ok) {
        mutate()
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setSaving(false)
    }
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
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label>Points per chat message</Label>
              <p className="text-xs text-muted-foreground">
                Points awarded each time a user sends a message in Kick chat
              </p>
              <Input
                type="number"
                min={0}
                value={pointsPerMessage}
                onChange={e => setPointsPerMessage(e.target.value)}
                className="max-w-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Points per 10 minutes watched</Label>
              <p className="text-xs text-muted-foreground">
                Points awarded for every 10 minutes a user watches the stream
              </p>
              <Input
                type="number"
                min={0}
                value={pointsPer10Min}
                onChange={e => setPointsPer10Min(e.target.value)}
                className="max-w-xs"
              />
            </div>

            <Button onClick={save} disabled={saving} className="mt-2">
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
