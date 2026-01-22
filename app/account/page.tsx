'use client'

import React from "react"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { createBrowserClient } from '@supabase/ssr'
import Image from 'next/image'
import { Trophy, TrendingUp, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { Header } from '@/components/header'

interface UserClaim {
  id: string
  acebet_username: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  approved_at: string | null
  total_wagered: number
  total_rewards: number
}

export default function AccountPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [claim, setClaim] = useState<UserClaim | null>(null)
  const [newUsername, setNewUsername] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    setUser(user)
    await fetchClaim(user.id)
    setLoading(false)
  }

  async function fetchClaim(userId: string) {
    const { data, error } = await supabase
      .from('user_claims')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!error && data) {
      setClaim(data)
    }
  }

  async function handleClaimSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const { error } = await supabase
      .from('user_claims')
      .insert({
        user_id: user.id,
        acebet_username: newUsername,
        status: 'pending'
      })

    if (error) {
      setError(error.message)
      setSubmitting(false)
    } else {
      await fetchClaim(user.id)
      setNewUsername('')
      setSubmitting(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">
          {/* User Info */}
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Manage your R2K2 account and claim your leaderboard username</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Claim Status or Form */}
          {claim ? (
            <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Acebet Username Claim</CardTitle>
                    <CardDescription>Your claimed username: {claim.acebet_username}</CardDescription>
                  </div>
                  <StatusBadge status={claim.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {claim.status === 'pending' && (
                  <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Pending Admin Approval</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your claim is being reviewed. You'll be notified once it's approved.
                      </p>
                    </div>
                  </div>
                )}

                {claim.status === 'approved' && (
                  <>
                    <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Claim Approved!</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Your account is now linked to your Acebet username.
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="border-border/40 bg-secondary/30">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-primary/20">
                              <TrendingUp className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total Wagered</p>
                              <p className="text-2xl font-bold">${claim.total_wagered.toLocaleString()}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-border/40 bg-secondary/30">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-primary/20">
                              <Trophy className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total Rewards</p>
                              <p className="text-2xl font-bold">${claim.total_rewards.toLocaleString()}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}

                {claim.status === 'rejected' && (
                  <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <p className="font-medium">Claim Rejected</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your claim was not approved. Please contact support for more information.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Claim Your Acebet Username</CardTitle>
                <CardDescription>
                  Link your Acebet account to view your stats and track your progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleClaimSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="username">Your Acebet Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your exact Acebet username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      required
                      disabled={submitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be manually reviewed and approved by an admin.
                    </p>
                  </div>

                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Claim'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const variants = {
    pending: { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    approved: { label: 'Approved', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
    rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  }

  const variant = variants[status]

  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  )
}
