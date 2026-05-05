'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RaffleSpinner } from '@/components/raffle/raffle-spinner';

interface RaffleConfig {
  platform: string;
  min_wager: number;
  prize_amount: number;
  max_entries: number;
  tickets_per_wager: number;
  start_date: string;
  end_date: string;
}

function RaffleAdminTab({ platform }: { platform: 'acebet' }) {
  const [config, setConfig] = useState<RaffleConfig | null>(null);
  const [configForm, setConfigForm] = useState({
    min_wager: 50,
    prize_amount: 1000,
    max_entries: 10000,
    tickets_per_wager: 2500,
    start_date: '2026-02-14',
    end_date: '2026-02-21',
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [eligible, setEligible] = useState<string[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);

  // Spinner state
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [spinComplete, setSpinComplete] = useState(false);
  const [spinKey, setSpinKey] = useState(0); // increment to re-trigger spin animation

  useEffect(() => {
    fetchConfig();
  }, [platform]);

  useEffect(() => {
    if (config) fetchEligible();
  }, [config]);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`/api/raffle/config?platform=${platform}`);
      if (!res.ok) return;
      const data = await res.json();
      setConfig(data);
      setConfigForm({
        min_wager: data.min_wager || 50,
        prize_amount: data.prize_amount || 1000,
        max_entries: data.max_entries || 10000,
        tickets_per_wager: data.tickets_per_wager || 2500,
        start_date: data.start_date || '2026-02-14',
        end_date: data.end_date || '2026-02-21',
      });
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const fetchEligible = useCallback(async () => {
    if (!config) return;
    setIsLoadingEntries(true);
    try {
      // Build weighted ticket pool: 1 ticket per tickets_per_wager wagered
      const ticketsPerWager = config.tickets_per_wager || 2500;
      let ticketPool: string[] = [];

      if (platform === 'acebet') {
        const lbRes = await fetch(
          `/api/leaderboard?start_at=${config.start_date}&end_at=${config.end_date}`,
        );
        if (lbRes.ok) {
          const lbData = await lbRes.json();
          (lbData.data || []).forEach((u: any) => {
            const wagerAmount = (u.wagered || 0) / 100;
            if (wagerAmount < config.min_wager) return;
            const name = u.name || '';
            if (!name) return;
            const tickets = Math.max(1, Math.floor(wagerAmount / ticketsPerWager));
            for (let i = 0; i < tickets; i++) {
              ticketPool.push(name);
            }
          });
        }
      }
      setEligible(ticketPool);
    } catch (err) {
      console.error('Error fetching eligible:', err);
    } finally {
      setIsLoadingEntries(false);
    }
  }, [config, platform]);

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const response = await fetch('/api/raffle/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, ...configForm }),
      });
      if (response.ok) {
        const data = await response.json();
        setConfig(data.data);
        alert('Configuration saved successfully!');
      } else {
        alert('Error saving configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error saving configuration');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSpin = () => {
    if (eligible.length === 0) {
      alert('No eligible entries to draw from');
      return;
    }
    // Pick a random winner from the weighted ticket pool
    const winner = eligible[Math.floor(Math.random() * eligible.length)];
    setSelectedWinner(winner);
    setSpinComplete(false);
    setIsSpinning(true);
    // Increment spinKey to force a fresh animation (handles re-spins too)
    setSpinKey((k) => k + 1);
  };

  const handleConfirmWinner = async () => {
    if (!selectedWinner || !config) return;
    setIsConfirming(true);
    try {
      const response = await fetch('/api/raffle/winners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          username: selectedWinner,
          prizeAmount: config.prize_amount,
          weekStart: config.start_date,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Winner confirmed: ${selectedWinner} wins $${config.prize_amount.toLocaleString()}`);
        // Reset
        setIsSpinning(false);
        setSelectedWinner(null);
        setSpinComplete(false);
      } else {
        const errMsg = data?.error || 'Unknown error';
        console.error('Error confirming winner:', errMsg);
        alert(`Error confirming winner: ${errMsg}`);
      }
    } catch (error: any) {
      console.error('Error confirming winner:', error);
      alert(`Error confirming winner: ${error?.message || 'Network error'}`);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleResetSpin = () => {
    // Re-spin: pick a new winner and trigger a fresh animation immediately
    if (eligible.length === 0) return;
    const winner = eligible[Math.floor(Math.random() * eligible.length)];
    setSelectedWinner(winner);
    setSpinComplete(false);
    setIsSpinning(true);
    setSpinKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Settings */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Raffle Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Minimum Wager ($)</label>
              <Input
                type="number"
                value={configForm.min_wager || 0}
                onChange={(e) =>
                  setConfigForm({ ...configForm, min_wager: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Prize Amount ($)</label>
              <Input
                type="number"
                value={configForm.prize_amount || 0}
                onChange={(e) =>
                  setConfigForm({ ...configForm, prize_amount: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Wager per Ticket ($)</label>
              <Input
                type="number"
                value={configForm.tickets_per_wager || 2500}
                onChange={(e) =>
                  setConfigForm({ ...configForm, tickets_per_wager: parseFloat(e.target.value) || 2500 })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">1 ticket earned per ${(configForm.tickets_per_wager || 2500).toLocaleString()} wagered</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Max Entries</label>
              <Input
                type="number"
                value={configForm.max_entries || 0}
                onChange={(e) =>
                  setConfigForm({ ...configForm, max_entries: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Raffle Start Date</label>
              <Input
                type="date"
                value={configForm.start_date || ''}
                onChange={(e) => setConfigForm({ ...configForm, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Raffle End Date</label>
              <Input
                type="date"
                value={configForm.end_date || ''}
                onChange={(e) => setConfigForm({ ...configForm, end_date: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={handleSaveConfig} disabled={isSavingConfig} className="w-full">
            {isSavingConfig ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Eligible entries */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Eligible Entries</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{new Set(eligible).size} users</Badge>
              <Badge variant="secondary">{eligible.length} tickets</Badge>
              <Button variant="outline" size="sm" onClick={fetchEligible} disabled={isLoadingEntries}>
                {isLoadingEntries ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {eligible.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No eligible entries found. Users need to wager at least ${configForm.min_wager.toLocaleString()} to qualify. Each ${(configForm.tickets_per_wager || 2500).toLocaleString()} wagered earns 1 ticket.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {Array.from(
                eligible.reduce((acc, name) => {
                  acc.set(name, (acc.get(name) || 0) + 1);
                  return acc;
                }, new Map<string, number>()),
              ).map(([name, count]) => (
                <Badge key={name} variant="secondary" className="text-xs">
                  {name} &times; {count}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Draw Winner - Visual Spinner */}
      <Card className="border-chart-3/30">
        <CardHeader>
          <CardTitle>Draw Winner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RaffleSpinner
            entries={eligible}
            winner={selectedWinner}
            prizeAmount={config?.prize_amount || 0}
            isSpinning={isSpinning}
            spinKey={spinKey}
            onSpinComplete={() => setSpinComplete(true)}
          />

          <div className="flex gap-3">
            {/* Initial state: no spin yet */}
            {!isSpinning && !spinComplete && !selectedWinner && (
              <Button onClick={handleSpin} disabled={eligible.length === 0} className="flex-1">
                Spin Raffle
              </Button>
            )}
            {/* Actively spinning */}
            {isSpinning && !spinComplete && (
              <Button disabled className="flex-1 opacity-60">
                Spinning...
              </Button>
            )}
            {/* Spin complete — show confirm + re-spin */}
            {spinComplete && selectedWinner && (
              <>
                <Button
                  onClick={handleConfirmWinner}
                  disabled={isConfirming}
                  className="flex-1 bg-chart-3 hover:bg-chart-3/90 text-background"
                >
                  {isConfirming ? 'Confirming...' : `Confirm ${selectedWinner} as Winner`}
                </Button>
                <Button variant="outline" onClick={handleResetSpin} disabled={isConfirming}>
                  Re-spin
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function RaffleManager() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Raffle Management</h1>
        <p className="text-muted-foreground">Control raffle entries and spin winners</p>
      </div>

      <Tabs defaultValue="acebet" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="acebet">Acebet</TabsTrigger>

        </TabsList>
        <TabsContent value="acebet">
          <RaffleAdminTab platform="acebet" />
        </TabsContent>

      </Tabs>
    </div>
  );
}
