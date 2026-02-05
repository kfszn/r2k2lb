'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { generatePageMetadata } from '@/lib/seo-metadata'

export const metadata: Metadata = generatePageMetadata('account')

export default function AccountPage() {
  const [loading] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Account Management Coming Soon</CardTitle>
            <CardDescription>We're working on account features and will have them ready soon!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              For now, all leaderboards and rewards are publicly viewable. Account features will be available soon.
            </p>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
