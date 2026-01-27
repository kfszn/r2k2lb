'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { GiveawayCounter } from '@/components/giveaway-counter';
import { Crown, TrendingUp, Zap } from 'lucide-react';
import { useRef } from 'react';

const wagerTiers = [
  { id: 1, name: 'Bronze', wager: 5000, reward: 25, color: 'from-amber-700 to-amber-600', textColor: 'text-amber-500', borderColor: 'border-amber-500/30', badgeColor: 'bg-gradient-to-br from-amber-600 to-amber-700' },
  { id: 2, name: 'Silver', wager: 10000, reward: 50, color: 'from-slate-400 to-slate-300', textColor: 'text-slate-400', borderColor: 'border-slate-400/30', badgeColor: 'bg-gradient-to-br from-slate-400 to-slate-500' },
  { id: 3, name: 'Gold', wager: 20000, reward: 100, color: 'from-yellow-500 to-yellow-400', textColor: 'text-yellow-400', borderColor: 'border-yellow-400/30', badgeColor: 'bg-gradient-to-br from-yellow-400 to-yellow-500' },
  { id: 4, name: 'Emerald', wager: 30000, reward: 150, color: 'from-emerald-500 to-emerald-400', textColor: 'text-emerald-400', borderColor: 'border-emerald-400/30', badgeColor: 'bg-gradient-to-br from-emerald-400 to-emerald-500' },
  { id: 5, name: 'Sapphire', wager: 40000, reward: 200, color: 'from-blue-500 to-blue-400', textColor: 'text-blue-400', borderColor: 'border-blue-400/30', badgeColor: 'bg-gradient-to-br from-blue-400 to-blue-500' },
  { id: 6, name: 'Ruby', wager: 60000, reward: 300, color: 'from-red-500 to-red-400', textColor: 'text-red-400', borderColor: 'border-red-400/30', badgeColor: 'bg-gradient-to-br from-red-400 to-red-500' },
  { id: 7, name: 'Platinum', wager: 80000, reward: 400, color: 'from-gray-300 to-gray-200', textColor: 'text-gray-300', borderColor: 'border-gray-300/30', badgeColor: 'bg-gradient-to-br from-gray-300 to-gray-400' },
  { id: 8, name: 'Diamond', wager: 100000, reward: 500, color: 'from-cyan-300 to-blue-300', textColor: 'text-cyan-300', borderColor: 'border-cyan-300/30', badgeColor: 'bg-gradient-to-br from-cyan-300 to-blue-300' },
];

const vipTier = {
  name: 'VIP Elite',
  wager: '100K+',
  reward: 'Custom',
  description: 'Exclusive rewards & benefits',
  color: 'from-purple-600 via-purple-500 to-pink-500',
  textColor: 'text-purple-400',
  borderColor: 'border-purple-500/50',
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Monthly Reset • Real-Time Tracking</span>
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
                  <div
                    className={`h-full rounded-lg border ${tier.borderColor} bg-gradient-to-br ${tier.color} bg-opacity-10 hover:bg-opacity-20 transition-all duration-300 overflow-hidden group cursor-pointer`}
                  >
                    {/* Badge Header */}
                    <div className="p-4 flex flex-col items-center justify-center space-y-3 bg-gradient-to-b from-card/50 to-transparent">
                      <div
                        className={`w-20 h-20 ${tier.badgeColor} rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                      >
                        <span className="text-2xl font-bold text-white">⭐</span>
                      </div>
                      <h3 className={`text-xl font-bold ${tier.textColor}`}>{tier.name}</h3>
                    </div>

                    {/* Tier Details */}
                    <div className="px-4 py-6 space-y-4">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Monthly Wager</p>
                        <p className={`text-2xl font-bold ${tier.textColor}`}>
                          {formatWager(tier.wager)}
                        </p>
                      </div>

                      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Monthly Reward</p>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-3xl font-bold ${tier.textColor}`}>${tier.reward}</span>
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
                <div
                  className={`h-full rounded-lg border ${vipTier.borderColor} bg-gradient-to-br ${vipTier.color} bg-opacity-20 hover:bg-opacity-30 transition-all duration-300 overflow-hidden group cursor-pointer`}
                >
                  {/* VIP Badge */}
                  <div className="p-4 flex flex-col items-center justify-center space-y-3 bg-gradient-to-b from-card/50 to-transparent">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Crown className="w-10 h-10 text-white" />
                    </div>
                    <h3 className={`text-xl font-bold ${vipTier.textColor}`}>{vipTier.name}</h3>
                  </div>

                  {/* VIP Details */}
                  <div className="px-4 py-6 space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Minimum Wager</p>
                      <p className={`text-2xl font-bold ${vipTier.textColor}`}>{vipTier.wager}</p>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Exclusive Rewards</p>
                      <p className="text-xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
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
              <Link href="https://packdraw.gg" target="_blank" rel="noopener noreferrer">
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
