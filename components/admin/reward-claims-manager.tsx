'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2, Trash2, Pencil, X, Check, Gift } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Platform = 'roobet' | 'luxdrop'
type Category = 'wager_milestone' | 'lossback' | 'tournament' | 'deposit_bonus' | 'giveaway' | 'raffle'
type Status = 'pending' | 'approved' | 'paid'

interface Claim {
  id: string
  platform: Platform
  username: string
  category: Category
  title: string
  amount: number
  status: Status
  period_label: string | null
  notes: string | null
  created_at: string
}

const CATEGORY_LABELS: Record<Category, string> = {
  wager_milestone: 'Wager Milestones',
  lossback: 'Lossback',
  tournament: 'Tournament',
  deposit_bonus: 'Deposit Bonuses',
  giveaway: 'Giveaways',
  raffle: 'Raffle',
}

const STATUS_STYLES: Record<Status, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  approved: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  paid: 'bg-green-500/10 text-green-500 border-green-500/20',
}

const EMPTY_FORM = {
  platform: 'roobet' as Platform,
  username: '',
  category: 'wager_milestone' as Category,
  title: '',
  amount: 0,
  status: 'pending' as Status,
  period_label: '',
  notes: '',
}

export function RewardClaimsManager() {
  const { data, mutate } = useSWR<{ claims: Claim[] }>('/api/admin/reward-claims', fetcher)
  const claims = data?.claims ?? []

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all')

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(false)
    setError(null)
  }

  const openEdit = (c: Claim) => {
    setForm({
      platform: c.platform,
      username: c.username,
      category: c.category,
      title: c.title,
      amount: c.amount,
      status: c.status,
      period_label: c.period_label ?? '',
      notes: c.notes ?? '',
    })
    setEditingId(c.id)
    setShowForm(true)
    setError(null)
  }

  const handleSave = async () => {
    if (!form.username.trim() || !form.title.trim()) {
      setError('Username and title are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const url = editingId ? `/api/admin/reward-claims/${editingId}` : '/api/admin/reward-claims'
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
      await fetch(`/api/admin/reward-claims/${id}`, { method: 'DELETE' })
      mutate()
    } finally {
      setDeleting(null)
    }
  }

  const handleStatusChange = async (c: Claim, status: Status) => {
    await fetch(`/api/admin/reward-claims/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    mutate()
  }

  const filteredClaims = categoryFilter === 'all' ? claims : claims.filter((c) => c.category === categoryFilter)

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Reward Claims
        </CardTitle>
        {!showForm && (
          <Button size="sm" onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM) }}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Claim
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {showForm && (
          <div className="rounded-xl border border-border/50 bg-muted/20 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">{editingId ? 'Edit Claim' : 'New Claim'}</p>
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
                <Label>Username</Label>
                <Input
                  placeholder="Platform username"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as Category }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as Status }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input
                  placeholder="e.g. Gold Milestone"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Period Label (optional)</Label>
              <Input
                placeholder="e.g. September I"
                value={form.period_label}
                onChange={(e) => setForm((f) => ({ ...f, period_label: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="e.g. Twitch stream giveaway 9/9"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </div>

            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm} size="sm">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Check className="h-4 w-4 mr-1.5" />}
                {editingId ? 'Save Changes' : 'Create Claim'}
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              categoryFilter === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-transparent text-muted-foreground border-border/40 hover:text-foreground'
            }`}
          >
            All
          </button>
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                categoryFilter === cat
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-transparent text-muted-foreground border-border/40 hover:text-foreground'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {!data ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No claims yet. Click &ldquo;Add Claim&rdquo; to create one.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClaims.map((c) => (
              <div key={c.id} className="flex items-start gap-4 rounded-xl border border-border/40 bg-card/40 p-4">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-foreground">{c.title}</p>
                    <Badge variant="outline" className="text-[10px] capitalize">{c.platform}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{CATEGORY_LABELS[c.category]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.username}
                    {c.period_label ? ` · ${c.period_label}` : ''}
                    {' · '}
                    {new Date(c.created_at).toLocaleDateString()}
                  </p>
                  {c.notes && <p className="text-xs text-muted-foreground italic">{c.notes}</p>}
                  <p className="text-sm font-semibold text-emerald-400">${c.amount.toLocaleString()}</p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Select value={c.status} onValueChange={(v) => handleStatusChange(c, v as Status)}>
                    <SelectTrigger className={`h-7 text-[10px] w-28 border ${STATUS_STYLES[c.status]}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => openEdit(c)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(c.id)}
                      disabled={deleting === c.id}
                    >
                      {deleting === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
