'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GiveawayCounter } from '@/components/giveaway-counter';
import { Header } from '@/components/header';
import { CountdownTimer } from '@/components/raffle/countdown-timer';
import { PreviousWinners } from '@/components/raffle/previous-winners';

function maskName(name: string): string {
  if (name.length <= 4) return '*'.repeat(name.length);
  return name.substring(0, 3) + '*'.repeat(Math.max(3, name.length - 4)) + name.substring(name.length - 1);
}

interface RaffleEntry {
  id: string;
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
  const [entries, setEntries] = useState<RaffleEntry[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPrize, setTotalPrize] = useState(0);
  const [config, setConfig] = useState<{ min_wager: number; prize_amount: number; max_entries: number } | null>(null);
  
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [platform]);
  
  const fetchData = async () => {
    try {
      const [entriesRes, winnersRes] = await Promise.all([
        fetch(`/api/raffle/entries?platform=${platform}`),
        fetch(`/api/raffle/winners?platform=${platform}`),
      ]);
      
      const entriesData = await entriesRes.json();
      const winnersData = await winnersRes.json();
      
      setEntries(entriesData.entries || []);
      setTotalPrize(entriesData.totalPrize || 0);
      setWinners(winnersData.winners || []);
      setConfig({
        min_wager: entriesData.minWager || 50,
        prize_amount: entriesData.totalPrize || 0,
        max_entries: entriesData.maxEntries || 10000
      });
    } catch (error) {
      console.error('Error fetching raffle data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Prize Pool */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Prize Pool - {platform.toUpperCase()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Prize</p>
              <p className="text-3xl font-bold text-primary">${totalPrize.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Entries</p>
              <p className="text-3xl font-bold text-primary">{entries.length} / {config?.max_entries || 10000}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-primary/20">
            <p className="text-sm text-muted-foreground">Minimum wager to enter: <span className="text-primary font-semibold">${config?.min_wager || 50}</span></p>
          </div>
        </CardContent>
      </Card>
      
      {/* Countdown Timer */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <CountdownTimer />
        </CardContent>
      </Card>
      
      {/* Entries Display */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Current Entries ({entries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {entries.length === 0 ? (
              <p className="text-muted-foreground text-sm w-full text-center py-8">No entries yet</p>
            ) : (
              entries.slice(0, 50).map((entry) => (
                <Badge key={entry.id} variant="outline" className="text-sm">
                  {maskName(entry.username)}
                </Badge>
              ))
            )}
            {entries.length > 50 && (
              <Badge variant="secondary">+{entries.length - 50} more</Badge>
            )}
          </div>
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
          <h1 className="text-4xl font-bold mb-2">Weekly Raffle</h1>
          <p className="text-muted-foreground">Win big with our weekly raffles.</p>
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
