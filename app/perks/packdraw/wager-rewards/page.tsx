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
        <div className="max-w-2xl mx-auto">
          {/* Message Section */}
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <AlertCircle className="h-8 w-8 text-amber-500" />
                <h1 className="text-4xl font-bold">
                  Wager Bonuses
                </h1>
                <AlertCircle className="h-8 w-8 text-amber-500" />
              </div>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Wager bonuses are no longer available as I have activated 100% affiliate earnings back to your accounts!
              </p>
            </div>

            {/* CTA Section */}
            <div className="pt-8 flex flex-col gap-4">
              <Link href="/">
                <Button size="lg" className="w-full">
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
