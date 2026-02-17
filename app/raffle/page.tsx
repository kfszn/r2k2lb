'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GiveawayCounter } from '@/components/giveaway-counter';
import { Header } from '@/components/header';
import { CountdownTimer } from '@/components/raffle/countdown-timer';
import { PreviousWinners } from '@/components/raffle/previous-winners';

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
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setError('');

      // 1. Get raffle config from admin panel
      const configRes = await fetch(`/api/raffle/config?platform=${platform}`);
      if (!configRes.ok) throw new Error('Config fetch failed');
      const cfgData: RaffleConfig = await configRes.json();
      setConfig(cfgData);

      // 2. Fetch wager data from the same APIs the leaderboard pages use
      let users: EligibleUser[] = [];

      if (platform === 'acebet') {
        // Uses /api/leaderboard — same endpoint as the Acebet leaderboard page
        // Acebet API returns values in PENNIES — divide by 100 to get dollars
        const lbRes = await fetch(`/api/leaderboard?start_at=${cfgData.start_date}&end_at=${cfgData.end_date}`);
        if (lbRes.ok) {
          const lbData = await lbRes.json();
          users = (lbData.data || [])
            .filter((u: any) => ((u.wagered || 0) / 100) >= cfgData.min_wager)
            .map((u: any) => ({ username: u.name || '', wager_amount: (u.wagered || 0) / 100 }))
            .filter((u: EligibleUser) => u.username);
        }
      } else if (platform === 'packdraw') {
        // Uses /api/packdraw — same endpoint as the Packdraw leaderboard page
        // Convert YYYY-MM-DD to M-D-YYYY format the Packdraw API expects
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

      // 3. Fetch previous winners (non-blocking)
      try {
        const winnersRes = await fetch(`/api/raffle/winners?platform=${platform}`);
        if (winnersRes.ok) {
          const winnersData = await winnersRes.json();
          setWinners(winnersData.winners || []);
        }
      } catch {}
    } catch (err: any) {
      console.error('Error fetching raffle data:', err);
      setError(err.message || 'Failed to load raffle data');
    } finally {
      setIsLoading(false);
    }
  }, [platform]);

  useEffect(() => {
    setIsLoading(true);
    fetchData();
    // Refresh every 5 minutes — the leaderboard APIs already cache for 5 min
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading raffle data...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Prize Pool */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Prize Pool - {platform === 'acebet' ? 'Acebet' : 'Packdraw'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Prize</p>
              <p className="text-3xl font-bold text-primary">${(config?.prize_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Entries</p>
              <p className="text-3xl font-bold text-primary">{eligible.length}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              {'Minimum wager to enter: '}
              <span className="text-primary font-semibold">${(config?.min_wager || 0).toLocaleString()}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Countdown Timer */}
      <Card className="border-border/50">
        <CardContent className="pt-6 space-y-4">
          {config?.start_date && config?.end_date && (
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">Raffle Period</p>
              <p className="text-sm font-medium text-foreground">
                {new Date(config.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' - '}
                {new Date(config.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          )}
          <CountdownTimer endDate={config?.end_date} />
        </CardContent>
      </Card>

      {/* Current Entries */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Current Entries ({eligible.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {eligible.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No entries yet. Wager at least ${(config?.min_wager || 0).toLocaleString()} to enter.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {eligible.map((user, i) => (
                <Badge key={`${user.username}-${i}`} variant="outline" className="text-sm py-1.5 px-3">
                  {maskName(user.username)}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Previous Winners */}
      <PreviousWinners winners={winners} />
    </div>
  );
}

export default function RafflePage() {
  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground text-balance">Weekly Raffle</h1>
          <p className="text-muted-foreground">Wager during the raffle period to automatically earn your entry.</p>
        </div>

        <Tabs defaultValue="acebet" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="acebet">Acebet</TabsTrigger>
            <TabsTrigger value="packdraw">Packdraw</TabsTrigger>
          </TabsList>

          <TabsContent value="acebet" className="space-y-6">
            <RaffleTab platform="acebet" />
          </TabsContent>

          <TabsContent value="packdraw" className="space-y-6">
            <RaffleTab platform="packdraw" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
