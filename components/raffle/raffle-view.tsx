'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import { CountdownTimer } from '@/components/raffle/countdown-timer';
import { RaffleSpinner } from '@/components/raffle/raffle-spinner';
import { createClient } from '@/lib/supabase/client';
import { assignTicketNumbers } from '@/lib/raffle/tickets';
import { Trophy, Users, DollarSign, Clock, Ticket, Star, Radio } from 'lucide-react';

export type RafflePlatform = 'acebet' | 'luxdrop' | 'csbattle';

function maskName(name: string): string {
  if (!name) return '***';
  if (name.length <= 4) return name[0] + '*'.repeat(name.length - 1);
  return name.substring(0, 2) + '*'.repeat(name.length - 3) + name.substring(name.length - 1);
}

interface RaffleConfig {
  min_wager: number;
  prize_amount: number;
  max_entries: number;
  tickets_per_wager: number;
  start_date: string;
  end_date: string;
}

interface EligibleUser {
  username: string;
  wager_amount: number;
  tickets: number;
}

interface Winner {
  id: string;
  username: string;
  prize_amount: number;
  won_date: string;
  week_start: string | null;
  raffle_type: string;
}

const PLATFORM_LABELS: Record<RafflePlatform, string> = {
  acebet: 'AceBet',
  luxdrop: 'LuxDrop',
  csbattle: 'CSBattle',
};

// Max individual ticket chips to render per user (keeps the DOM light)
const CHIPS_PER_USER = 6;

// Normalize a sponsor affiliate response into an array of entries.
function normalizeEntries(raw: unknown): any[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    for (const key of ['users', 'data', 'affiliates', 'results', 'leaderboard', 'entries']) {
      if (Array.isArray(obj[key])) return obj[key] as any[];
    }
  }
  return [];
}

export function RaffleView({ platform }: { platform: RafflePlatform }) {
  const [config, setConfig] = useState<RaffleConfig | null>(null);
  const [eligible, setEligible] = useState<EligibleUser[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPeriodWinner, setCurrentPeriodWinner] = useState<string | null>(null);

  // Live-draw state (driven by admin broadcasts over Supabase Realtime)
  const [liveWinner, setLiveWinner] = useState<string | null>(null);
  const [liveTicket, setLiveTicket] = useState<number | null>(null);
  const [liveSpinning, setLiveSpinning] = useState(false);
  const [liveLanded, setLiveLanded] = useState(false);
  const [liveSpinKey, setLiveSpinKey] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const configRes = await fetch(`/api/raffle/config?platform=${platform}`);
      if (!configRes.ok) throw new Error('Config fetch failed');
      const cfgData: RaffleConfig = await configRes.json();
      setConfig(cfgData);

      let users: EligibleUser[] = [];
      const ticketsPerWager = cfgData.tickets_per_wager || 2500;

      if (platform === 'acebet') {
        const lbRes = await fetch(`/api/leaderboard?start_at=${cfgData.start_date}&end_at=${cfgData.end_date}`);
        if (lbRes.ok) {
          const lbData = await lbRes.json();
          users = (lbData.data || [])
            .filter((u: any) => ((u.wagered || 0) / 100) >= cfgData.min_wager)
            .map((u: any) => {
              const wager_amount = (u.wagered || 0) / 100;
              return {
                username: u.name || '',
                wager_amount,
                tickets: Math.max(1, Math.floor(wager_amount / ticketsPerWager)),
              };
            })
            .filter((u: EligibleUser) => u.username);
        }
      } else {
        // LuxDrop & CSBattle return wager amounts already in dollars
        const res = await fetch(
          `/api/${platform}/affiliates?startDate=${cfgData.start_date}&endDate=${cfgData.end_date}`,
          { cache: 'no-store' },
        );
        if (res.ok) {
          const json = await res.json();
          users = normalizeEntries(json)
            .map((u: any) => {
              const wager_amount = u.wager ?? u.wagered ?? u.wagerAmount ?? u.totalWagered ?? 0;
              const username = u.username ?? u.name ?? '';
              return {
                username,
                wager_amount,
                tickets: Math.max(1, Math.floor(wager_amount / ticketsPerWager)),
              };
            })
            .filter((u: EligibleUser) => u.username && u.wager_amount >= cfgData.min_wager);
        }
      }

      setEligible(users);

      try {
        const winnersRes = await fetch(`/api/raffle/winners?platform=${platform}`);
        if (winnersRes.ok) {
          const winnersData = await winnersRes.json();
          const newWinners: Winner[] = winnersData.winners || [];
          const periodStart = cfgData.start_date;
          const winnerEntry = newWinners.find(
            (w) => w.week_start && w.week_start.substring(0, 10) === periodStart,
          );
          setCurrentPeriodWinner(winnerEntry ? winnerEntry.username : null);
          setWinners(newWinners);
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

  // Subscribe to the admin's live-draw broadcasts for this platform.
  useEffect(() => {
    const supabase = createClient();
    const channel: RealtimeChannel = supabase.channel(`raffle-draw-${platform}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'spin' }, ({ payload }) => {
        const winner = payload?.winner as string | undefined;
        if (!winner) return;
        const ticket = payload?.ticketNumber as number | undefined;
        setLiveWinner(winner);
        setLiveTicket(typeof ticket === 'number' ? ticket : null);
        setLiveLanded(false);
        setLiveSpinning(true);
        setLiveSpinKey((k) => k + 1);
      })
      .on('broadcast', { event: 'confirmed' }, () => {
        // Winner persisted server-side — refresh data, then clear the live overlay
        setLiveSpinning(false);
        fetchData();
        setTimeout(() => {
          setLiveWinner(null);
          setLiveTicket(null);
          setLiveLanded(false);
        }, 6000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [platform, fetchData]);

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

  // Assign sequential ticket numbers (shared logic with the admin draw panel)
  const { holders, total: totalTickets } = assignTicketNumbers(eligible);

  // Resolve what the spinner should display:
  //  - a live draw broadcast from admin takes priority
  //  - otherwise fall back to the persisted winner for this period
  const spinnerWinner = liveWinner ?? currentPeriodWinner;
  const spinnerHasWinner = liveLanded || (!liveSpinning && !!currentPeriodWinner);

  return (
    <div className="space-y-8">
      {/* Hero Prize Section */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-secondary/50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-primary/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-64 h-32 bg-chart-3/5 blur-3xl rounded-full" />

        <div className="relative px-6 py-10 sm:px-10 sm:py-14">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-5">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-xs uppercase tracking-widest text-primary font-semibold">
                {PLATFORM_LABELS[platform]} Raffle
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

          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="text-center p-3 rounded-xl bg-background/40 border border-border/40">
              <div className="flex justify-center mb-2">
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">{eligible.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Participants</p>
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
              <p className="text-2xl font-bold text-foreground">${(config?.tickets_per_wager || 2500).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Per Ticket</p>
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

      {/* Live draw banner */}
      {liveSpinning && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-500">
          <Radio className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm font-semibold text-primary">Live draw in progress — winner being selected now!</span>
        </div>
      )}

      {/* Winner Spinner */}
      <RaffleSpinner
        entries={eligible.map((u) => u.username)}
        winner={spinnerWinner}
        prizeAmount={config?.prize_amount || 0}
        isSpinning={liveSpinning}
        spinKey={liveSpinKey}
        hasWinnerForPeriod={spinnerHasWinner}
        winningTicket={liveWinner ? liveTicket : null}
        onSpinComplete={() => {
          setLiveSpinning(false);
          if (liveWinner) setLiveLanded(true);
        }}
      />

      {/* Ticket Pool — individual tickets per participant */}
      <div className="rounded-2xl border border-border/60 bg-secondary/30 overflow-hidden">
        <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Ticket className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Ticket Pool</h3>
              <p className="text-xs text-muted-foreground">
                {config?.start_date && config?.end_date
                  ? `${formatDate(config.start_date)} – ${formatDate(config.end_date)}`
                  : 'Current raffle period'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
              {totalTickets.toLocaleString()} tickets
            </Badge>
            <Badge variant="outline" className="border-border/60">
              {eligible.length} entrants
            </Badge>
          </div>
        </div>

        <div className="p-6">
          {eligible.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-secondary border border-border/60 flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">No entries yet.</p>
              <p className="text-muted-foreground/60 text-xs mt-1">
                Wager at least ${(config?.min_wager || 0).toLocaleString()} to enter. 1 ticket per ${(config?.tickets_per_wager || 2500).toLocaleString()} wagered.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {holders.map((user, i) => {
                const odds = totalTickets > 0 ? (user.tickets / totalTickets) * 100 : 0;
                const shownNumbers = user.ticketNumbers.slice(0, CHIPS_PER_USER);
                const remaining = user.tickets - shownNumbers.length;
                const pad = String(totalTickets).length;
                // Highlight this row if the live winning ticket belongs to it
                const winTicket = liveWinner ? liveTicket : null;
                const isWinningRow = winTicket != null && user.ticketNumbers.includes(winTicket);
                return (
                  <div
                    key={`${user.username}-${i}`}
                    className={`rounded-xl border px-4 py-3 transition-colors ${
                      isWinningRow
                        ? 'border-chart-3/50 bg-chart-3/10'
                        : 'border-border/40 bg-background/40 hover:border-primary/30 hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">{i + 1}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate blur-[3px] select-none" aria-hidden="true">
                            {maskName(user.username)}
                          </p>
                          <span className="sr-only">Hidden participant</span>
                          <p className="text-xs text-muted-foreground">
                            ${user.wager_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} wagered
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-primary">
                          {user.tickets} {user.tickets === 1 ? 'ticket' : 'tickets'}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70">{odds.toFixed(odds < 0.1 ? 3 : 1)}% odds</p>
                      </div>
                    </div>

                    {/* Individual ticket chips — actual global ticket numbers,
                        interleaved in the threshold order they were earned */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {shownNumbers.map((num) => {
                        const isWinChip = winTicket === num;
                        return (
                          <span
                            key={num}
                            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-mono ${
                              isWinChip
                                ? 'border-chart-3/50 bg-chart-3/20 text-chart-3 font-bold'
                                : 'border-primary/20 bg-primary/5 text-primary/80'
                            }`}
                          >
                            <Ticket className="w-2.5 h-2.5" />
                            {String(num).padStart(pad, '0')}
                          </span>
                        );
                      })}
                      {remaining > 0 && (
                        <span className="inline-flex items-center rounded-md border border-border/40 bg-background/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                          +{remaining.toLocaleString()} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
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
          <>
            <div className="grid grid-cols-3 px-6 py-3 border-b border-border/40 text-xs uppercase tracking-wider text-muted-foreground font-medium">
              <span>Username</span>
              <span className="text-center">Raffle Period</span>
              <span className="text-right">Amount</span>
            </div>
            <div className="divide-y divide-border/20">
              {winners.map((w) => (
                <div key={w.id} className="grid grid-cols-3 items-center px-6 py-4 transition-colors hover:bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-chart-4/10 border border-chart-4/20 flex items-center justify-center shrink-0">
                      <Trophy className="w-3.5 h-3.5 text-chart-4" />
                    </div>
                    <span className="text-sm font-medium text-foreground truncate">{w.username}</span>
                  </div>
                  <span className="text-sm text-muted-foreground text-center">
                    {new Date(w.won_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {w.raffle_type && ` - ${w.raffle_type}`}
                  </span>
                  <span className="text-sm font-bold text-chart-3 text-right">
                    +${w.prize_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
