'use client'

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { GiveawayCounter } from '@/components/giveaway-counter';
import { AlertCircle } from 'lucide-react';

export default function WagerRewardsPage() {
  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-xl mx-auto">
          {/* Message Section */}
          <div className="text-center space-y-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 md:p-10">
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="h-8 w-8 text-amber-500" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">
                Wager Bonuses
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Wager bonuses are no longer available as I have activated 100% affiliate earnings back to your accounts!
              </p>
            </div>

            {/* CTA Section */}
            <div className="pt-4">
              <Link href="/">
                <Button size="lg">
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
