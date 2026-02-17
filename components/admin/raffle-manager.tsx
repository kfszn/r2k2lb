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
  start_date: string;
  end_date: string;
}

function RaffleAdminTab({ platform }: { platform: 'acebet' | 'packdraw' }) {
  const [config, setConfig] = useState<RaffleConfig | null>(null);
  const [configForm, setConfigForm] = useState({
    min_wager: 50,
    prize_amount: 1000,
    max_entries: 10000,
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
      let users: string[] = [];
      if (platform === 'acebet') {
        const lbRes = await fetch(
          `/api/leaderboard?start_at=${config.start_date}&end_at=${config.end_date}`,
        );
        if (lbRes.ok) {
          const lbData = await lbRes.json();
          users = (lbData.data || [])
            .filter((u: any) => (u.wagered || 0) / 100 >= config.min_wager)
            .map((u: any) => u.name || '')
            .filter(Boolean);
        }
      } else {
        const [y, m, d] = config.start_date.split('-');
        const afterParam = `${parseInt(m)}-${parseInt(d)}-${y}`;
        const pdRes = await fetch(`/api/packdraw?after=${afterParam}`);
        if (pdRes.ok) {
          const pdData = await pdRes.json();
          const list = pdData.leaderboard || pdData.data || (Array.isArray(pdData) ? pdData : []);
          users = list
            .filter((u: any) => (u.wagerAmount || u.wagered || 0) >= config.min_wager)
            .map((u: any) => u.username || u.name || '')
            .filter(Boolean);
        }
      }
      setEligible(users);
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
    // Pick random winner
    const winner = eligible[Math.floor(Math.random() * eligible.length)];
    setSelectedWinner(winner);
    setIsSpinning(true);
    setSpinComplete(false);
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
      if (response.ok) {
        alert(`Winner confirmed: ${selectedWinner} wins $${config.prize_amount.toLocaleString()}`);
        // Reset
        setIsSpinning(false);
        setSelectedWinner(null);
        setSpinComplete(false);
      } else {
        alert('Error confirming winner');
      }
    } catch (error) {
      console.error('Error confirming winner:', error);
      alert('Error confirming winner');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleResetSpin = () => {
    setIsSpinning(false);
    setSelectedWinner(null);
    setSpinComplete(false);
  };

  return (
    <div className="space-y-6">
      {/* Settings */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Raffle Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
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
              <Badge variant="outline">{eligible.length} entries</Badge>
              <Button variant="outline" size="sm" onClick={fetchEligible} disabled={isLoadingEntries}>
                {isLoadingEntries ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {eligible.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No eligible entries found. Users need to wager at least ${configForm.min_wager.toLocaleString()} to qualify.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {eligible.map((name, i) => (
                <Badge key={`${name}-${i}`} variant="secondary" className="text-xs">
                  {name}
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
            onSpinComplete={() => setSpinComplete(true)}
          />

          <div className="flex gap-3">
            {!isSpinning && !spinComplete && (
              <Button onClick={handleSpin} disabled={eligible.length === 0} className="flex-1">
                Spin Raffle
              </Button>
            )}
            {spinComplete && selectedWinner && (
              <>
                <Button
                  onClick={handleConfirmWinner}
                  disabled={isConfirming}
                  className="flex-1 bg-chart-3 hover:bg-chart-3/90 text-background"
                >
                  {isConfirming ? 'Confirming...' : `Confirm ${selectedWinner} as Winner`}
                </Button>
                <Button variant="outline" onClick={handleResetSpin}>
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
          <TabsTrigger value="packdraw">Packdraw</TabsTrigger>
        </TabsList>
        <TabsContent value="acebet">
          <RaffleAdminTab platform="acebet" />
        </TabsContent>
        <TabsContent value="packdraw">
          <RaffleAdminTab platform="packdraw" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
