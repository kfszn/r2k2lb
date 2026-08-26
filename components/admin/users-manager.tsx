'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Users, Search, Plus, Minus, Loader2, Link2, Check, X,
  Unlink, RefreshCw, ChevronDown, ChevronUp, Coins, Wallet,
  Pencil, Trash2, AlertCircle, CheckCircle2, ShieldCheck, UserCog,
} from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

/* ─────────────────────────── Types ─────────────────────────── */

type User = {
  id: string
  email: string
  account_id: string
  points: number // DB column name (maps to R2Koins)
  created_at: string
  email_verified?: boolean
  // Kick
  kick_id: string | null
  kick_username: string | null
  kick_avatar: string | null
  kick_linked_at: string | null
  // Acebet
  acebet_id: string | null
  acebet_id_suffix: string | null
  acebet_username: string | null
  acebet_linked_at: string | null
  // Discord
  discord_id: string | null
  discord_username: string | null
  discord_linked_at: string | null
}

type EditingConnection = {
  userId: string
  provider: 'acebet' | 'kick' | 'discord'
  fields: Record<string, string>
}

interface BalanceUser {
  id: string
  kick_username: string | null
  email: string
  kick_avatar: string | null
  balance: number
  balance_updated_at: string | null
}

interface PlatformRate {
  platform: string
  coins_per_dollar: number
  updated_at: string
}

interface LinkedAccount {
  id: string
  kick_user_id: string
  platform: string
  platform_username: string
  discord_ticket_ref: string | null
  initial_wager_baseline: number
  linked_at: string
  profiles: { kick_username: string | null; email: string } | null
  wager_credits: {
    last_counted_wager: number
    total_coins_awarded: number
    last_synced_at: string | null
  } | null
}

function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

/* ─────────────────────────── Root ─────────────────────────── */

export function UsersManager() {
  return (
    <Tabs defaultValue="accounts" className="space-y-6">
      <TabsList className="flex flex-wrap h-auto gap-1 p-1">
        <TabsTrigger value="accounts" className="gap-2">
          <UserCog className="h-4 w-4" />
          Accounts
        </TabsTrigger>
        <TabsTrigger value="balances" className="gap-2">
          <Wallet className="h-4 w-4" />
          R2Koin Balances
        </TabsTrigger>
        <TabsTrigger value="links" className="gap-2">
          <Link2 className="h-4 w-4" />
          Platform Links
        </TabsTrigger>
        <TabsTrigger value="rates" className="gap-2">
          <Coins className="h-4 w-4" />
          Conversion Rates
        </TabsTrigger>
        <TabsTrigger value="verify" className="gap-2">
          <ShieldCheck className="h-4 w-4" />
          Email Verify
        </TabsTrigger>
      </TabsList>

      <TabsContent value="accounts">
        <AccountsTab />
      </TabsContent>
      <TabsContent value="balances">
        <BalancesTab />
      </TabsContent>
      <TabsContent value="links">
        <LinksTab />
      </TabsContent>
      <TabsContent value="rates">
        <RatesTab />
      </TabsContent>
      <TabsContent value="verify">
        <EmailVerifyTab />
      </TabsContent>
    </Tabs>
  )
}

/* ─────────────────────────── Accounts tab ─────────────────────────── */

function AccountsTab() {
  const { data, mutate } = useSWR<{ users: User[] }>('/api/admin/users', fetcher)
  const [search, setSearch] = useState('')
  const [adjusting, setAdjusting] = useState<string | null>(null)
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<EditingConnection | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const users = data?.users ?? []

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    if (!q) return true
    return [
      u.email, u.account_id,
      u.kick_id, u.kick_username,
      u.acebet_id, u.acebet_id_suffix, u.acebet_username,
      u.discord_id, u.discord_username,
    ].some(v => v?.toLowerCase().includes(q))
  })

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const adjustCoins = async (userId: string, delta: number) => {
    setAdjusting(userId)
    try {
      await fetch(`/api/admin/users/${userId}/points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta, description: `Manual admin adjustment (${delta > 0 ? '+' : ''}${delta})` }),
      })
      mutate()
      setAmounts(v => ({ ...v, [userId]: '' }))
    } finally {
      setAdjusting(null)
    }
  }

  const saveConnection = async () => {
    if (!editing) return
    const key = `${editing.userId}:${editing.provider}:link`
    setActionLoading(key)
    try {
      await fetch(`/api/admin/users/${editing.userId}/connections`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: editing.provider, ...editing.fields }),
      })
      mutate()
      setEditing(null)
    } finally {
      setActionLoading(null)
    }
  }

  const unlinkProvider = async (userId: string, provider: string) => {
    const key = `${userId}:${provider}:unlink`
    setActionLoading(key)
    try {
      await fetch(`/api/admin/users/${userId}/connections`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      })
      mutate()
    } finally {
      setActionLoading(null)
    }
  }

  const refreshAcebet = async (userId: string) => {
    const key = `${userId}:acebet:refresh`
    setActionLoading(key)
    try {
      await fetch(`/api/admin/users/${userId}/refresh-acebet`, { method: 'POST' })
      mutate()
    } finally {
      setActionLoading(null)
    }
  }

  const isLoading = (userId: string, provider: string, action: string) =>
    actionLoading === `${userId}:${provider}:${action}`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Users & Account Management
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by email, account ID, Kick, Acebet, or Discord..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {search ? 'No users match your search.' : 'No users found.'}
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map(user => {
              const isExpanded = expanded.has(user.id)
              return (
                <div key={user.id} className="border border-border/40 rounded-lg overflow-hidden">

                  {/* Header row */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{user.email}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <span className="font-mono text-xs bg-muted rounded px-1.5 py-0.5">{user.account_id}</span>
                          {user.kick_username && (
                            <Badge variant="secondary" className="text-xs">Kick: @{user.kick_username}</Badge>
                          )}
                          {user.acebet_id && (
                            <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-400 border-green-500/20">
                              {user.acebet_id}
                            </Badge>
                          )}
                          {user.discord_username && (
                            <Badge variant="secondary" className="text-xs bg-[#5865F2]/10 text-[#5865F2] border-[#5865F2]/20">
                              Discord: {user.discord_username}
                            </Badge>
                          )}
                          {user.email_verified === false && (
                            <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30 bg-amber-400/10">
                              Unverified
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{user.points.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">R2Koins</p>
                        </div>
                        <button
                          onClick={() => toggleExpand(user.id)}
                          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* R2Koins adjustment */}
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={amounts[user.id] ?? ''}
                        onChange={e => setAmounts(v => ({ ...v, [user.id]: e.target.value }))}
                        className="h-8 text-sm w-32"
                      />
                      <Button
                        size="sm" variant="outline" className="h-8 text-xs gap-1"
                        disabled={!amounts[user.id] || adjusting === user.id}
                        onClick={() => adjustCoins(user.id, parseInt(amounts[user.id]))}
                      >
                        {adjusting === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                        Add R2Koins
                      </Button>
                      <Button
                        size="sm" variant="outline" className="h-8 text-xs gap-1"
                        disabled={!amounts[user.id] || adjusting === user.id}
                        onClick={() => adjustCoins(user.id, -parseInt(amounts[user.id]))}
                      >
                        {adjusting === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Minus className="h-3 w-3" />}
                        Deduct
                      </Button>
                    </div>
                  </div>

                  {/* Expanded connections panel */}
                  {isExpanded && (
                    <div className="border-t border-border/40 bg-muted/30 p-4 space-y-5">

                      {/* Account meta */}
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        <span className="text-muted-foreground">account_id</span>
                        <span className="font-mono">{user.account_id}</span>
                        <span className="text-muted-foreground">created_at</span>
                        <span className="font-mono">{new Date(user.created_at).toLocaleString()}</span>
                        <span className="text-muted-foreground">email_verified</span>
                        <span className={user.email_verified === false ? 'text-amber-400 font-mono' : 'font-mono text-green-400'}>
                          {user.email_verified === false ? 'No' : 'Yes'}
                        </span>
                      </div>

                      {/* Kick */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Kick</p>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          <span className="text-muted-foreground">kick_id</span>
                          <span className="font-mono">{user.kick_id ?? '—'}</span>
                          <span className="text-muted-foreground">kick_username</span>
                          <span className="font-mono">{user.kick_username ?? '—'}</span>
                          <span className="text-muted-foreground">linked_at</span>
                          <span className="font-mono">{user.kick_linked_at ? new Date(user.kick_linked_at).toLocaleString() : '—'}</span>
                        </div>
                        {editing?.userId === user.id && editing.provider === 'kick' ? (
                          <div className="space-y-2 pt-1">
                            <Input
                              placeholder="kick_id"
                              value={editing.fields.kick_id ?? ''}
                              onChange={e => setEditing(v => v && ({ ...v, fields: { ...v.fields, kick_id: e.target.value } }))}
                              className="h-7 text-xs font-mono"
                            />
                            <Input
                              placeholder="kick_username"
                              value={editing.fields.kick_username ?? ''}
                              onChange={e => setEditing(v => v && ({ ...v, fields: { ...v.fields, kick_username: e.target.value } }))}
                              className="h-7 text-xs font-mono"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" className="h-7 text-xs gap-1" onClick={saveConnection} disabled={!!actionLoading}>
                                {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(null)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm" variant="outline" className="h-7 text-xs gap-1"
                              onClick={() => setEditing({ userId: user.id, provider: 'kick', fields: { kick_id: user.kick_id ?? '', kick_username: user.kick_username ?? '' } })}
                            >
                              <Link2 className="h-3 w-3" />
                              {user.kick_id ? 'Edit' : 'Link'}
                            </Button>
                            {user.kick_id && (
                              <Button
                                size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive hover:text-destructive border-destructive/30"
                                disabled={isLoading(user.id, 'kick', 'unlink')}
                                onClick={() => unlinkProvider(user.id, 'kick')}
                              >
                                {isLoading(user.id, 'kick', 'unlink') ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3 w-3" />}
                                Unlink
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Acebet */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Acebet</p>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          <span className="text-muted-foreground">acebet_id</span>
                          <span className="font-mono">{user.acebet_id ?? '—'}</span>
                          <span className="text-muted-foreground">acebet_id_suffix</span>
                          <span className="font-mono">{user.acebet_id_suffix ?? '—'}</span>
                          <span className="text-muted-foreground">acebet_username</span>
                          <span className="font-mono">{user.acebet_username ?? '—'}</span>
                          <span className="text-muted-foreground">linked_at</span>
                          <span className="font-mono">{user.acebet_linked_at ? new Date(user.acebet_linked_at).toLocaleString() : '—'}</span>
                        </div>
                        {editing?.userId === user.id && editing.provider === 'acebet' ? (
                          <div className="space-y-2 pt-1">
                            <div className="flex items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                              <span className="pl-3 pr-1 text-xs font-mono font-semibold text-muted-foreground select-none">AB-</span>
                              <input
                                type="number"
                                min={1}
                                placeholder="000000"
                                value={editing.fields.acebet_id_suffix ?? ''}
                                onChange={e => setEditing(v => v && ({ ...v, fields: { ...v.fields, acebet_id_suffix: e.target.value } }))}
                                className="flex-1 bg-transparent py-1.5 pr-3 text-xs font-mono outline-none placeholder:text-muted-foreground/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                              />
                            </div>
                            <Input
                              placeholder="acebet_username (optional)"
                              value={editing.fields.acebet_username ?? ''}
                              onChange={e => setEditing(v => v && ({ ...v, fields: { ...v.fields, acebet_username: e.target.value } }))}
                              className="h-7 text-xs font-mono"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" className="h-7 text-xs gap-1" onClick={saveConnection} disabled={!!actionLoading}>
                                {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(null)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm" variant="outline" className="h-7 text-xs gap-1"
                              onClick={() => setEditing({ userId: user.id, provider: 'acebet', fields: { acebet_id_suffix: user.acebet_id_suffix ?? '', acebet_username: user.acebet_username ?? '' } })}
                            >
                              <Link2 className="h-3 w-3" />
                              {user.acebet_id ? 'Edit' : 'Link'}
                            </Button>
                            {user.acebet_id && (
                              <>
                                <Button
                                  size="sm" variant="outline" className="h-7 text-xs gap-1"
                                  disabled={isLoading(user.id, 'acebet', 'refresh')}
                                  onClick={() => refreshAcebet(user.id)}
                                >
                                  {isLoading(user.id, 'acebet', 'refresh') ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                                  Refresh Username
                                </Button>
                                <Button
                                  size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive hover:text-destructive border-destructive/30"
                                  disabled={isLoading(user.id, 'acebet', 'unlink')}
                                  onClick={() => unlinkProvider(user.id, 'acebet')}
                                >
                                  {isLoading(user.id, 'acebet', 'unlink') ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3 w-3" />}
                                  Unlink
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Discord */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Discord</p>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          <span className="text-muted-foreground">discord_id</span>
                          <span className="font-mono">{user.discord_id ?? '—'}</span>
                          <span className="text-muted-foreground">discord_username</span>
                          <span className="font-mono">{user.discord_username ?? '—'}</span>
                          <span className="text-muted-foreground">linked_at</span>
                          <span className="font-mono">{user.discord_linked_at ? new Date(user.discord_linked_at).toLocaleString() : '—'}</span>
                        </div>
                        {editing?.userId === user.id && editing.provider === 'discord' ? (
                          <div className="space-y-2 pt-1">
                            <Input
                              placeholder="discord_id"
                              value={editing.fields.discord_id ?? ''}
                              onChange={e => setEditing(v => v && ({ ...v, fields: { ...v.fields, discord_id: e.target.value } }))}
                              className="h-7 text-xs font-mono"
                            />
                            <Input
                              placeholder="discord_username"
                              value={editing.fields.discord_username ?? ''}
                              onChange={e => setEditing(v => v && ({ ...v, fields: { ...v.fields, discord_username: e.target.value } }))}
                              className="h-7 text-xs font-mono"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" className="h-7 text-xs gap-1" onClick={saveConnection} disabled={!!actionLoading}>
                                {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(null)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm" variant="outline" className="h-7 text-xs gap-1"
                              onClick={() => setEditing({ userId: user.id, provider: 'discord', fields: { discord_id: user.discord_id ?? '', discord_username: user.discord_username ?? '' } })}
                            >
                              <Link2 className="h-3 w-3" />
                              {user.discord_id ? 'Edit' : 'Link'}
                            </Button>
                            {user.discord_id && (
                              <Button
                                size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive hover:text-destructive border-destructive/30"
                                disabled={isLoading(user.id, 'discord', 'unlink')}
                                onClick={() => unlinkProvider(user.id, 'discord')}
                              >
                                {isLoading(user.id, 'discord', 'unlink') ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3 w-3" />}
                                Unlink
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ─────────────────────────── Balances tab ─────────────────────────── */

function BalancesTab() {
  const { data, mutate, isLoading } = useSWR<{ users: BalanceUser[] }>(
    '/api/admin/r2koins/balances', fetcher
  )
  const [search, setSearch] = useState('')
  const [target, setTarget] = useState<BalanceUser | null>(null)
  const [mode, setMode] = useState<'add' | 'set'>('add')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const users = data?.users ?? []
  const filtered = search.trim()
    ? users.filter(u =>
        (u.kick_username ?? '').toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users

  const totalIssued = users.reduce((s, u) => s + u.balance, 0)
  const holders = users.filter(u => u.balance > 0).length

  const openAdjust = (u: BalanceUser, m: 'add' | 'set') => {
    setTarget(u); setMode(m); setAmount(''); setError(null)
  }

  const submitAdjust = async () => {
    if (!target) return
    const value = Number(amount)
    if (!Number.isFinite(value)) { setError('Enter a valid number'); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/admin/r2koins/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kick_user_id: target.id, amount: value, mode }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to adjust balance') }
      else { setTarget(null); mutate() }
    } catch { setError('Network error. Please try again.') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-2xl font-bold">{users.length.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Coin Holders</p>
          <p className="text-2xl font-bold">{holders.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total R2Koins Issued</p>
          <p className="text-2xl font-bold text-primary">{fmt(totalIssued)}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            All R2Koin Balances
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Every registered user and their R2Koins balance. Use Add or Set to manually adjust.
          </p>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Kick username or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {search.trim() ? 'No users match your search.' : 'No users found.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">R2Koins</TableHead>
                    <TableHead className="w-40 text-right">Adjust</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.kick_username ?? <span className="text-muted-foreground">(no kick)</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                      <TableCell className="text-right font-mono font-semibold text-primary">{fmt(u.balance)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => openAdjust(u, 'add')}>
                            <Plus className="h-3.5 w-3.5" />Add
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 gap-1" onClick={() => openAdjust(u, 'set')}>
                            <Pencil className="h-3.5 w-3.5" />Set
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjust modal */}
      {target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => !saving && setTarget(null)}>
          <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {mode === 'add' ? <Plus className="h-5 w-5 text-primary" /> : <Pencil className="h-5 w-5 text-primary" />}
                {mode === 'add' ? 'Add / Remove R2Koins' : 'Set R2Koins Balance'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {target.kick_username ?? target.email} — current balance{' '}
                <span className="font-mono font-semibold text-foreground">{fmt(target.balance)}</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{mode === 'add' ? 'Amount to add (negative to remove)' : 'New balance'}</Label>
                <Input
                  type="number" step="any" autoFocus
                  placeholder={mode === 'add' ? 'e.g. 500 or -100' : 'e.g. 1000'}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) submitAdjust() }}
                />
                {mode === 'add' && Number.isFinite(Number(amount)) && amount.trim() !== '' && (
                  <p className="text-xs text-muted-foreground">
                    New balance: <span className="font-mono font-semibold text-foreground">{fmt(target.balance + Number(amount))}</span>
                  </p>
                )}
              </div>
              {mode === 'add' && (
                <div className="flex flex-wrap gap-2">
                  {[100, 500, 1000, 5000].map(q => (
                    <Button key={q} size="sm" variant="secondary" onClick={() => setAmount(String(q))}>+{q.toLocaleString()}</Button>
                  ))}
                </div>
              )}
              {error && <div className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setTarget(null)} disabled={saving}>Cancel</Button>
                <Button onClick={submitAdjust} disabled={saving || amount.trim() === ''}>
                  {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : mode === 'add' ? 'Apply' : 'Set Balance'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────── Links tab ─────────────────────────── */

function LinksTab() {
  const { data: linksData, mutate: mutateLinks } = useSWR<{ links: LinkedAccount[] }>('/api/admin/r2koins/links', fetcher)
  const { data: ratesData } = useSWR<{ rates: PlatformRate[] }>('/api/admin/r2koins/rates', fetcher)
  const { data: usersData } = useSWR<{ users: { id: string; kick_username: string | null; email: string }[] }>('/api/admin/users', fetcher)

  const [userSearch, setUserSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [platform, setPlatform] = useState('acebet')
  const [platformUsername, setPlatformUsername] = useState('')
  const [acebetMode, setAcebetMode] = useState<'id' | 'username'>('id')
  const [acebetId, setAcebetId] = useState('')
  const [ticketRef, setTicketRef] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null)

  const usingAcebetId = platform === 'acebet' && acebetMode === 'id'
  const linkIdentifierReady = usingAcebetId ? acebetId.trim() !== '' : platformUsername.trim() !== ''

  const users = usersData?.users ?? []
  const filteredUsers = userSearch.trim()
    ? users.filter(u =>
        (u.kick_username ?? '').toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
      )
    : []

  const selectedUser = users.find(u => u.id === selectedUserId)

  const handleLink = async () => {
    if (!selectedUserId || !linkIdentifierReady) return
    setLinkLoading(true); setLinkError(null); setLinkSuccess(null)
    try {
      const acebetIdSuffix = acebetId.trim().replace(/^AB-/i, '')
      const res = await fetch('/api/admin/r2koins/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kick_user_id: selectedUserId,
          platform,
          ...(usingAcebetId ? { acebet_id: `AB-${acebetIdSuffix}` } : { platform_username: platformUsername.trim() }),
          discord_ticket_ref: ticketRef.trim() || null,
          linked_by_admin: 'admin',
        }),
      })
      const json = await res.json()
      if (!res.ok) { setLinkError(json.error ?? 'Failed to create link') }
      else {
        const who = usingAcebetId ? `AB-${acebetIdSuffix}` : platformUsername
        setLinkSuccess(`Linked ${who} on ${platform} — baseline $${Number(json.baseline).toLocaleString(undefined, { maximumFractionDigits: 2 })}`)
        setSelectedUserId(''); setUserSearch(''); setPlatformUsername(''); setAcebetId(''); setTicketRef('')
        mutateLinks()
      }
    } catch { setLinkError('Network error. Please try again.') }
    finally { setLinkLoading(false) }
  }

  const handleUnlink = async (linkId: string, username: string) => {
    if (!confirm(`Remove the link for "${username}"? Coin history is preserved.`)) return
    await fetch('/api/admin/r2koins/links', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link_id: linkId }),
    })
    mutateLinks()
  }

  return (
    <div className="space-y-6">
      {/* Link form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Link Platform Account
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Admin-only linking via Discord ticket. The user&apos;s current lifetime wager is captured as a baseline.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Site User</Label>
            {selectedUser ? (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-sm font-medium">{selectedUser.kick_username ?? selectedUser.email}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6 ml-auto" onClick={() => setSelectedUserId('')}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <>
                <Input placeholder="Search by Kick username or email..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                {filteredUsers.length > 0 && (
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                    {filteredUsers.slice(0, 8).map(u => (
                      <button key={u.id} type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                        onClick={() => { setSelectedUserId(u.id); setUserSearch('') }}
                      >
                        <span className="font-medium">{u.kick_username ?? '(no kick)'}</span>
                        <span className="text-muted-foreground ml-2">{u.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(ratesData?.rates ?? []).map(r => (
                    <SelectItem key={r.platform} value={r.platform} className="capitalize">{r.platform}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>{usingAcebetId ? 'AceBet ID' : 'Platform Username'}</Label>
                {platform === 'acebet' && (
                  <div className="flex items-center rounded-md border border-border/60 p-0.5 text-[11px]">
                    {(['id', 'username'] as const).map(m => (
                      <button key={m} type="button" onClick={() => setAcebetMode(m)}
                        className={`px-2 py-0.5 rounded-sm font-medium transition-colors ${acebetMode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        {m === 'id' ? 'By ID' : 'By Name'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {usingAcebetId ? (
                <div className="flex items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background">
                  <span className="pl-3 pr-1 text-sm font-mono font-semibold text-muted-foreground select-none">AB-</span>
                  <input type="number" min={1} placeholder="000000" value={acebetId} onChange={e => setAcebetId(e.target.value)}
                    className="flex-1 bg-transparent py-2 pr-3 text-sm font-mono outline-none placeholder:text-muted-foreground/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
              ) : (
                <Input placeholder="Exact username on the platform" value={platformUsername} onChange={e => setPlatformUsername(e.target.value)} />
              )}
            </div>
            <div className="space-y-2">
              <Label>Discord Ticket Ref (optional)</Label>
              <Input placeholder="e.g. ticket-0421" value={ticketRef} onChange={e => setTicketRef(e.target.value)} />
            </div>
          </div>

          {linkError && <div className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{linkError}</div>}
          {linkSuccess && <div className="flex items-center gap-2 text-sm text-green-500"><CheckCircle2 className="h-4 w-4 shrink-0" />{linkSuccess}</div>}

          <Button onClick={handleLink} disabled={!selectedUserId || !linkIdentifierReady || linkLoading}>
            {linkLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Fetching baseline...</> : 'Create Link'}
          </Button>
        </CardContent>
      </Card>

      {/* Existing links */}
      <Card>
        <CardHeader>
          <CardTitle>Linked Accounts ({linksData?.links?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!linksData ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : linksData.links.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No linked accounts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Site User</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead className="text-right">Baseline</TableHead>
                    <TableHead className="text-right">Counted Wager</TableHead>
                    <TableHead className="text-right">Lifetime Coins</TableHead>
                    <TableHead>Last Synced</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linksData.links.map(link => (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium">{link.profiles?.kick_username ?? link.profiles?.email ?? 'Unknown'}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{link.platform}</Badge></TableCell>
                      <TableCell>{link.platform_username}</TableCell>
                      <TableCell className="text-right font-mono text-sm">${Number(link.initial_wager_baseline).toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className="text-right font-mono text-sm">${Number(link.wager_credits?.last_counted_wager ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-primary">{Number(link.wager_credits?.total_coins_awarded ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {link.wager_credits?.last_synced_at ? new Date(link.wager_credits.last_synced_at).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleUnlink(link.id, link.platform_username)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ─────────────────────────── Rates tab ─────────────────────────── */

function RatesTab() {
  const { data: ratesData, mutate: mutateRates } = useSWR<{ rates: PlatformRate[] }>('/api/admin/r2koins/rates', fetcher)

  const [editingRate, setEditingRate] = useState<string | null>(null)
  const [rateInput, setRateInput] = useState('')
  const [rateSaving, setRateSaving] = useState(false)

  const [newPlatform, setNewPlatform] = useState('')
  const [newRate, setNewRate] = useState('')
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState<string | null>(null)

  const existingPlatforms = new Set((ratesData?.rates ?? []).map(r => r.platform.toLowerCase()))

  const handleSaveRate = async (p: string) => {
    const value = Number(rateInput)
    if (!Number.isFinite(value) || value < 0) return
    setRateSaving(true)
    await fetch('/api/admin/r2koins/rates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: p, coins_per_dollar: value }),
    })
    setRateSaving(false); setEditingRate(null); mutateRates()
  }

  const handleAddPlatform = async () => {
    const platformKey = newPlatform.trim().toLowerCase()
    const rate = Number(newRate)
    if (!platformKey) { setAddError('Platform name is required'); return }
    if (!Number.isFinite(rate) || rate < 0) { setAddError('Enter a valid non-negative rate'); return }
    setAddSaving(true); setAddError(null); setAddSuccess(null)
    try {
      const res = await fetch('/api/admin/r2koins/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformKey, coins_per_dollar: rate }),
      })
      const json = await res.json()
      if (!res.ok) { setAddError(json.error ?? 'Failed to add platform') }
      else { setAddSuccess(`Platform "${platformKey}" seeded at ${rate} coins / $1`); setNewPlatform(''); setNewRate(''); mutateRates() }
    } catch { setAddError('Network error. Please try again.') }
    finally { setAddSaving(false) }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Conversion Rates
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            R2Koins awarded per $1 wagered. Changes apply on the next daily sync.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>R2Koins per $1</TableHead>
                <TableHead>Example</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(ratesData?.rates ?? []).map(rate => (
                <TableRow key={rate.platform}>
                  <TableCell className="font-medium capitalize">{rate.platform}</TableCell>
                  <TableCell>
                    {editingRate === rate.platform ? (
                      <Input type="number" step="any" min="0" value={rateInput}
                        onChange={e => setRateInput(e.target.value)} className="w-32 h-8" autoFocus />
                    ) : (
                      <span className="font-mono">{rate.coins_per_dollar}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {Math.round(10000 * rate.coins_per_dollar).toLocaleString()} R2Koins / $10,000
                  </TableCell>
                  <TableCell>
                    {editingRate === rate.platform ? (
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" disabled={rateSaving} onClick={() => handleSaveRate(rate.platform)}>
                          {rateSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-500" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingRate(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="icon" variant="ghost" className="h-8 w-8"
                        onClick={() => { setEditingRate(rate.platform); setRateInput(String(rate.coins_per_dollar)) }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add Platform
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Seed a new platform (e.g. <span className="font-mono">roobet</span>) into the rate table. Use lowercase.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Platform key (lowercase)</Label>
              <Input placeholder="e.g. roobet" value={newPlatform}
                onChange={e => { setNewPlatform(e.target.value); setAddError(null); setAddSuccess(null) }} />
              {existingPlatforms.size > 0 && (
                <p className="text-xs text-muted-foreground">Existing: {[...existingPlatforms].join(', ')}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>R2Koins per $1 wagered</Label>
              <Input type="number" step="any" min="0" placeholder="e.g. 1" value={newRate}
                onChange={e => { setNewRate(e.target.value); setAddError(null); setAddSuccess(null) }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAddPlatform() }}
              />
            </div>
          </div>
          {addError && <div className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{addError}</div>}
          {addSuccess && <div className="flex items-center gap-2 text-sm text-green-500"><CheckCircle2 className="h-4 w-4 shrink-0" />{addSuccess}</div>}
          <Button onClick={handleAddPlatform} disabled={addSaving || !newPlatform.trim() || !newRate.trim()}>
            {addSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Add Platform'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

/* ─────────────────────────── Email Verify tab ─────────────────────────── */

function EmailVerifyTab() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleVerify = async () => {
    const trimmed = email.trim()
    if (!trimmed) return
    setLoading(true); setResult(null)
    try {
      const res = await fetch('/api/admin/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      const json = await res.json()
      setResult({ success: res.ok, message: json.message ?? (res.ok ? 'Email verified successfully.' : json.error ?? 'Failed.') })
    } catch { setResult({ success: false, message: 'Network error. Please try again.' }) }
    finally { setLoading(false) }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Manual Email Verification
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Force-verify a user&apos;s email address — useful for accounts stuck in unverified state.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label>User Email</Label>
          <Input
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setResult(null) }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleVerify() }}
          />
        </div>
        {result && (
          <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 border ${
            result.success
              ? 'text-green-500 bg-green-500/10 border-green-500/20'
              : 'text-destructive bg-destructive/10 border-destructive/20'
          }`}>
            {result.success ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            {result.message}
          </div>
        )}
        <Button onClick={handleVerify} disabled={loading || !email.trim()}>
          {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Verifying...</> : 'Verify Email'}
        </Button>
      </CardContent>
    </Card>
  )
}
