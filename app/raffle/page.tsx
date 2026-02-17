'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GiveawayCounter } from '@/components/giveaway-counter';
import { Header } from '@/components/header';
import { CountdownTimer } from '@/components/raffle/countdown-timer';
import { Trophy, Users, DollarSign, Clock, Ticket, Star } from 'lucide-react';

function maskName(name: string): string {
  if (!name) return '***';
  if (name.length <= 4) return name[0] + '*'.repeat(name.length - 1);
  return name.substring(0, 2) + '*'.repeat(name.length - 3) + name.substring(name.length - 1);
}

interface RaffleConfig {
  min_wager: number;
  prize_amount: number;
  max_entries: number;
  start_date: string;
  end_date: string;
}

interface EligibleUser {
  username: string;
  wager_amount: number;
}

interface Winner {
  id: string;
  username: string;
  prize_amount: number;
  won_date: string;
  raffle_type: string;
}

function RaffleTab({ platform }: { platform: 'acebet' | 'packdraw' }) {
  const [config, setConfig] = useState<RaffleConfig | null>(null);
  const [eligible, setEligible] = useState<EligibleUser[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const configRes = await fetch(`/api/raffle/config?platform=${platform}`);
      if (!configRes.ok) throw new Error('Config fetch failed');
      const cfgData: RaffleConfig = await configRes.json();
      setConfig(cfgData);

      let users: EligibleUser[] = [];

      if (platform === 'acebet') {
        const lbRes = await fetch(`/api/leaderboard?start_at=${cfgData.start_date}&end_at=${cfgData.end_date}`);
        if (lbRes.ok) {
          const lbData = await lbRes.json();
          users = (lbData.data || [])
            .filter((u: any) => ((u.wagered || 0) / 100) >= cfgData.min_wager)
            .map((u: any) => ({ username: u.name || '', wager_amount: (u.wagered || 0) / 100 }))
            .filter((u: EligibleUser) => u.username);
        }
      } else if (platform === 'packdraw') {
        const [y, m, d] = cfgData.start_date.split('-');
        const afterParam = `${parseInt(m)}-${parseInt(d)}-${y}`;
        const pdRes = await fetch(`/api/packdraw?after=${afterParam}`);
        if (pdRes.ok) {
          const pdData = await pdRes.json();
          const list = pdData.leaderboard || pdData.data || (Array.isArray(pdData) ? pdData : []);
          users = list
            .filter((u: any) => (u.wagerAmount || u.wagered || 0) >= cfgData.min_wager)
            .map((u: any) => ({
              username: u.username || u.name || '',
              wager_amount: u.wagerAmount || u.wagered || 0,
            }))
            .filter((u: EligibleUser) => u.username);
        }
      }

      users.sort((a, b) => b.wager_amount - a.wager_amount);
      setEligible(users);

      try {
        const winnersRes = await fetch(`/api/raffle/winners?platform=${platform}`);
        if (winnersRes.ok) {
          const winnersData = await winnersRes.json();
          setWinners(winnersData.winners || []);
        }
      } catch {}
    } catch (err) {
      console.error('Error fetching raffle data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [platform]);

  useEffect(() => {
    setIsLoading(true);
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading raffle data...</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-8">
      {/* Hero Prize Section */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-secondary/50">
        {/* Glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-primary/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-64 h-32 bg-chart-3/5 blur-3xl rounded-full" />

        <div className="relative px-6 py-10 sm:px-10 sm:py-14">
          {/* Prize amount */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-5">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-xs uppercase tracking-widest text-primary font-semibold">
                {platform === 'acebet' ? 'Acebet' : 'Packdraw'} Raffle
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Total Prize Pool</p>
            <p className="text-6xl sm:text-7xl font-bold text-foreground tracking-tight">
              {'$'}
              <span className="bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-transparent">
                {(config?.prize_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </span>
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="text-center p-3 rounded-xl bg-background/40 border border-border/40">
              <div className="flex justify-center mb-2">
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">{eligible.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Entries</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-background/40 border border-border/40">
              <div className="flex justify-center mb-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">${(config?.min_wager || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Min Wager</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-background/40 border border-border/40">
              <div className="flex justify-center mb-2">
                <Ticket className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">1</p>
              <p className="text-xs text-muted-foreground mt-0.5">{'Entry / User'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Countdown Section */}
      <div className="rounded-2xl border border-border/60 bg-secondary/30 px-6 py-8 sm:px-10">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground uppercase tracking-wider">
            Drawing Ends{' '}
            {config?.end_date && (
              <span className="text-foreground font-medium">{formatDate(config.end_date)}</span>
            )}
          </p>
        </div>
        <CountdownTimer endDate={config?.end_date} />
        {config?.start_date && (
          <p className="text-center text-xs text-muted-foreground mt-6">
            {'Raffle period: '}
            {formatDate(config.start_date)} - {formatDate(config.end_date)}
          </p>
        )}
      </div>

      {/* Entries Grid */}
      <div className="rounded-2xl border border-border/60 bg-secondary/30 overflow-hidden">
        <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Star className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Current Entries</h3>
              <p className="text-xs text-muted-foreground">{eligible.length} qualified participants</p>
            </div>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
            {eligible.length} / {config?.max_entries?.toLocaleString() || '10,000'}
          </Badge>
        </div>

        <div className="p-6">
          {eligible.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-secondary border border-border/60 flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">No entries yet.</p>
              <p className="text-muted-foreground/60 text-xs mt-1">
                Wager at least ${(config?.min_wager || 0).toLocaleString()} to enter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {eligible.map((user, i) => (
                <div
                  key={`${user.username}-${i}`}
                  className="group relative flex items-center gap-3 rounded-xl border border-border/40 bg-background/40 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{i + 1}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {maskName(user.username)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${user.wager_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Past Winners */}
      <div className="rounded-2xl border border-border/60 bg-secondary/30 overflow-hidden">
        <div className="px-6 py-5 border-b border-border/40 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-chart-4/10 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-chart-4" />
          </div>
          <h3 className="font-semibold text-foreground">Past Winners</h3>
        </div>
        {winners.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="w-16 h-16 rounded-full bg-secondary border border-border/60 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No winners drawn yet.</p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Winners will appear here after each raffle drawing.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {winners.map((w) => (
              <div key={w.id} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-chart-4/10 border border-chart-4/20 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-chart-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{w.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(w.won_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {w.raffle_type && <span className="ml-2 text-muted-foreground/50">{'  '}{'  '}{w.raffle_type}</span>}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-chart-3">
                  +${w.prize_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RafflePage() {
  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight text-balance mb-3">
            Weekly Raffle
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-balance">
            Wager during the raffle period to automatically earn your entry. One winner takes all.
          </p>
        </div>

        {/* Platform Tabs */}
        <Tabs defaultValue="acebet" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-12 bg-secondary/50 border border-border/40 rounded-xl p-1">
            <TabsTrigger
              value="acebet"
              className="rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Acebet
            </TabsTrigger>
            <TabsTrigger
              value="packdraw"
              className="rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Packdraw
            </TabsTrigger>
          </TabsList>

          <TabsContent value="acebet">
            <RaffleTab platform="acebet" />
          </TabsContent>

          <TabsContent value="packdraw">
            <RaffleTab platform="packdraw" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
