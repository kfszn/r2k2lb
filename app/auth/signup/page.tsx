import type { Metadata } from 'next'
import React from "react"

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

export const metadata: Metadata = {
  title: 'Sign Up | R2K2',
  description: 'Create your R2K2 account to start competing for exclusive rewards and leaderboard prizes.',
  openGraph: {
    title: 'Sign Up | R2K2',
    description: 'Join R2K2 and start competing',
  },
}

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data?.user && data?.user?.identities?.length === 0) {
      // User already exists but hasn't verified email
      setError('This email is already registered but not verified. Please check your email (including spam folder) for the verification link, or contact support if you need help.')
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  const handleDiscordSignUp = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/account`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleResendEmail = async () => {
    setResending(true)
    setResendSuccess(false)
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setResendSuccess(true)
    }
    setResending(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image src="/assets/logo.png" alt="R2K2" width={64} height={64} className="rounded-lg" />
            </div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <CardDescription>
              We sent a confirmation link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the link in the email to confirm your account and start claiming your leaderboard username.
            </p>
            
            {resendSuccess && (
              <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-lg text-sm">
                Email resent successfully! Check your inbox.
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                className="bg-transparent"
                onClick={handleResendEmail}
                disabled={resending}
              >
                {resending ? 'Resending...' : 'Resend Email'}
              </Button>
              <Link href="/auth/login">
                <Button variant="ghost" className="w-full">Go to Login</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/40 bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Image src="/assets/logo.png" alt="R2K2" width={64} height={64} className="rounded-lg" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>Sign up to claim your leaderboard account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="space-y-3">
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
              {error.includes('already registered but not verified') && (
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full bg-transparent"
                  onClick={handleResendEmail}
                  disabled={resending}
                >
                  {resending ? 'Resending...' : 'Resend Verification Email'}
                </Button>
              )}
              {resendSuccess && (
                <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-lg text-sm">
                  Verification email resent! Check your inbox and spam folder.
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
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
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
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
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>

          <div className="text-center">
            <Link href="/home" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
