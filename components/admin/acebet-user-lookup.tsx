'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2, User, DollarSign, TrendingUp, Star, Calendar, ShieldCheck, Eye, EyeOff } from 'lucide-react'

interface AcebetUserResult {
  userId: number
  name: string | null
  avatar: string | null
  badge: string | null
  role: string | null
  active: boolean
  isPrivate: boolean
  premiumUntil: string | null
  wagered: number
  deposited: number
  earned: number
  xp: number
  firstSeen: string
  lastSeen: string
}

export function AcebetUserLookup() {
  const [mode, setMode] = useState<'username' | 'userid'>('username')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AcebetUserResult | null>(null)
  const [allResults, setAllResults] = useState<AcebetUserResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const switchMode = (next: 'username' | 'userid') => {
    setMode(next)
    setQuery('')
    setResult(null)
    setAllResults([])
    setError(null)
    setSearched(false)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)
    setResult(null)
    setAllResults([])
    setSearched(true)

    try {
      const res = await fetch('/api/leaderboard?fresh=1')
      if (!res.ok) throw new Error(`Leaderboard API returned ${res.status}`)
      const json = await res.json()
      const users: AcebetUserResult[] = json.data ?? []

      let matches: AcebetUserResult[]

      if (mode === 'userid') {
        const numId = parseInt(trimmed, 10)
        if (isNaN(numId)) {
          setError('Please enter a valid numeric user ID.')
          setLoading(false)
          return
        }
        matches = users.filter(u => u.userId === numId)
        if (matches.length === 0)
          setError(`No user found with ID AB-${trimmed} in the current leaderboard period.`)
        else
          setResult(matches[0])
      } else {
        matches = users.filter(u =>
          u.name?.toLowerCase().includes(trimmed.toLowerCase())
        )
        if (matches.length === 0)
          setError(`No user found matching "${trimmed}" in the current leaderboard period.`)
        else if (matches.length === 1)
          setResult(matches[0])
        else
          setAllResults(matches)
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const fmt = (n: number) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const FieldRow = ({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) => (
    <div className="flex items-start justify-between py-2.5 border-b border-border/30 last:border-0">
      <span className="text-sm text-muted-foreground min-w-[160px]">{label}</span>
      <span className={`text-sm font-medium text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          User Info Lookup
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Search an Acebet username to return every field the API returns for that user in the current leaderboard period.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Mode toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => switchMode('username')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              mode === 'username'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            Username
          </button>
          <button
            type="button"
            onClick={() => switchMode('userid')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              mode === 'userid'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            User ID
          </button>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          {mode === 'userid' ? (
            <div className="flex flex-1 items-center rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <span className="pl-3 pr-1 text-sm font-mono font-semibold text-muted-foreground select-none">AB-</span>
              <input
                type="number"
                min={1}
                placeholder="000000"
                value={query}
                onChange={e => setQuery(e.target.value)}
                disabled={loading}
                className="flex-1 bg-transparent py-2 pr-3 text-sm font-mono outline-none placeholder:text-muted-foreground/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
          ) : (
            <Input
              placeholder="Enter Acebet username..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1"
              disabled={loading}
            />
          )}
          <Button type="submit" disabled={loading || !query.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="ml-2">{loading ? 'Searching...' : 'Search'}</span>
          </Button>
        </form>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Multiple matches — pick one */}
        {allResults.length > 1 && !result && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{allResults.length} users matched — select one:</p>
            <div className="divide-y divide-border/30 rounded-lg border border-border/40 overflow-hidden">
              {allResults.map(u => (
                <button
                  key={u.userId}
                  onClick={() => { setResult(u); setAllResults([]) }}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-secondary/40 transition-colors text-left"
                >
                  <span className="font-medium">{u.name ?? `User #${u.userId}`}</span>
                  <span className="text-muted-foreground font-mono">ID: {u.userId}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Full result card */}
        {result && (
          <div className="space-y-4">
            {/* Identity header */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border/30">
              {result.avatar ? (
                <img
                  src={result.avatar}
                  alt={result.name ?? 'avatar'}
                  className="h-14 w-14 rounded-full border-2 border-border/40 object-cover"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border/40">
                  <User className="h-7 w-7 text-primary" />
                </div>
              )}
              <div className="space-y-1">
                <p className="text-lg font-bold">{result.name ?? '—'}</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.badge && (
                    <Badge variant="outline" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      {result.badge}
                    </Badge>
                  )}
                  {result.role && (
                    <Badge variant="secondary" className="text-xs">{result.role}</Badge>
                  )}
                  <Badge variant={result.active ? 'default' : 'outline'} className="text-xs">
                    {result.active ? 'Active' : 'Inactive'}
                  </Badge>
                  {result.isPrivate && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Private
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* All API fields */}
            <div className="rounded-xl border border-border/40 overflow-hidden">
              <div className="bg-secondary/20 px-4 py-2 border-b border-border/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Identity Fields</p>
              </div>
              <div className="px-4">
                <FieldRow label="userId" value={String(result.userId)} mono />
                <FieldRow label="name" value={result.name ?? <span className="text-muted-foreground italic">null</span>} />
                <FieldRow label="avatar" value={result.avatar
                  ? <a href={result.avatar} target="_blank" rel="noreferrer" className="text-primary underline text-xs break-all">{result.avatar}</a>
                  : <span className="text-muted-foreground italic">null</span>}
                />
                <FieldRow label="badge" value={result.badge ?? <span className="text-muted-foreground italic">null</span>} />
                <FieldRow label="role" value={result.role ?? <span className="text-muted-foreground italic">null</span>} />
                <FieldRow label="active" value={
                  <Badge variant={result.active ? 'default' : 'outline'} className="text-xs">
                    {String(result.active)}
                  </Badge>
                } />
                <FieldRow label="isPrivate" value={
                  <Badge variant="outline" className="text-xs">{String(result.isPrivate)}</Badge>
                } />
                <FieldRow label="premiumUntil" value={result.premiumUntil
                  ? new Date(result.premiumUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                  : <span className="text-muted-foreground italic">null</span>}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border/40 overflow-hidden">
              <div className="bg-secondary/20 px-4 py-2 border-b border-border/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Financial Fields (current period)</p>
              </div>
              <div className="px-4">
                <FieldRow label="wagered" value={<span className="text-green-500 font-bold">{fmt(result.wagered)}</span>} />
                <FieldRow label="deposited" value={fmt(result.deposited)} />
                <FieldRow label="earned" value={fmt(result.earned)} />
                <FieldRow label="xp" value={result.xp.toLocaleString()} />
              </div>
            </div>

            <div className="rounded-xl border border-border/40 overflow-hidden">
              <div className="bg-secondary/20 px-4 py-2 border-b border-border/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Period Metadata</p>
              </div>
              <div className="px-4">
                <FieldRow label="firstSeen (period start)" value={result.firstSeen} mono />
                <FieldRow label="lastSeen (period end)" value={result.lastSeen} mono />
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => { setResult(null); setSearched(false); setQuery('') }}
            >
              Clear
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
