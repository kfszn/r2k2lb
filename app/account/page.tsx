'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Copy, Check, ExternalLink, Zap, Loader2, Link2, Unlink, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'

type Profile = {
  id: string
  account_id: string
  email: string
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

function KickOAuthFeedback() {
  const searchParams = useSearchParams()
  const kickSuccess = searchParams.get('kick_success')
  const kickError = searchParams.get('kick_error')

  if (!kickSuccess && !kickError) return null

  return (
    <>
      {kickSuccess && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-sm text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Your Kick account was linked successfully.
        </div>
      )}
      {kickError && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Failed to link Kick account: {kickError.replace(/_/g, ' ')}
        </div>
      )}
    </>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading your profile...</div>
      </div>
    }>
      <AccountPageContent />
    </Suspense>
  )
}

function AccountPageContent() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // Acebet link state
  const [acebetInput, setAcebetInput] = useState('')
  const [acebetLoading, setAcebetLoading] = useState(false)
  const [acebetError, setAcebetError] = useState<string | null>(null)
  const [acebetSuccess, setAcebetSuccess] = useState<string | null>(null)

  // Unlink state
  const [unlinkLoading, setUnlinkLoading] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadProfile = async () => {
    const res = await fetch('/api/account/connections')
    if (!res.ok) {
      router.replace('/auth/login')
      return
    }
    const json = await res.json()
    setProfile(json.profile ?? null)
    setLoading(false)
  }

  useEffect(() => { loadProfile() }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const copyAccountId = () => {
    if (!profile?.account_id) return
    navigator.clipboard.writeText(profile.account_id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const linkAcebet = async () => {
    if (!acebetInput.trim()) return
    setAcebetLoading(true)
    setAcebetError(null)
    setAcebetSuccess(null)
    try {
      const suffix = acebetInput.trim().replace(/^AB-/i, '')
      const res = await fetch('/api/account/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acebet_id_suffix: suffix }),
      })
      const json = await res.json()
      if (!res.ok) {
        setAcebetError(json.error ?? 'Failed to link Acebet account.')
      } else {
        setAcebetSuccess(`Linked as ${json.acebet_id} (${json.acebet_username ?? 'username pending'})`)
        setAcebetInput('')
        await loadProfile()
      }
    } catch {
      setAcebetError('Network error. Please try again.')
    } finally {
      setAcebetLoading(false)
    }
  }

  const unlink = async (provider: string) => {
    setUnlinkLoading(provider)
    try {
      const res = await fetch('/api/account/connections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      })
      if (res.ok) await loadProfile()
    } finally {
      setUnlinkLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading your profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/40 bg-card/50">
          <CardHeader className="text-center">
            <CardTitle>Profile not found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-2xl space-y-6">

        {/* Kick OAuth feedback banners */}
        <Suspense fallback={null}>
          <KickOAuthFeedback />
        </Suspense>

        {/* Account ID */}
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Your Account ID</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold tracking-wider font-mono text-primary flex-1">
                {profile.account_id}
              </span>
              <button
                type="button"
                onClick={copyAccountId}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors border border-border/40 rounded-md px-3 py-1.5"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              This is your unique R2K2 account ID. Use it to link your Kick account and claim rewards.
            </p>
          </CardContent>
        </Card>

        {/* Points */}
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Points Balance</CardTitle>
            <Link href="/shop">
              <Button size="sm" variant="outline" className="text-xs bg-transparent h-7 px-3">Visit Shop</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-foreground">{profile.points.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Spend points in the Shop to redeem exclusive rewards</p>
          </CardContent>
        </Card>

        {/* Connections */}
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Connected Accounts</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/30">

            {/* ── Kick ───────────────────────────────────────────────── */}
            <div className="py-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image src="/assets/kick.png" alt="Kick" width={24} height={24} className="rounded" />
                  <div>
                    <p className="text-sm font-medium">Kick</p>
                    {profile.kick_username ? (
                      <p className="text-sm text-muted-foreground">@{profile.kick_username}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not linked</p>
                    )}
                  </div>
                </div>
                <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium border ${
                  profile.kick_id
                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                    : 'bg-muted text-muted-foreground border-border/40'
                }`}>
                  {profile.kick_id ? 'Linked' : 'Not linked'}
                </span>
              </div>

              {profile.kick_id ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5 flex-1"
                    onClick={() => router.push('/api/auth/kick?mode=link')}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Reconnect Kick
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive border-destructive/30"
                    disabled={unlinkLoading === 'kick'}
                    onClick={() => unlink('kick')}
                  >
                    {unlinkLoading === 'kick' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3 w-3" />}
                    Unlink
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5 w-full"
                  onClick={() => router.push('/api/auth/kick?mode=link')}
                >
                  <Link2 className="h-3 w-3" />
                  Connect Kick
                </Button>
              )}

              {/* Fallback chat verify if no Kick OAuth configured */}
              {!profile.kick_id && (
                <div className="bg-primary/5 border border-primary/20 rounded-md p-3 flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="space-y-1 text-xs">
                    <p className="text-muted-foreground">Or verify via Kick chat:</p>
                    <p className="font-mono bg-background/60 rounded px-2 py-1 text-foreground inline-block">
                      !verify {profile.account_id}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Acebet ─────────────────────────────────────────────── */}
            <div className="py-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">A</div>
                  <div>
                    <p className="text-sm font-medium">Acebet</p>
                    {profile.acebet_id ? (
                      <p className="text-sm text-muted-foreground">{profile.acebet_id} · {profile.acebet_username ?? 'username pending'}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not linked</p>
                    )}
                  </div>
                </div>
                <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium border ${
                  profile.acebet_id
                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                    : 'bg-muted text-muted-foreground border-border/40'
                }`}>
                  {profile.acebet_id ? 'Linked' : 'Not linked'}
                </span>
              </div>

              {acebetSuccess && (
                <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-md px-3 py-2">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  {acebetSuccess}
                </div>
              )}
              {acebetError && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {acebetError}
                </div>
              )}

              {!profile.acebet_id ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Enter your Acebet user ID (must have wagered under code R2K2):</p>
                  <div className="flex gap-2">
                    <div className="flex flex-1 items-center rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      <span className="pl-3 pr-1 text-sm font-mono font-semibold text-muted-foreground select-none">AB-</span>
                      <input
                        type="number"
                        min={1}
                        placeholder="000000"
                        value={acebetInput}
                        onChange={e => setAcebetInput(e.target.value)}
                        disabled={acebetLoading}
                        className="flex-1 bg-transparent py-2 pr-3 text-sm font-mono outline-none placeholder:text-muted-foreground/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        onKeyDown={e => { if (e.key === 'Enter') linkAcebet() }}
                      />
                    </div>
                    <Button
                      size="sm"
                      className="h-9 text-xs gap-1.5"
                      disabled={acebetLoading || !acebetInput.trim()}
                      onClick={linkAcebet}
                    >
                      {acebetLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                      {acebetLoading ? 'Linking...' : 'Link'}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive border-destructive/30"
                  disabled={unlinkLoading === 'acebet'}
                  onClick={() => unlink('acebet')}
                >
                  {unlinkLoading === 'acebet' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3 w-3" />}
                  Unlink Acebet
                </Button>
              )}
            </div>

            {/* ── Discord ────────────────────────────────────────────── */}
            <div className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-[#5865F2]/20 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#5865F2]">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.04.037.052a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Discord</p>
                    <p className="text-xs text-muted-foreground">Coming soon</p>
                  </div>
                </div>
                <span className="text-xs bg-muted text-muted-foreground border border-border/40 rounded-full px-2.5 py-0.5 font-medium">
                  Coming soon
                </span>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Account Info */}
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground">{profile.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Member since</span>
              <span className="text-foreground">{new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-between">
          <Link href="/">
            <Button variant="outline" className="bg-transparent">Back to Home</Button>
          </Link>
          <Button variant="ghost" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
            Sign Out
          </Button>
        </div>

      </main>
    </div>
  )
}
