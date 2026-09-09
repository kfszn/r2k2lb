'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2, Trash2, Pencil, X, Check, Layers } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Platform = 'roobet' | 'luxdrop'

interface Tier {
  id: string
  platform: Platform
  tier_name: string
  wager_threshold: number
  reward_amount: number
  claimable_amount: number | null
  sort_order: number
  active: boolean
}

const EMPTY_FORM = {
  platform: 'roobet' as Platform,
  tier_name: '',
  wager_threshold: 0,
  reward_amount: 0,
  claimable_amount: null as number | null,
  sort_order: 0,
  active: true,
}

export function WagerMilestoneTiersManager() {
  const { data, mutate } = useSWR<{ tiers: Tier[] }>('/api/admin/wager-milestone-tiers', fetcher)
  const tiers = data?.tiers ?? []

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [platformFilter, setPlatformFilter] = useState<Platform>('roobet')

  const resetForm = () => {
    setForm({ ...EMPTY_FORM, platform: platformFilter })
    setEditingId(null)
    setShowForm(false)
    setError(null)
  }

  const openEdit = (t: Tier) => {
    setForm({
      platform: t.platform,
      tier_name: t.tier_name,
      wager_threshold: t.wager_threshold,
      reward_amount: t.reward_amount,
      claimable_amount: t.claimable_amount,
      sort_order: t.sort_order,
      active: t.active,
    })
    setEditingId(t.id)
    setShowForm(true)
    setError(null)
  }

  const handleSave = async () => {
    if (!form.tier_name.trim()) {
      setError('Tier name is required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const url = editingId ? `/api/admin/wager-milestone-tiers/${editingId}` : '/api/admin/wager-milestone-tiers'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Save failed')
      mutate()
      resetForm()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await fetch(`/api/admin/wager-milestone-tiers/${id}`, { method: 'DELETE' })
      mutate()
    } finally {
      setDeleting(null)
    }
  }

  const handleToggleActive = async (t: Tier) => {
    await fetch(`/api/admin/wager-milestone-tiers/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !t.active }),
    })
    mutate()
  }

  const filteredTiers = tiers.filter((t) => t.platform === platformFilter).sort((a, b) => a.sort_order - b.sort_order)

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Wager Milestone Tiers
        </CardTitle>
        {!showForm && (
          <Button size="sm" onClick={() => { setShowForm(true); setEditingId(null); setForm({ ...EMPTY_FORM, platform: platformFilter }) }}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Tier
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex gap-1.5">
          {(['roobet', 'luxdrop'] as Platform[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlatformFilter(p)}
              className={`rounded-full px-3 py-1 text-xs font-medium border capitalize transition-colors ${
                platformFilter === p
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-transparent text-muted-foreground border-border/40 hover:text-foreground'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {showForm && (
          <div className="rounded-xl border border-border/50 bg-muted/20 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">{editingId ? 'Edit Tier' : 'New Tier'}</p>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <Select value={form.platform} onValueChange={(v) => setForm((f) => ({ ...f, platform: v as Platform }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="roobet">Roobet</SelectItem>
                    <SelectItem value="luxdrop">LuxDrop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tier Name</Label>
                <Input
                  placeholder="e.g. Gold"
                  value={form.tier_name}
                  onChange={(e) => setForm((f) => ({ ...f, tier_name: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Wager Threshold ($)</Label>
                <Input
                  type="number"
                  value={form.wager_threshold}
                  onChange={(e) => setForm((f) => ({ ...f, wager_threshold: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Reward Amount ($)</Label>
                <Input
                  type="number"
                  value={form.reward_amount}
                  onChange={(e) => setForm((f) => ({ ...f, reward_amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Claimable Delta ($) — optional</Label>
              <Input
                type="number"
                placeholder="Leave blank to hide the +$X claim line"
                value={form.claimable_amount ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    claimable_amount: e.target.value === '' ? null : parseFloat(e.target.value) || 0,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Shown as &ldquo;+$X claim&rdquo; on this tier&apos;s row (this tier&apos;s reward minus the previous tier&apos;s reward). Roobet uses this; LuxDrop leaves it blank.
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.active}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
                  id="tier-active"
                />
                <Label htmlFor="tier-active" className="cursor-pointer">Active (visible to players)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Sort order</Label>
                <Input
                  type="number"
                  className="w-20"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm} size="sm">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Check className="h-4 w-4 mr-1.5" />}
                {editingId ? 'Save Changes' : 'Create Tier'}
              </Button>
            </div>
          </div>
        )}

        {!data ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTiers.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No tiers yet for this platform. Click &ldquo;Add Tier&rdquo; to create one.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTiers.map((t) => (
              <div
                key={t.id}
                className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${
                  t.active ? 'border-border/40 bg-card/40' : 'border-border/20 bg-muted/10 opacity-60'
                }`}
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-foreground">{t.tier_name}</p>
                    <Badge variant={t.active ? 'default' : 'secondary'} className="text-[10px]">
                      {t.active ? 'Active' : 'Hidden'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ${t.wager_threshold.toLocaleString()} wagered → ${t.reward_amount.toLocaleString()} reward
                    {t.claimable_amount != null && (
                      <span className="text-emerald-500"> (+${t.claimable_amount.toLocaleString()} claim)</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Switch checked={t.active} onCheckedChange={() => handleToggleActive(t)} className="scale-75" />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(t)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(t.id)}
                    disabled={deleting === t.id}
                  >
                    {deleting === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
