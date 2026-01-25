'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy } from 'lucide-react'
import { Header } from '@/components/header'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { ArrowLeft } from 'lucide-react'

export default function ClashLeaderboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4">
        <GiveawayCounter />
      </div>
      <Header />
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background"></div>
        <div className="container mx-auto px-4 py-12 relative">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="flex justify-center mb-6">
              <img src="/assets/clash.png" alt="Clash.gg" className="h-24 w-auto object-contain" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-balance">
              Clash.gg Leaderboard
            </h1>
            
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/20 border border-primary/40">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="text-2xl font-bold text-primary">Coming Soon</span>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon Message */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-12 text-center space-y-6">
                <Trophy className="h-20 w-20 text-primary/40 mx-auto" />
                
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-foreground">Stay Tuned!</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    The Clash.gg leaderboard is coming soon. Join our Discord community for the latest updates and announcements.
                  </p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <a 
                    href="https://clash.gg/r/R2K2" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button size="lg">
                      Join Clash.gg
                    </Button>
                  </a>
                  <a 
                    href="https://discord.gg/r2ktwo" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button size="lg" variant="outline" className="gap-2 bg-transparent">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.077.077 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                      Join Discord
                    </Button>
                  </a>
                </div>

                <div className="pt-8 space-y-2">
                  <p className="text-sm text-muted-foreground">In the meantime, check out:</p>
                  <div className="flex gap-3 justify-center">
                    <Link href="/leaderboard/acebet">
                      <Button variant="outline" size="sm" className="bg-transparent">
                        Acebet Leaderboard
                      </Button>
                    </Link>
                    <Link href="/leaderboard/packdraw">
                      <Button variant="outline" size="sm" className="bg-transparent">
                        Packdraw Leaderboard
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2026 R2K2. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
