'use client'

import React, { Suspense } from "react"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBrowserClient } from '@supabase/ssr'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

function LoginPageContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  // Show feedback from Kick OAuth redirect
  React.useEffect(() => {
    const kickError = searchParams.get('kick_error')
    const kickUser = searchParams.get('kick_user')
    if (kickError === 'login_failed' && kickUser) {
      setError(`No account found linked to Kick user "${kickUser}". Please log in with email and link your Kick account from Account Settings.`)
    } else if (kickError) {
      setError(`Kick login failed (${kickError}). Please try again or use email/password.`)
    }
  }, [searchParams])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      } else if (data?.user) {
        // Do a hard redirect to force page reload and session detection
        window.location.href = '/'
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please try again.')
      setLoading(false)
    }
  }

  const handleDiscordLogin = async () => {
    setLoading(true)
    setError('')
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      } else if (!data?.url) {
        setError('Discord login is not configured. Please use email/password login or contact support.')
        setLoading(false)
      }
    } catch (err) {
      setError('Discord login failed. Please try email/password login instead.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/40 bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Image src="/assets/logo.png" alt="R2K2" width={64} height={64} className="rounded-lg" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to claim your R2K2.GG account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
              <div className="font-semibold">Login failed</div>
              <div>{error}</div>
              {error.includes('Invalid') && (
                <div className="mt-2 text-xs">Tip: Make sure your email and password are correct. If you don't have an account yet, please sign up first.</div>
              )}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or continue with</span>
            </div>
          </div>

          <a href="/api/auth/kick?mode=login" className="block">
            <Button type="button" variant="outline" className="w-full gap-2 border-[#53FC18]/30 hover:border-[#53FC18]/60 hover:bg-[#53FC18]/5" disabled={loading}>
              {/* Kick logo from theSVG.org — please review kick.com trademark guidelines */}
              <img
                src="https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/kick/default.svg"
                alt="Kick"
                width={18}
                height={18}
                className="shrink-0"
              />
              Sign in with Kick
            </Button>
          </a>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">{"Don't have an account? "}</span>
            <Link href="/auth/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>

          <div className="text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}
