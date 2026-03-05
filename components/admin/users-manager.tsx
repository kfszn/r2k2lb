'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Users, Search, Plus, Minus, Loader2, Link2, Check, X } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type User = {
  id: string
  email: string
  account_id: string
  kick_username: string | null
  acebet_username: string | null
  points: number
  created_at: string
}

export function UsersManager() {
  const { data, mutate } = useSWR<{ users: User[] }>('/api/admin/users', fetcher)
  const [search, setSearch] = useState('')
  const [adjusting, setAdjusting] = useState<string | null>(null)
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  // Acebet linking state
  const [linkingUser, setLinkingUser] = useState<string | null>(null)
  const [acebetInputs, setAcebetInputs] = useState<Record<string, string>>({})
  const [linkingLoading, setLinkingLoading] = useState<string | null>(null)

  const users = data?.users ?? []
  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return (
      u.email?.toLowerCase().includes(q) ||
      u.account_id?.toLowerCase().includes(q) ||
      u.kick_username?.toLowerCase().includes(q) ||
      u.acebet_username?.toLowerCase().includes(q)
    )
  })

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

  const saveAcebetLink = async (userId: string) => {
    setLinkingLoading(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}/link-acebet`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acebet_username:acebetInputs[userId] ?? '' }),
      })
      if (res.ok) {
        mutate()
        setLinkingUser(null)
        setAcebetInputs(v => ({ ...v, [userId]: '' }))
      }
    } finally {
      setLinkingLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Users & Points
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by email, account ID, Kick or Acebet username..."
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
            {filtered.map(user => (
              <div key={user.id} className="border border-border/40 rounded-lg p-4 space-y-3">
                {/* User info row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{user.email}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="font-mono text-xs bg-muted rounded px-1.5 py-0.5">{user.account_id}</span>
                      {user.kick_username && (
                        <Badge variant="secondary" className="text-xs">Kick: @{user.kick_username}</Badge>
                      )}
                      {user.acebet_username ? (
                        <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-400 border-green-500/20">
                          Acebet: {user.acebet_username}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground border-dashed">
                          No Acebet linked
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-primary">{user.points.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>

                {/* Acebet link row */}
                {linkingUser === user.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      autoFocus
                      placeholder="Acebet username"
                      value={acebetInputs[user.id] ?? user.acebet_username ?? ''}
                      onChange={e => setAcebetInputs(v => ({ ...v, [user.id]: e.target.value }))}
                      className="h-8 text-sm"
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveAcebetLink(user.id)
                        if (e.key === 'Escape') setLinkingUser(null)
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-8 text-xs gap-1"
                      disabled={linkingLoading === user.id}
                      onClick={() => saveAcebetLink(user.id)}
                    >
                      {linkingLoading === user.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs"
                      onClick={() => setLinkingUser(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1.5 w-full"
                    onClick={() => {
                      setAcebetInputs(v => ({ ...v, [user.id]: user.acebet_username ?? '' }))
                      setLinkingUser(user.id)
                    }}
                  >
                    <Link2 className="h-3 w-3" />
                    {user.acebet_username ? 'Update Acebet Link' : 'Link Acebet Account'}
                  </Button>
                )}

                {/* Points adjustment */}
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={amounts[user.id] ?? ''}
                    onChange={e => setAmounts(v => ({ ...v, [user.id]: e.target.value }))}
                    className="h-8 text-sm w-32"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1"
                    disabled={!amounts[user.id] || adjusting === user.id}
                    onClick={() => adjustPoints(user.id, parseInt(amounts[user.id]))}
                  >
                    {adjusting === user.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-3 w-3" />
                        Add
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1"
                    disabled={!amounts[user.id] || adjusting === user.id}
                    onClick={() => adjustPoints(user.id, -parseInt(amounts[user.id]))}
                  >
                    {adjusting === user.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Minus className="h-3 w-3" />
                        Deduct
                      </>
                    )}
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
