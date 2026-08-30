'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Users,
  TrendingUp,
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  Zap,
  Radio,
  CheckCircle2,
  XCircle,
  BarChart3,
} from 'lucide-react';
import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import { BracketGenerator } from './bracket-generator';
import { BracketManager } from './bracket-manager';

interface Tournament {
  id: string;
  name: string;
  status: string;
  game_name: string;
  bet_amount: number;
  max_players: number;
  prize_pool?: number;
}

interface TournamentPlayer {
  id: string;
  roobet_username: string;
  kick_username: string;
  status: string;
  roobet_wager: number;
  roobet_active: boolean;
}

interface TournamentDetailViewProps {
  tournament: Tournament;
  onBack: () => void;
}

function formatCurrency(cents: number): string {
  const dollars = (cents || 0) / 100;
  return `$${dollars.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const STATUS_META: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  registration: {
    label: 'Registering',
    color: 'border-green-500/30 bg-green-500/10 text-green-400',
    dot: 'bg-green-400',
  },
  live: {
    label: 'Live',
    color: 'border-red-500/30 bg-red-500/10 text-red-400',
    dot: 'bg-red-500',
  },
  completed: {
    label: 'Closed',
    color: 'border-border/40 bg-muted/30 text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
};

export function TournamentDetailView({
  tournament,
  onBack,
}: TournamentDetailViewProps) {
  const supabase = createClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [roobetUsername, setRoobetUsername] = useState('');
  const [kickUsername, setKickUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(tournament.status);
  const [pendingStatus, setPendingStatus] = useState(tournament.status);
  const [statusLoading, setStatusLoading] = useState(false);

  const { data: players = [], mutate: refreshPlayers } = useSWR(
    tournament ? `tournament-players-${tournament.id}` : null,
    async () => {
      const { data, error } = await supabase
        .from('tournament_players')
        .select('*')
        .eq('tournament_id', tournament.id);
      if (error) return [];
      return data || [];
    }
  );

  const handleAddPlayer = async () => {
    if (!roobetUsername.trim() && !kickUsername.trim()) {
      setError('Enter either a Roobet or Kick username');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/player/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: tournament.id,
          roobetUsername: roobetUsername.trim() || null,
          kickUsername: kickUsername.trim() || roobetUsername.trim(),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Failed to add player');
        return;
      }
      setRoobetUsername('');
      setKickUsername('');
      setShowAddDialog(false);
      refreshPlayers();
    } catch {
      setError('An error occurred while adding the player');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!confirm('Remove this player?')) return;
    await supabase.from('tournament_players').delete().eq('id', playerId);
    refreshPlayers();
  };

  const handleStatusSave = async () => {
    setStatusLoading(true);
    try {
      const response = await fetch('/api/admin/tournament/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: tournament.id,
          status: pendingStatus,
        }),
      });
      if (response.ok) {
        setStatus(pendingStatus);
      }
    } catch {
      // revert
      setPendingStatus(status);
    } finally {
      setStatusLoading(false);
    }
  };

  const totalWagers = (players as TournamentPlayer[]).reduce(
    (sum, p) => sum + (p.roobet_wager || 0),
    0
  );
  const activePlayers = (players as TournamentPlayer[]).filter(
    (p) => p.roobet_active
  ).length;

  const meta = STATUS_META[status] ?? STATUS_META.completed;

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All Tournaments
        </button>

        {/* Status switcher */}
        <div className="flex items-center gap-2">
          <Select
            value={pendingStatus}
            onValueChange={setPendingStatus}
            disabled={statusLoading}
          >
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="registration">Registering</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="completed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="h-8"
            onClick={handleStatusSave}
            disabled={statusLoading || pendingStatus === status}
          >
            {statusLoading ? 'Saving…' : 'Apply'}
          </Button>
        </div>
      </div>

      {/* Tournament title */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">{tournament.name}</h1>
          <Badge
            variant="outline"
            className={`text-xs gap-1.5 ${meta.color}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot} ${status === 'live' ? 'animate-pulse' : ''}`} />
            {meta.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {tournament.game_name} &middot; ${tournament.bet_amount} buy-in &middot; {tournament.max_players} player cap
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile
          icon={<Users className="h-4 w-4" />}
          label="Players"
          value={`${players.length}/${tournament.max_players}`}
          accent="primary"
        />
        <StatTile
          icon={<Zap className="h-4 w-4" />}
          label="Active"
          value={String(activePlayers)}
          accent="green"
        />
        <StatTile
          icon={<TrendingUp className="h-4 w-4" />}
          label="Wagers"
          value={formatCurrency(totalWagers)}
          accent="primary"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="players" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-card/60 border border-border/40 h-9">
          <TabsTrigger value="players" className="text-xs gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Players
          </TabsTrigger>
          <TabsTrigger value="bracket" className="text-xs gap-1.5">
            <Radio className="h-3.5 w-3.5" />
            Bracket
          </TabsTrigger>
          <TabsTrigger value="stats" className="text-xs gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Stats
          </TabsTrigger>
        </TabsList>

        {/* Players tab */}
        <TabsContent value="players" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              {players.length} entrant{players.length !== 1 ? 's' : ''}
            </p>
            <Button
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Player
            </Button>
          </div>

          {players.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/40 py-12 text-center">
              <Users className="h-8 w-8 text-muted-foreground/25" />
              <p className="text-sm text-muted-foreground">No players registered</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/40 overflow-hidden divide-y divide-border/30">
              {(players as TournamentPlayer[]).map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between px-4 py-3 bg-card/30 hover:bg-card/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-2 w-2 rounded-full flex-shrink-0 ${
                        player.roobet_active
                          ? 'bg-green-500'
                          : 'bg-muted-foreground/30'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {player.roobet_username || (
                          <span className="italic text-muted-foreground">
                            No Roobet
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        @{player.kick_username}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium tabular-nums">
                        {formatCurrency(player.roobet_wager)}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        {player.roobet_active ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-muted-foreground/40" />
                        )}
                        <span className="text-[11px] text-muted-foreground">
                          {player.roobet_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemovePlayer(player.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Bracket tab */}
        <TabsContent value="bracket" className="space-y-4">
          <BracketGenerator tournament={tournament} />
          <BracketManager tournament={tournament} />
        </TabsContent>

        {/* Stats tab */}
        <TabsContent value="stats">
          <div className="rounded-xl border border-border/40 overflow-hidden divide-y divide-border/30">
            <StatRow label="Total Players" value={String(players.length)} />
            <StatRow label="Active Players" value={String(activePlayers)} />
            <StatRow
              label="Inactive Players"
              value={String(players.length - activePlayers)}
            />
            <StatRow
              label="Total Wagers"
              value={formatCurrency(totalWagers)}
            />
            <StatRow
              label="Avg Wager"
              value={
                players.length > 0
                  ? formatCurrency(totalWagers / players.length)
                  : '$0.00'
              }
            />
            {tournament.prize_pool && (
              <StatRow
                label="Prize Pool"
                value={`$${tournament.prize_pool.toLocaleString()}`}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Player Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Player</DialogTitle>
            <DialogDescription>
              Enter at least one username. Roobet stats will be verified if provided.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg bg-destructive/10 p-3">
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Roobet Username</label>
              <Input
                placeholder="roobet_user"
                value={roobetUsername}
                onChange={(e) => {
                  setRoobetUsername(e.target.value);
                  setError('');
                }}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Kick Username</label>
              <Input
                placeholder="kick_user"
                value={kickUsername}
                onChange={(e) => setKickUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPlayer}
                disabled={
                  isLoading ||
                  (!roobetUsername.trim() && !kickUsername.trim())
                }
              >
                {isLoading ? 'Adding…' : 'Add Player'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: 'primary' | 'green';
}

function StatTile({ icon, label, value, accent }: StatTileProps) {
  const accentCls =
    accent === 'green'
      ? 'border-green-500/20 bg-green-500/8 text-green-400'
      : 'border-primary/20 bg-primary/8 text-primary';
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/40 p-4">
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border ${accentCls}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-lg font-bold tabular-nums truncate">{value}</p>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-card/30">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}
