'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Users, TrendingUp, ArrowLeft, Plus, Trash2, AlertCircle, Zap } from 'lucide-react';
import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
  acebet_username: string;
  kick_username: string;
  status: string;
  acebet_wager: number;
  acebet_active: boolean;
}

interface TournamentDetailViewProps {
  tournament: Tournament;
  onBack: () => void;
}

// Format wager amount - API returns in .01 cents (100 = $1)
function formatCurrency(cents: number): string {
  const dollars = (cents || 0) / 100;
  return `$ ${dollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function TournamentDetailView({ tournament, onBack }: TournamentDetailViewProps) {
  const supabase = createClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [aceUsername, setAceUsername] = useState('');
  const [kickUsername, setKickUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(tournament.status);
  const [statusLoading, setStatusLoading] = useState(false);

  const { data: players = [], mutate: refreshPlayers } = useSWR(
    tournament ? `tournament-players-${tournament.id}` : null,
    async () => {
      const { data, error } = await supabase
        .from('tournament_players')
        .select('*')
        .eq('tournament_id', tournament.id);

      if (error) {
        console.error('[v0] Error fetching players:', error);
        return [];
      }
      return data || [];
    }
  );

  const handleAddPlayer = async () => {
    // At least one username is required
    if (!aceUsername.trim() && !kickUsername.trim()) {
      setError('Please enter either an Acebet username or Kick username');
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
          acebetUsername: aceUsername.trim() || null,
          kickUsername: kickUsername.trim() || aceUsername.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to add player');
        setIsLoading(false);
        return;
      }

      setAceUsername('');
      setKickUsername('');
      setShowAddDialog(false);
      refreshPlayers();
    } catch (err) {
      setError('An error occurred while adding the player');
      console.error('[v0] Error adding player:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!confirm('Are you sure you want to remove this player?')) return;

    setIsLoading(true);
    try {
      await supabase
        .from('tournament_players')
        .delete()
        .eq('id', playerId);

      refreshPlayers();
    } catch (err) {
      console.error('[v0] Error removing player:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatusLoading(true);
    try {
      // Use the API endpoint so is_current gets set properly
      const response = await fetch('/api/admin/tournament/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: tournament.id,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        console.error('[v0] Error updating tournament status:', result.error);
        setStatus(tournament.status);
      } else {
        setStatus(newStatus);
      }
    } catch (err) {
      console.error('[v0] Error updating status:', err);
      setStatus(tournament.status);
    } finally {
      setStatusLoading(false);
    }
  };

  const totalWagers = (players as TournamentPlayer[]).reduce((sum, p) => sum + (p.acebet_wager || 0), 0);
  const activePlayers = (players as TournamentPlayer[]).filter(p => p.acebet_active).length;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Tournaments
        </Button>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold">{tournament.name}</h1>
                  <Badge className="text-base">{status === 'registration' ? 'REGISTERING' : status === 'live' ? 'LIVE' : 'CLOSED'}</Badge>
            </div>
            <div className="flex gap-3 items-end">
              <div className="w-48">
                <label className="text-sm font-medium text-muted-foreground">Tournament Status</label>
                <Select value={status} onValueChange={setStatus} disabled={statusLoading}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registration">REGISTERING</SelectItem>
                    <SelectItem value="live">LIVE</SelectItem>
                    <SelectItem value="completed">CLOSED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => handleStatusChange(status)}
                disabled={statusLoading || status === tournament.status}
                size="sm"
              >
                {statusLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground">{tournament.game_name} • ${tournament.bet_amount} bet</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary opacity-60" />
              <div>
                <p className="text-sm text-muted-foreground">Players</p>
                <p className="text-2xl font-bold">{players.length}/{tournament.max_players}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Active Players</p>
              <p className="text-2xl font-bold">{activePlayers}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Wagers</p>
              <p className="text-2xl font-bold">{formatCurrency(totalWagers)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="players" className="space-y-4">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="players" className="gap-2">
            <Users className="h-4 w-4" />
            Players
          </TabsTrigger>
          <TabsTrigger value="bracket" className="gap-2">
            <Zap className="h-4 w-4" />
            Bracket
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tournament Entrants</CardTitle>
              <Button onClick={() => setShowAddDialog(true)} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Player
              </Button>
            </CardHeader>
            <CardContent>
              {players.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No players registered</p>
              ) : (
                <div className="space-y-2">
                  {(players as TournamentPlayer[]).map(player => (
                    <div key={player.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{player.acebet_username}</p>
                        <p className="text-sm text-muted-foreground">@{player.kick_username}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(player.acebet_wager)}</p>
                          <Badge variant={player.acebet_active ? 'default' : 'outline'} className="text-xs mt-1">
                            {player.acebet_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePlayer(player.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bracket Tab */}
        <TabsContent value="bracket" className="space-y-4">
          <div className="grid gap-6">
            <BracketGenerator tournament={tournament} />
            <BracketManager tournament={tournament} />
          </div>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Players</p>
                    <p className="text-2xl font-bold">{players.length}</p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground">Active Players</p>
                    <p className="text-2xl font-bold">{activePlayers}</p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg col-span-2">
                    <p className="text-sm text-muted-foreground">Total Wagers</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalWagers)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Player to Tournament</DialogTitle>
            <DialogDescription>
              Enter at least one username (Acebet or Kick). If Acebet is provided, stats will be verified via the API.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Acebet Username</label>
              <Input
                placeholder="Enter Acebet username"
                value={aceUsername}
                onChange={e => {
                  setAceUsername(e.target.value);
                  setError('');
                }}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Optional - if provided, stats will be pulled from API
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Kick Username</label>
              <Input
                placeholder="Enter Kick username"
                value={kickUsername}
                onChange={e => setKickUsername(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Optional - at least one username is required
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleAddPlayer} disabled={isLoading || (!aceUsername.trim() && !kickUsername.trim())} className="gap-2">
                {isLoading ? 'Adding...' : 'Add Player'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
