'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RaffleSpinner } from '@/components/raffle/raffle-spinner';
import { createClient } from '@/lib/supabase/client';
import { assignTicketNumbers, pickWinningTicket, type TicketUser } from '@/lib/raffle/tickets';

interface RaffleConfig {
  platform: string;
  min_wager: number;
  prize_amount: number;
  max_entries: number;
  tickets_per_wager: number;
  start_date: string;
  end_date: string;
}

function RaffleAdminTab({ platform }: { platform: 'acebet' | 'luxdrop' | 'csbattle' }) {
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
  const [eligible, setEligible] = useState<TicketUser[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);

  // Spinner state
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [spinComplete, setSpinComplete] = useState(false);
  const [spinKey, setSpinKey] = useState(0); // increment to re-trigger spin animation

  // Realtime broadcast channel — pushes the live draw to the public /raffle pages
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, [platform]);

  // Open a broadcast channel for this platform so viewers on /raffle see the draw live
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`raffle-draw-${platform}`, {
      config: { broadcast: { self: false } },
    });
    channel.subscribe((status) => {
      setIsLiveConnected(status === 'SUBSCRIBED');
    });
    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
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
      // Build per-user ticket counts: 1 ticket per tickets_per_wager wagered
      const ticketsPerWager = config.tickets_per_wager || 2500;
      const users: TicketUser[] = [];

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
            users.push({
              username: name,
              wager_amount: wagerAmount,
              tickets: Math.max(1, Math.floor(wagerAmount / ticketsPerWager)),
            });
          });
        }
      } else {
        // LuxDrop & CSBattle affiliate APIs return wager amounts already in dollars
        const res = await fetch(
          `/api/${platform}/affiliates?startDate=${config.start_date}&endDate=${config.end_date}`,
          { cache: 'no-store' },
        );
        if (res.ok) {
          const json = await res.json();
          const rows = Array.isArray(json)
            ? json
            : json?.users || json?.data || json?.affiliates || json?.results || json?.leaderboard || json?.entries || [];
          rows.forEach((u: any) => {
            const wagerAmount = u.wager ?? u.wagered ?? u.wagerAmount ?? u.totalWagered ?? 0;
            if (wagerAmount < config.min_wager) return;
            const name = u.username ?? u.name ?? '';
            if (!name) return;
            users.push({
              username: name,
              wager_amount: wagerAmount,
              tickets: Math.max(1, Math.floor(wagerAmount / ticketsPerWager)),
            });
          });
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

  // Broadcast the live draw to everyone watching the public /raffle page
  const broadcastSpin = (winner: string, ticketNumber: number) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'spin',
      payload: { winner, ticketNumber, prizeAmount: config?.prize_amount || 0, ts: Date.now() },
    });
  };

  const drawWinner = () => {
    // Mint tickets in threshold-round order, then RNG-pick a winning ticket
    // number. The owner of that ticket is the winner — mirrors what viewers see.
    const { holders, total, ownerByTicket } = assignTicketNumbers(eligible);
    const pick = pickWinningTicket(holders, total, ownerByTicket);
    if (!pick) return;
    setSelectedWinner(pick.holder.username);
    setSelectedTicket(pick.ticketNumber);
    setSpinComplete(false);
    setIsSpinning(true);
    // Increment spinKey to force a fresh animation (handles re-spins too)
    setSpinKey((k) => k + 1);
    broadcastSpin(pick.holder.username, pick.ticketNumber);
  };

  const handleSpin = () => {
    if (eligible.length === 0) {
      alert('No eligible entries to draw from');
      return;
    }
    drawWinner();
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
        // Tell the public /raffle page the winner is now official
        channelRef.current?.send({
          type: 'broadcast',
          event: 'confirmed',
          payload: { winner: selectedWinner, ts: Date.now() },
        });
        alert(`Winner confirmed: ${selectedWinner} (Ticket #${selectedTicket?.toLocaleString() ?? '?'}) wins $${config.prize_amount.toLocaleString()}`);
        // Reset
        setIsSpinning(false);
        setSelectedWinner(null);
        setSelectedTicket(null);
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
    drawWinner();
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
              <Badge variant="outline">{eligible.length} users</Badge>
              <Badge variant="secondary">
                {eligible.reduce((s, u) => s + u.tickets, 0).toLocaleString()} tickets
              </Badge>
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
              {assignTicketNumbers(eligible).holders.map((h) => (
                <Badge key={h.username} variant="secondary" className="text-xs font-mono">
                  {h.username} &middot; {h.tickets.toLocaleString()} {h.tickets === 1 ? 'ticket' : 'tickets'}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Draw Winner - Visual Spinner */}
      <Card className="border-chart-3/30">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Draw Winner</CardTitle>
            <Badge
              variant="outline"
              className={
                isLiveConnected
                  ? 'border-chart-3/40 text-chart-3'
                  : 'border-border/60 text-muted-foreground'
              }
            >
              <span
                className={`mr-1.5 inline-block h-2 w-2 rounded-full ${
                  isLiveConnected ? 'bg-chart-3 animate-pulse' : 'bg-muted-foreground'
                }`}
              />
              {isLiveConnected ? 'Live on /raffle' : 'Connecting...'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Spinning here broadcasts the draw live to everyone viewing the public raffle page.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <RaffleSpinner
            entries={eligible.map((u) => u.username)}
            winner={selectedWinner}
            prizeAmount={config?.prize_amount || 0}
            isSpinning={isSpinning}
            spinKey={spinKey}
            winningTicket={selectedTicket}
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
                  {isConfirming
                    ? 'Confirming...'
                    : `Confirm ${selectedWinner}${selectedTicket ? ` (#${selectedTicket.toLocaleString()})` : ''} as Winner`}
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="acebet">AceBet</TabsTrigger>
          <TabsTrigger value="luxdrop">LuxDrop</TabsTrigger>
          <TabsTrigger value="csbattle">CSBattle</TabsTrigger>
        </TabsList>
        <TabsContent value="acebet">
          <RaffleAdminTab platform="acebet" />
        </TabsContent>
        <TabsContent value="luxdrop">
          <RaffleAdminTab platform="luxdrop" />
        </TabsContent>
        <TabsContent value="csbattle">
          <RaffleAdminTab platform="csbattle" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
