'use client'

import { useMemo, useState } from 'react'
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
import { Plus, Loader2, Trash2, Pencil, X, Check, Gift, Wallet, Copy, TrendingUp, ListFilter, Wallet2 } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface AdminUser {
  id: string
  roobet_username: string | null
  luxdrop_username: string | null
}

type Platform = 'roobet' | 'luxdrop'
type Category = 'wager_milestone' | 'lossback' | 'tournament' | 'deposit_bonus' | 'giveaway' | 'raffle' | 'leaderboard'
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
  leaderboard: 'Leaderboard',
}

const STATUS_STYLES: Record<Status, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  approved: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  paid: 'bg-green-500/10 text-green-500 border-green-500/20',
}

function RewardsSummary({ claims }: { claims: Claim[] }) {
  const summary = useMemo(() => {
    const paid = claims.filter((c) => c.status === 'paid')
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const totalPaid = paid.reduce((sum, c) => sum + c.amount, 0)
    const monthPaid = paid
      .filter((c) => new Date(c.created_at) >= monthStart)
      .reduce((sum, c) => sum + c.amount, 0)
    const pendingTotal = claims
      .filter((c) => c.status === 'pending' || c.status === 'approved')
      .reduce((sum, c) => sum + c.amount, 0)

    const byCategory = (Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      total: paid.filter((c) => c.category === cat).reduce((sum, c) => sum + c.amount, 0),
    })).filter((row) => row.total > 0)
      .sort((a, b) => b.total - a.total)

    return { totalPaid, monthPaid, pendingTotal, byCategory }
  }, [claims])

  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long' })

  return (
    <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-4">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Wallet2 className="h-4 w-4 text-primary" />
        Total Rewards Paid
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border/40 bg-card/40 p-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">All Time</p>
          <p className="text-lg font-bold text-emerald-400 mt-1">${summary.totalPaid.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-card/40 p-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{monthLabel}</p>
          <p className="text-lg font-bold text-emerald-400 mt-1">${summary.monthPaid.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-card/40 p-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Pending/Approved</p>
          <p className="text-lg font-bold text-yellow-500 mt-1">${summary.pendingTotal.toLocaleString()}</p>
        </div>
      </div>

      {summary.byCategory.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">By Category (Paid)</p>
          <div className="grid grid-cols-2 gap-2">
            {summary.byCategory.map((row) => (
              <div key={row.category} className="rounded-lg border border-border/40 bg-card/40 p-3">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">{row.label}</p>
                <p className="text-sm font-bold text-foreground mt-1">${row.total.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PayoutAddressRow({ label, address }: { label: string; address: string | null }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-medium text-foreground shrink-0 w-10">{label}</span>
      {address ? (
        <>
          <span className="font-mono text-muted-foreground truncate flex-1 min-w-0">{address}</span>
          <button
            type="button"
            onClick={copy}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`Copy ${label} address`}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </>
      ) : (
        <span className="text-muted-foreground/60 italic">Not saved</span>
      )}
    </div>
  )
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

  // Player list — powers the Username dropdown so admins pick a player
  // instead of typing (and mistyping) their name for every claim.
  const { data: usersData } = useSWR<{ users: AdminUser[] }>('/api/admin/users', fetcher)
  const players = usersData?.users ?? []

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all')
  const [usernameManual, setUsernameManual] = useState(false)

  const usernameOptions = (() => {
    const key = form.platform === 'roobet' ? 'roobet_username' : 'luxdrop_username'
    const seen = new Set<string>()
    const opts: string[] = []
    for (const u of players) {
      const name = u[key]
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase())
        opts.push(name)
      }
    }
    return opts.sort((a, b) => a.localeCompare(b))
  })()

  // Payout address lookup — auto-fills when a username matches a saved
  // profile so admins have the wallet address on hand without asking.
  const [payoutAddresses, setPayoutAddresses] = useState<{ usdt_address: string | null; sol_address: string | null } | null>(null)
  const [payoutLookupLoading, setPayoutLookupLoading] = useState(false)

  const lookupPayoutAddress = async (username: string, platform: Platform) => {
    if (!username.trim()) {
      setPayoutAddresses(null)
      return
    }
    setPayoutLookupLoading(true)
    try {
      const res = await fetch(`/api/admin/payout-address?username=${encodeURIComponent(username.trim())}&platform=${platform}`)
      const json = await res.json()
      setPayoutAddresses(json.found ? { usdt_address: json.usdt_address, sol_address: json.sol_address } : null)
    } catch {
      setPayoutAddresses(null)
    } finally {
      setPayoutLookupLoading(false)
    }
  }

  // Wager Milestone eligibility lookup — shows how much of the reached tier
  // is still unpaid (eligible total minus what's already approved/paid) so
  // admins never re-pay a tier that's partially claimed.
  const [wagerEligibility, setWagerEligibility] = useState<{
    wagered: number
    eligibleTotal: number
    claimedTotal: number
    available: number
    tierLabel: string | null
  } | null>(null)
  const [wagerEligibilityLoading, setWagerEligibilityLoading] = useState(false)
  const [wagerEligibilityError, setWagerEligibilityError] = useState<string | null>(null)

  const lookupWagerEligibility = async (username: string, platform: Platform, category: Category) => {
    if (category !== 'wager_milestone' || !username.trim()) {
      setWagerEligibility(null)
      setWagerEligibilityError(null)
      return
    }
    setWagerEligibilityLoading(true)
    setWagerEligibilityError(null)
    try {
      const res = await fetch(`/api/admin/wager-bonus-eligibility?username=${encodeURIComponent(username.trim())}&platform=${platform}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Lookup failed')
      setWagerEligibility(json)
    } catch (err: unknown) {
      setWagerEligibility(null)
      setWagerEligibilityError(err instanceof Error ? err.message : 'Lookup failed')
    } finally {
      setWagerEligibilityLoading(false)
    }
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(false)
    setError(null)
    setPayoutAddresses(null)
    setWagerEligibility(null)
    setWagerEligibilityError(null)
    setUsernameManual(false)
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
    setUsernameManual(true)
    lookupPayoutAddress(c.username, c.platform)
    lookupWagerEligibility(c.username, c.platform, c.category)
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
        {data && claims.length > 0 && <RewardsSummary claims={claims} />}

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
                <Select
                  value={form.platform}
                  onValueChange={(v) => {
                    const platform = v as Platform
                    setForm((f) => ({ ...f, platform, username: '' }))
                    setPayoutAddresses(null)
                    setWagerEligibility(null)
                    setWagerEligibilityError(null)
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="roobet">Roobet</SelectItem>
                    <SelectItem value="luxdrop">LuxDrop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Username</Label>
                  <button
                    type="button"
                    onClick={() => setUsernameManual((m) => !m)}
                    className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ListFilter className="h-3 w-3" />
                    {usernameManual ? 'Pick from list' : 'Type manually'}
                  </button>
                </div>
                {usernameManual ? (
                  <Input
                    placeholder="Platform username"
                    value={form.username}
                    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                    onBlur={(e) => {
                      lookupPayoutAddress(e.target.value, form.platform)
                      lookupWagerEligibility(e.target.value, form.platform, form.category)
                    }}
                  />
                ) : (
                  <Select
                    value={usernameOptions.includes(form.username) ? form.username : undefined}
                    onValueChange={(v) => {
                      setForm((f) => ({ ...f, username: v }))
                      lookupPayoutAddress(v, form.platform)
                      lookupWagerEligibility(v, form.platform, form.category)
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select a player" /></SelectTrigger>
                    <SelectContent>
                      {usernameOptions.length === 0 ? (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">No linked players yet</div>
                      ) : (
                        usernameOptions.map((name) => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {(payoutLookupLoading || payoutAddresses) && (
              <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Wallet className="h-3.5 w-3.5" />
                  Saved Payout Addresses
                </div>
                {payoutLookupLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Looking up...
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <PayoutAddressRow label="USDT" address={payoutAddresses?.usdt_address ?? null} />
                    <PayoutAddressRow label="SOL" address={payoutAddresses?.sol_address ?? null} />
                  </div>
                )}
              </div>
            )}

            {form.category === 'wager_milestone' && form.username.trim() && (
              <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Wager Bonus Eligibility
                </div>
                {wagerEligibilityLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Checking eligibility...
                  </div>
                ) : wagerEligibilityError ? (
                  <p className="text-xs text-destructive">{wagerEligibilityError}</p>
                ) : wagerEligibility ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {wagerEligibility.tierLabel ? `Reached ${wagerEligibility.tierLabel}` : 'No tier reached yet'}
                      </span>
                      <span className="font-mono text-muted-foreground">
                        ${wagerEligibility.wagered.toLocaleString()} wagered
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Eligible total</span>
                      <span className="font-mono">${wagerEligibility.eligibleTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Already claimed</span>
                      <span className="font-mono">${wagerEligibility.claimedTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-border/40">
                      <span className="text-xs font-semibold text-foreground">Available now</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-emerald-400">${wagerEligibility.available.toLocaleString()}</span>
                        {wagerEligibility.available > 0 && (
                          <button
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, amount: wagerEligibility.available }))}
                            className="text-[11px] font-medium text-primary hover:underline"
                          >
                            Use amount
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => {
                    const category = v as Category
                    setForm((f) => ({ ...f, category }))
                    lookupWagerEligibility(form.username, form.platform, category)
                  }}
                >
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
