'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Users2, Loader2, Unlink, Plus, PlayCircle, CheckCircle2, AlertTriangle } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface AdminUser {
  id: string
  email: string
  account_id: string
  roobet_username: string | null
  luxdrop_username: string | null
}

interface ReferralLink {
  id: string
  referrer_profile_id: string
  referred_profile_id: string
  notes: string | null
  created_at: string
  referrer: { email: string; account_id: string; roobet_username: string | null; luxdrop_username: string | null } | null
  referred: { email: string; account_id: string; roobet_username: string | null; luxdrop_username: string | null } | null
}

interface FinalizeResult {
  created: { referrer: string; platform: string; amount: number }[]
  skipped: { referrer: string; platform: string; reason: string }[]
}

function playerLabel(u: { email: string; account_id: string; roobet_username: string | null; luxdrop_username: string | null } | null) {
  if (!u) return 'Unknown player'
  const usernames = [u.roobet_username && `Roobet: ${u.roobet_username}`, u.luxdrop_username && `LuxDrop: ${u.luxdrop_username}`]
    .filter(Boolean)
    .join(' · ')
  return usernames ? `${u.email} (${usernames})` : u.email
}

export function ReferralsManager() {
  const { data, mutate } = useSWR<{ referrals: ReferralLink[] }>('/api/admin/referrals', fetcher)
  const { data: usersData } = useSWR<{ users: AdminUser[] }>('/api/admin/users', fetcher)
  const links = data?.referrals ?? []
  const users = usersData?.users ?? []

  const [referrerId, setReferrerId] = useState<string>('')
  const [referredId, setReferredId] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unlinking, setUnlinking] = useState<string | null>(null)

  const [finalizing, setFinalizing] = useState(false)
  const [finalizeResult, setFinalizeResult] = useState<FinalizeResult | null>(null)
  const [finalizeError, setFinalizeError] = useState<string | null>(null)

  const alreadyReferredIds = useMemo(() => new Set(links.map((l) => l.referred_profile_id)), [links])

  const userOptions = useMemo(
    () =>
      users
        .filter((u) => u.roobet_username || u.luxdrop_username)
        .map((u) => ({ id: u.id, label: playerLabel(u) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [users],
  )

  const handleLink = async () => {
    if (!referrerId || !referredId) {
      setError('Select both a referrer and a referred player.')
      return
    }
    if (referrerId === referredId) {
      setError('A player cannot refer themselves.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referrer_profile_id: referrerId, referred_profile_id: referredId, notes: notes.trim() || null }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to link referral')
      mutate()
      setReferrerId('')
      setReferredId('')
      setNotes('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to link referral')
    } finally {
      setSaving(false)
    }
  }

  const handleUnlink = async (id: string) => {
    setUnlinking(id)
    try {
      await fetch('/api/admin/referrals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      mutate()
    } finally {
      setUnlinking(null)
    }
  }

  const handleFinalize = async () => {
    setFinalizing(true)
    setFinalizeError(null)
    setFinalizeResult(null)
    try {
      const res = await fetch('/api/admin/referrals/finalize', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Finalize failed')
      setFinalizeResult(json)
    } catch (err: unknown) {
      setFinalizeError(err instanceof Error ? err.message : 'Finalize failed')
    } finally {
      setFinalizing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users2 className="h-5 w-5 text-primary" />
            Referral Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-xl border border-border/50 bg-muted/20 p-5 space-y-4">
            <p className="font-semibold text-sm">Link a Referral</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Referrer (earns 5%)</Label>
                <Select value={referrerId || undefined} onValueChange={setReferrerId}>
                  <SelectTrigger><SelectValue placeholder="Select referrer" /></SelectTrigger>
                  <SelectContent>
                    {userOptions.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Referred Player</Label>
                <Select value={referredId || undefined} onValueChange={setReferredId}>
                  <SelectTrigger><SelectValue placeholder="Select referred player" /></SelectTrigger>
                  <SelectContent>
                    {userOptions.map((o) => (
                      <SelectItem key={o.id} value={o.id} disabled={alreadyReferredIds.has(o.id)}>
                        {o.label}{alreadyReferredIds.has(o.id) ? ' (already linked)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Input placeholder="e.g. Found via Discord" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button size="sm" onClick={handleLink} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Plus className="h-4 w-4 mr-1.5" />}
              Link Referral
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Links ({links.length})</p>
            {links.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No referrals linked yet.</p>
            ) : (
              <div className="space-y-2">
                {links.map((link) => (
                  <div key={link.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-muted/20 p-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="secondary" className="text-xs">Referrer</Badge>
                        <span className="truncate">{playerLabel(link.referrer)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="text-xs">Referred</Badge>
                        <span className="truncate">{playerLabel(link.referred)}</span>
                      </div>
                      {link.notes && <p className="text-xs text-muted-foreground italic">{link.notes}</p>}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 text-destructive hover:text-destructive border-destructive/30 shrink-0"
                      disabled={unlinking === link.id}
                      onClick={() => handleUnlink(link.id)}
                    >
                      {unlinking === link.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3 w-3" />}
                      Unlink
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" />
            This Month&apos;s Payouts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Computes 5% of each referred player&apos;s claimed wager-milestone rewards this calendar month, capped at $200 per referred
            player per platform, and posts it as a pending referral claim under the referrer&apos;s linked username. Safe to re-run — it
            tops up rather than double-paying.
          </p>
          <Button size="sm" onClick={handleFinalize} disabled={finalizing}>
            {finalizing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-1.5" />}
            Post Referral Payouts
          </Button>

          {finalizeError && <p className="text-xs text-destructive">{finalizeError}</p>}

          {finalizeResult && (
            <div className="space-y-3">
              {finalizeResult.created.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Created ({finalizeResult.created.length})
                  </p>
                  {finalizeResult.created.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                      <span>{c.referrer} — {c.platform}</span>
                      <span className="font-mono font-semibold text-emerald-400">${c.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              {finalizeResult.skipped.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-yellow-500 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Skipped ({finalizeResult.skipped.length})
                  </p>
                  {finalizeResult.skipped.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs rounded-lg border border-border/40 bg-muted/10 px-3 py-2 text-muted-foreground">
                      <span>{s.referrer} — {s.platform}</span>
                      <span>{s.reason}</span>
                    </div>
                  ))}
                </div>
              )}
              {finalizeResult.created.length === 0 && finalizeResult.skipped.length === 0 && (
                <p className="text-xs text-muted-foreground">No referral links to process.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
