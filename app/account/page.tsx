'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Copy, Check, ExternalLink, Zap } from 'lucide-react'

type Profile = {
  account_id: string
  email: string
  kick_username: string | null
  acebet_username: string | null
  points: number
  created_at: string
}

export default function AccountPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/auth/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('account_id, email, kick_username, acebet_username, points, created_at')
        .eq('id', session.user.id)
        .maybeSingle()

      setProfile(data ?? null)
      setLoading(false)
    }

    load()
  }, [])

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
            <CardDescription>Something went wrong loading your profile.</CardDescription>
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

        {/* Kick Verification Banner */}
        {!profile.kick_username && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-start gap-3">
            <Zap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Link your Kick account to earn points</p>
              <p className="text-sm text-muted-foreground">
                Type the following in R2K2&apos;s Kick chat:
              </p>
              <p className="font-mono bg-background/60 rounded px-3 py-1.5 text-sm text-foreground inline-block">
                !verify {profile.account_id}
              </p>
            </div>
          </div>
        )}

        {/* Points */}
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Points Balance</CardTitle>
            <Link href="/shop">
              <Button size="sm" variant="outline" className="text-xs bg-transparent h-7 px-3">
                Visit Shop
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-foreground">{profile.points.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Spend points in the Shop to redeem exclusive rewards</p>
          </CardContent>
        </Card>

        {/* Linked Accounts */}
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Linked Accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Kick */}
            <div className="flex items-center justify-between py-3 border-b border-border/30">
              <div className="flex items-center gap-3">
                <Image src="/assets/kick.png" alt="Kick" width={24} height={24} className="rounded" />
                <div>
                  <p className="text-sm font-medium">Kick</p>
                  {profile.kick_username ? (
                    <p className="text-sm text-muted-foreground">@{profile.kick_username}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not linked yet</p>
                  )}
                </div>
              </div>
              {profile.kick_username ? (
                <span className="text-xs bg-green-500/10 text-green-500 border border-green-500/20 rounded-full px-2.5 py-0.5 font-medium">Linked</span>
              ) : (
                <span className="text-xs bg-muted text-muted-foreground border border-border/40 rounded-full px-2.5 py-0.5 font-medium">Not linked</span>
              )}
            </div>

            {/* AceBet */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">A</div>
                <div>
                  <p className="text-sm font-medium">AceBet</p>
                  {profile.acebet_username ? (
                    <p className="text-sm text-muted-foreground">{profile.acebet_username}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not linked yet</p>
                  )}
                </div>
              </div>
              {profile.acebet_username ? (
                <span className="text-xs bg-green-500/10 text-green-500 border border-green-500/20 rounded-full px-2.5 py-0.5 font-medium">Linked</span>
              ) : (
                <span className="text-xs bg-muted text-muted-foreground border border-border/40 rounded-full px-2.5 py-0.5 font-medium">Not linked</span>
              )}
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
