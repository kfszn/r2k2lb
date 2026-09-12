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
import {
  assignTicketNumbers,
  pickWinningTicket,
  parseMultiplierEligibility,
  type TicketUser,
} from '@/lib/raffle/tickets';

type RaffleType = 'wager' | 'multiplier';

interface RaffleConfig {
  platform: string;
  raffle_type: RaffleType;
  min_wager: number;
  prize_amount: number;
  max_entries: number;
  tickets_per_wager: number;
  multiplier_threshold: number;
  min_bet_size: number;
  start_date: string;
  end_date: string;
}

function RaffleAdminTab({
  platform,
  raffleType = 'wager',
}: {
  platform: 'acebet' | 'luxdrop' | 'roobet';
  raffleType?: RaffleType;
}) {
  const [config, setConfig] = useState<RaffleConfig | null>(null);
  const [configForm, setConfigForm] = useState({
    min_wager: 50,
    prize_amount: 1000,
    max_entries: 10000,
    tickets_per_wager: 2500,
    multiplier_threshold: 200,
    min_bet_size: 1,
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

  const isMultiplier = raffleType === 'multiplier';

  // Realtime broadcast channel — pushes the live draw to the public /raffle pages.
  // Keep the wager channel name unchanged for backwards compatibility; give the
  // multiplier raffle its own channel so the two draws never cross-broadcast.
  const channelName =
    raffleType === 'wager' ? `raffle-draw-${platform}` : `raffle-draw-${platform}-${raffleType}`;
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, [platform, raffleType]);

  // Open a broadcast channel for this platform so viewers on /raffle see the draw live
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });
    channel.subscribe((status: string) => {
      setIsLiveConnected(status === 'SUBSCRIBED');
    });
    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [channelName]);

  useEffect(() => {
    if (config) fetchEligible();
  }, [config]);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`/api/raffle/config?platform=${platform}&raffleType=${raffleType}`);
      if (!res.ok) return;
      const data = await res.json();
      setConfig(data);
      setConfigForm({
        min_wager: data.min_wager || 50,
        prize_amount: data.prize_amount || 1000,
        max_entries: data.max_entries || 10000,
        tickets_per_wager: data.tickets_per_wager || 2500,
        multiplier_threshold: data.multiplier_threshold || 200,
        min_bet_size: data.min_bet_size || 1,
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
      const users: TicketUser[] = [];

      if (isMultiplier) {
        // Highest Multi Raffle: qualify once the player's highest single-bet
        // multiplier during the period clears the threshold, with the
        // qualifying bet's stake meeting the min bet size.
        const res = await fetch(
          `/api/roobet/affiliates?startDate=${config.start_date}&endDate=${config.end_date}`,
          { cache: 'no-store' },
        );
        if (res.ok) {
          const json = await res.json();
          const rows = Array.isArray(json)
            ? json
            : json?.users || json?.data || json?.affiliates || json?.results || json?.leaderboard || json?.entries || [];
          users.push(
            ...parseMultiplierEligibility(
              rows,
              config.multiplier_threshold || 200,
              config.min_bet_size || 1,
            ),
          );
        }
      } else {
        // Build per-user ticket counts: 1 ticket per tickets_per_wager wagered
        const ticketsPerWager = config.tickets_per_wager || 2500;

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
          // LuxDrop & Roobet affiliate APIs return wager amounts already in dollars
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
      }
      setEligible(users);
    } catch (err) {
      console.error('Error fetching eligible:', err);
    } finally {
      setIsLoadingEntries(false);
    }
  }, [config, platform, isMultiplier]);

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const response = await fetch('/api/raffle/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, raffle_type: raffleType, ...configForm }),
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
          raffleCategory: raffleType,
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
            {isMultiplier ? (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Multiplier Threshold (x)</label>
                  <Input
                    type="number"
                    value={configForm.multiplier_threshold || 0}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        multiplier_threshold: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Min Bet Size ($)</label>
                  <Input
                    type="number"
                    value={configForm.min_bet_size || 0}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, min_bet_size: parseFloat(e.target.value) || 0 })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Players qualify once their highest multiplier hits the threshold. Tickets = floor(highest
                    multiplier &divide; threshold).
                  </p>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
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
              {isMultiplier
                ? `No eligible entries found. Users need a highest multiplier of at least ${configForm.multiplier_threshold}x (on a bet of at least $${configForm.min_bet_size}) to qualify.`
                : `No eligible entries found. Users need to wager at least $${configForm.min_wager.toLocaleString()} to qualify. Each $${(configForm.tickets_per_wager || 2500).toLocaleString()} wagered earns 1 ticket.`}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {assignTicketNumbers(eligible).holders.map((h) => (
                <Badge key={h.username} variant="secondary" className="text-xs font-mono">
                  {h.username} &middot; {isMultiplier ? `${h.wager_amount.toLocaleString()}x` : `$${h.wager_amount.toLocaleString()}`} &middot; {h.tickets.toLocaleString()} {h.tickets === 1 ? 'ticket' : 'tickets'}
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

      <Tabs defaultValue="roobet" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roobet">Roobet</TabsTrigger>
          <TabsTrigger value="luxdrop">LuxDrop</TabsTrigger>
          <TabsTrigger value="acebet">AceBet (legacy)</TabsTrigger>
        </TabsList>
        <TabsContent value="roobet">
          <Tabs defaultValue="wager" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="wager">Wager Raffle</TabsTrigger>
              <TabsTrigger value="multiplier">Highest Multi Raffle</TabsTrigger>
            </TabsList>
            <TabsContent value="wager" className="mt-4">
              <RaffleAdminTab platform="roobet" raffleType="wager" />
            </TabsContent>
            <TabsContent value="multiplier" className="mt-4">
              <RaffleAdminTab platform="roobet" raffleType="multiplier" />
            </TabsContent>
          </Tabs>
        </TabsContent>
        <TabsContent value="luxdrop">
          <RaffleAdminTab platform="luxdrop" />
        </TabsContent>
        <TabsContent value="acebet">
          <RaffleAdminTab platform="acebet" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
