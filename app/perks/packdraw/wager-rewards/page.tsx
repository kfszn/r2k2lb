'use client'

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { GiveawayCounter } from '@/components/giveaway-counter';
import { Crown, TrendingUp, Zap } from 'lucide-react';
import { useRef } from 'react';

const wagerTiers = [
  { id: 1, name: 'Bronze', wager: 5000, reward: 25, nameColor: 'text-amber-600', starBg: 'bg-amber-600', borderColor: 'border-amber-600/20' },
  { id: 2, name: 'Silver', wager: 10000, reward: 50, nameColor: 'text-slate-400', starBg: 'bg-slate-400', borderColor: 'border-slate-400/20' },
  { id: 3, name: 'Gold', wager: 20000, reward: 100, nameColor: 'text-yellow-500', starBg: 'bg-yellow-500', borderColor: 'border-yellow-500/20' },
  { id: 4, name: 'Emerald', wager: 30000, reward: 150, nameColor: 'text-emerald-500', starBg: 'bg-emerald-500', borderColor: 'border-emerald-500/20' },
  { id: 5, name: 'Sapphire', wager: 40000, reward: 200, nameColor: 'text-blue-500', starBg: 'bg-blue-500', borderColor: 'border-blue-500/20' },
  { id: 6, name: 'Ruby', wager: 60000, reward: 300, nameColor: 'text-red-500', starBg: 'bg-red-500', borderColor: 'border-red-500/20' },
  { id: 7, name: 'Platinum', wager: 80000, reward: 400, nameColor: 'text-slate-300', starBg: 'bg-slate-300', borderColor: 'border-slate-300/20' },
  { id: 8, name: 'Diamond', wager: 100000, reward: 500, nameColor: 'text-cyan-400', starBg: 'bg-cyan-400', borderColor: 'border-cyan-400/20' },
];

const vipTier = {
  name: 'VIP Elite',
  wager: '100K+',
  reward: 'Custom',
  description: 'Exclusive rewards & benefits',
  nameColor: 'text-purple-500',
  starBg: 'bg-purple-500',
  borderColor: 'border-purple-500/20',
};

export default function WagerRewardsPage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const formatWager = (wager: number) => {
    return `$${wager.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary animate-pulse" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Wager Rewards
              </h1>
              <TrendingUp className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <p className="text-lg text-muted-foreground">
              Climb the tiers and unlock exclusive monthly rewards based on your wager volume
            </p>
            <div className="inline-flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Monthly Reset • Real-Time Tracking</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/50 border border-border/50 rounded-full">
                <span className="text-sm font-semibold text-foreground">
                  ⭐ Rewards are stackable with all previous tiers you've reached
                </span>
              </div>
            </div>
          </div>

          {/* Tier Cards Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Tier Progression</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => scroll('left')}
                  className="p-2 hover:bg-primary/20 rounded-lg transition-colors border border-border/50"
                >
                  ←
                </button>
                <button
                  onClick={() => scroll('right')}
                  className="p-2 hover:bg-primary/20 rounded-lg transition-colors border border-border/50"
                >
                  →
                </button>
              </div>
            </div>

            {/* Scrollable Tier Cards */}
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
            >
              {wagerTiers.map((tier) => (
                <div key={tier.id} className="flex-shrink-0 w-64">
                  <div className="h-full rounded-lg border border-border bg-card hover:bg-card/80 transition-all duration-300 overflow-hidden group cursor-pointer">
                    {/* Badge Header */}
                    <div className="p-4 flex flex-col items-center justify-center space-y-3">
                      <div className={`w-20 h-20 ${tier.starBg} rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <span className="text-2xl font-bold text-white">⭐</span>
                      </div>
                      <h3 className={`text-xl font-bold ${tier.nameColor}`}>{tier.name}</h3>
                    </div>

                    {/* Tier Details */}
                    <div className="px-4 py-6 space-y-4">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Monthly Wager</p>
                        <p className="text-2xl font-bold text-foreground">
                          {formatWager(tier.wager)}
                        </p>
                      </div>

                      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Monthly Reward</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-foreground">${tier.reward}</span>
                          <span className="text-xs text-muted-foreground">cash</span>
                        </div>
                      </div>

                      <div className="pt-2 text-xs text-muted-foreground">
                        ✓ No rollover • ✓ Monthly reset • ✓ Claim via Discord
                      </div>

                      {/* Discord Link & Claim Button */}
                      <div className="pt-4 space-y-2 border-t border-border/30">
                        <Link href="https://discord.gg/packdraw" target="_blank" rel="noopener noreferrer">
                          <Button className="w-full gap-2 bg-primary hover:bg-primary/90">
                            <span>💬</span>
                            Claim Now
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* VIP Tier */}
              <div className="flex-shrink-0 w-64">
                <div className="h-full rounded-lg border border-border bg-card hover:bg-card/80 transition-all duration-300 overflow-hidden group cursor-pointer">
                  {/* VIP Badge */}
                  <div className="p-4 flex flex-col items-center justify-center space-y-3">
                    <div className={`w-20 h-20 ${vipTier.starBg} rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Crown className="w-10 h-10 text-white" />
                    </div>
                    <h3 className={`text-xl font-bold ${vipTier.nameColor}`}>{vipTier.name}</h3>
                  </div>

                  {/* VIP Details */}
                  <div className="px-4 py-6 space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Minimum Wager</p>
                      <p className="text-2xl font-bold text-foreground">{vipTier.wager}</p>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Exclusive Rewards</p>
                      <p className="text-xl font-bold text-foreground">
                        {vipTier.reward}
                      </p>
                      <p className="text-xs text-muted-foreground">{vipTier.description}</p>
                    </div>

                    <div className="pt-2">
                      <Link href="https://discord.gg/packdraw" target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="w-full gap-2">
                          <span>💬</span>
                          Claim Rewards
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>How Wager Rewards Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-bold">
                      1
                    </span>
                    Monthly Cycle
                  </h3>
                  <p className="text-sm text-muted-foreground ml-8">
                    Your wager is tracked continuously throughout each calendar month. The reset happens on the 1st of each month.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-bold">
                      2
                    </span>
                    Automatic Calculation
                  </h3>
                  <p className="text-sm text-muted-foreground ml-8">
                    Your tier is automatically determined based on your total wager amount for the month. Reach a threshold and instantly unlock the corresponding tier reward.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-bold">
                      3
                    </span>
                    Claim Your Reward
                  </h3>
                  <p className="text-sm text-muted-foreground ml-8">
                    Once you reach a tier threshold, submit a ticket in our Discord server to claim your reward. Our team will verify and process your claim.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-bold">
                      4
                    </span>
                    Stacking Benefits
                  </h3>
                  <p className="text-sm text-muted-foreground ml-8">
                    Higher tiers come with exclusive perks: priority support, cashback events, and invitations to VIP tournaments.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Important Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Wager Tracking</h4>
                <p className="text-muted-foreground">
                  All wagers placed on eligible games contribute to your monthly tier. Only active bets count toward the total.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Tier Retention</h4>
                <p className="text-muted-foreground">
                  Tier status resets monthly on the 1st. You must meet the wager threshold each month to maintain or advance your tier.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Claiming Your Reward</h4>
                <p className="text-muted-foreground">
                  Rewards must be claimed via Discord ticket in our support server. Submit your claim with proof of your wager milestone, and our team will process it within 24-48 hours.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Reward Withdrawal</h4>
                <p className="text-muted-foreground">
                  Once approved, rewards are credited to your account as cash and can be withdrawn immediately without any additional requirements.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Fraud Prevention</h4>
                <p className="text-muted-foreground">
                  Management reserves the right to investigate and forfeit rewards in cases of abuse, collusion, or exploitative behavior.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <div className="text-center space-y-6 py-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Ready to Start Earning?</h2>
              <p className="text-lg text-muted-foreground">
                Start wagering today and climb the tiers to unlock exclusive monthly rewards
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="https://packdraw.com?ref=R2K2" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  <TrendingUp className="h-5 w-5" />
                  Start Playing Now
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
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
