'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Users, Search, Plus, Minus, Loader2, Link2, Check, X,
  Unlink, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type User = {
  id: string
  email: string
  account_id: string
  points: number
  created_at: string
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

export function UsersManager() {
  const { data, mutate } = useSWR<{ users: User[] }>('/api/admin/users', fetcher)
  const [search, setSearch] = useState('')
  const [adjusting, setAdjusting] = useState<string | null>(null)
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<EditingConnection | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null) // `${userId}:${provider}:${action}`

  const users = data?.users ?? []

  // Full-text search across all connection fields
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

  const adjustPoints = async (userId: string, delta: number) => {
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
          Users & Account Connections
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by email, account ID, Kick ID/username, Acebet ID/username, Discord ID/username..."
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

                  {/* ── Header row ── */}
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
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{user.points.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">points</p>
                        </div>
                        <button
                          onClick={() => toggleExpand(user.id)}
                          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Points adjustment — always visible */}
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
                        onClick={() => adjustPoints(user.id, parseInt(amounts[user.id]))}
                      >
                        {adjusting === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                        Add
                      </Button>
                      <Button
                        size="sm" variant="outline" className="h-8 text-xs gap-1"
                        disabled={!amounts[user.id] || adjusting === user.id}
                        onClick={() => adjustPoints(user.id, -parseInt(amounts[user.id]))}
                      >
                        {adjusting === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Minus className="h-3 w-3" />}
                        Deduct
                      </Button>
                    </div>
                  </div>

                  {/* ── Expanded connections panel ── */}
                  {isExpanded && (
                    <div className="border-t border-border/40 bg-muted/30 p-4 space-y-5">

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
