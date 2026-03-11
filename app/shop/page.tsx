'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import useSWR from 'swr'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ShoppingBag, Zap, Loader2, Check, Lock } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type ShopItem = {
  id: number
  name: string
  description: string | null
  points_cost: number
  active: boolean
}

type Profile = {
  id: string
  account_id: string
  kick_username: string | null
  points: number
  manual_award_balance?: number
  manual_award_wagered?: number
}

export default function ShopPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null)
  const [redeeming, setRedeeming] = useState(false)
  const [successOrder, setSuccessOrder] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: shopData } = useSWR<{ items: ShopItem[] }>('/api/shop', fetcher)
  const items = shopData?.items ?? []

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoadingProfile(false)
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('id, account_id, kick_username, points, manual_award_balance, manual_award_wagered')
        .eq('id', session.user.id)
        .maybeSingle()
      setProfile(data ?? null)
      setLoadingProfile(false)
    }
    load()
  }, [])

  const handleRedeem = async () => {
    if (!selectedItem || !profile) return
    setRedeeming(true)
    setError(null)
    try {
      const res = await fetch('/api/shop/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profile.id, shop_item_id: selectedItem.id }),
      })
      const json = await res.json()
      if (!res.ok) {
        if (json.error === 'insufficient_points') {
          setError(`You need ${selectedItem.points_cost.toLocaleString()} points but only have ${profile.points.toLocaleString()}.`)
        } else if (json.error === 'redemption_cooldown') {
          setError('You can only redeem once every 30 days. Please check back later.')
        } else if (json.error === 'playthrough_required') {
          setError(`You must wager ${json.playthrough_remaining?.toLocaleString()} more points before you can redeem. Complete 1x play-through on your bonus points!`)
        } else {
          setError('Something went wrong. Please try again.')
        }
        setSelectedItem(null)
        return
      }
      setProfile(p => p ? { ...p, points: json.new_balance } : p)
      setSuccessOrder(json.order_id)
      setSelectedItem(null)
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-10 space-y-2">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold">Rewards Shop</h1>
          </div>
          <p className="text-muted-foreground">
            Spend your points on exclusive rewards. Earn points by watching the stream and chatting on Kick.
          </p>
        </div>

        {/* Points balance */}
        {!loadingProfile && (
          <div className="mb-8">
            {profile ? (
              <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-lg px-5 py-4">
                <Zap className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Your balance</p>
                  <p className="text-2xl font-bold text-foreground">{profile.points.toLocaleString()} <span className="text-base font-normal text-muted-foreground">points</span></p>
                </div>
                {!profile.kick_username && (
                  <div className="ml-auto text-right">
                    <p className="text-xs text-muted-foreground">Link your Kick account to earn points</p>
                    <p className="font-mono text-xs bg-background/60 rounded px-2 py-1 mt-1">!verify {profile.account_id}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-muted/50 border border-border/40 rounded-lg px-5 py-4">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Sign in to redeem rewards</p>
                  <p className="text-xs text-muted-foreground">Create a free account to start earning and spending points.</p>
                </div>
                <Button size="sm" className="ml-auto" onClick={() => router.push('/auth/login')}>
                  Sign In
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Success banner */}
        {successOrder && (
          <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-lg px-5 py-4 flex items-center gap-3">
            <Check className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-semibold text-green-500">Redemption submitted!</p>
              <p className="text-xs text-muted-foreground">Order ID: <span className="font-mono">{successOrder}</span>. R2K2 will contact you shortly.</p>
            </div>
            <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => setSuccessOrder(null)}>
              <span className="text-xs">Dismiss</span>
            </button>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg px-5 py-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Shop items grid */}
        {items.length === 0 && !shopData ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No items available right now. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map(item => {
              const canAfford = profile && profile.points >= item.points_cost
              return (
                <Card
                  key={item.id}
                  className={`border-border/40 bg-card/50 backdrop-blur-sm flex flex-col transition-shadow ${
                    canAfford ? 'hover:shadow-lg hover:shadow-primary/10' : ''
                  }`}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    {item.description && (
                      <CardDescription>{item.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-xl font-bold text-primary">{item.points_cost.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground">points</span>
                    </div>

                    {profile ? (
                      <Button
                        className="w-full"
                        disabled={!canAfford}
                        onClick={() => setSelectedItem(item)}
                      >
                        {canAfford ? 'Redeem' : 'Not enough points'}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push('/auth/login')}
                      >
                        Sign in to redeem
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* Confirm dialog */}
      <AlertDialog open={!!selectedItem} onOpenChange={open => { if (!open && !redeeming) setSelectedItem(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Redemption</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to redeem <strong>{selectedItem?.name}</strong> for{' '}
              <strong>{selectedItem?.points_cost.toLocaleString()} points</strong>?
              {profile && (
                <span className="block mt-1 text-xs text-muted-foreground">
                  Your balance after: {((profile.points || 0) - (selectedItem?.points_cost || 0)).toLocaleString()} points
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={redeeming}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRedeem} disabled={redeeming}>
              {redeeming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {redeeming ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
