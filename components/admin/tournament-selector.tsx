'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Tournament {
  id: string;
  name: string;
  status: 'pending' | 'registration' | 'live' | 'paused' | 'completed' | 'cancelled';
  game_name: string;
  bet_amount: number;
  max_players: number;
  created_at: string;
  is_current?: boolean;
  player_count?: number;
}

interface TournamentSelectorProps {
  onSelectTournament: (tournament: Tournament) => void;
  onCreateNew: () => void;
}

export function TournamentSelector({ onSelectTournament, onCreateNew }: TournamentSelectorProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    showLive: true,
    showRegistering: true,
    showClosed: true,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchTournaments = async () => {
    setIsLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('tournaments')
      .select('*, tournament_players(count)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[v0] Error fetching tournaments:', error);
    } else {
      const tournaments = (data || []).map((t: any) => ({
        ...t,
        player_count: t.tournament_players?.[0]?.count || 0,
      }));
      setTournaments(tournaments);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleDelete = async (id: string) => {
    const supabase = createClient();

    try {
      // Delete related records first
      await supabase.from('tournament_players').delete().eq('tournament_id', id);
      await supabase.from('tournament_matches').delete().eq('tournament_id', id);
      await supabase.from('tournament_chat_log').delete().eq('tournament_id', id);
      
      // Then delete the tournament
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTournaments(tournaments.filter(t => t.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('[v0] Error deleting tournament:', error);
      alert('Failed to delete tournament');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-500/10 text-blue-700';
      case 'registration':
        return 'bg-green-500/10 text-green-700';
      case 'active':
        return 'bg-purple-500/10 text-purple-700';
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-700';
      case 'completed':
        return 'bg-gray-500/10 text-gray-700';
      case 'cancelled':
        return 'bg-red-500/10 text-red-700';
      default:
        return 'bg-gray-500/10 text-gray-700';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'registration':
        return 'Registering';
      case 'live':
        return 'Live';
      case 'paused':
        return 'Paused';
      case 'completed':
        return 'Closed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const filteredTournaments = tournaments.filter(t => {
    if (filters.showLive && t.status === 'live') return true;
    if (filters.showRegistering && ['pending', 'registration', 'paused'].includes(t.status)) return true;
    if (filters.showClosed && ['completed', 'cancelled'].includes(t.status)) return true;
    return false;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading tournaments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create New Button */}
      <div className="flex justify-end">
        <Button onClick={onCreateNew} size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Create New Tournament
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              variant={filters.showLive ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, showLive: !filters.showLive })}
            >
              {filters.showLive ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              Live
            </Button>
            <Button
              variant={filters.showRegistering ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, showRegistering: !filters.showRegistering })}
            >
              {filters.showRegistering ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              Registering
            </Button>
            <Button
              variant={filters.showClosed ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, showClosed: !filters.showClosed })}
            >
              {filters.showClosed ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              Closed
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tournaments Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTournaments.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <AlertCircle className="h-5 w-5" />
              No tournaments match your filters
            </CardContent>
          </Card>
        ) : (
          filteredTournaments.map(tournament => (
            <Card key={tournament.id} className="cursor-pointer hover:shadow-lg transition-shadow flex flex-col" onClick={() => onSelectTournament(tournament)}>
              <CardHeader>
                <div className="space-y-2">
                  <CardTitle className="text-lg">{tournament.name}</CardTitle>
                  <Badge className={getStatusColor(tournament.status)}>
                    {getStatusLabel(tournament.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 flex-1">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Game</p>
                    <p className="font-medium">{tournament.game_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Bet</p>
                    <p className="font-medium">${tournament.bet_amount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Players</p>
                    <p className="font-medium">{tournament.player_count}/{tournament.max_players}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium text-xs">{new Date(tournament.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
              <div className="border-t p-3">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (deleteConfirm === tournament.id) {
                      handleDelete(tournament.id);
                    } else {
                      setDeleteConfirm(tournament.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  {deleteConfirm === tournament.id ? 'Confirm Delete' : 'Delete'}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
