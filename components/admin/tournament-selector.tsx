'use client';

import { useState, useEffect } from 'react';
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
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'registration':
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
      case 'live':
        return 'bg-primary/10 text-primary border border-primary/25';
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'completed':
        return 'bg-muted text-muted-foreground border border-border/50';
      case 'cancelled':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground border border-border/50';
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
      {/* Header: count + filter pills + create button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-muted-foreground">
            {filteredTournaments.length} of {tournaments.length} shown
          </span>
          <Button
            variant={filters.showLive ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5 rounded-full"
            onClick={() => setFilters({ ...filters, showLive: !filters.showLive })}
          >
            {filters.showLive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            Live
          </Button>
          <Button
            variant={filters.showRegistering ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5 rounded-full"
            onClick={() => setFilters({ ...filters, showRegistering: !filters.showRegistering })}
          >
            {filters.showRegistering ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            Registering
          </Button>
          <Button
            variant={filters.showClosed ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5 rounded-full"
            onClick={() => setFilters({ ...filters, showClosed: !filters.showClosed })}
          >
            {filters.showClosed ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            Closed
          </Button>
        </div>
        <Button onClick={onCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Tournament
        </Button>
      </div>

      {/* Tournaments Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTournaments.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/60 py-16 text-muted-foreground">
            <AlertCircle className="h-6 w-6 opacity-60" />
            <p className="text-sm">No tournaments match your filters</p>
          </div>
        ) : (
          filteredTournaments.map(tournament => (
            <div
              key={tournament.id}
              onClick={() => onSelectTournament(tournament)}
              className="group flex cursor-pointer flex-col rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_12px_40px_-12px_rgba(80,120,255,0.35)]"
            >
              <div className="flex items-start justify-between gap-3 p-5 pb-4">
                <h3 className="font-bold leading-tight text-foreground text-balance">{tournament.name}</h3>
                <Badge className={`shrink-0 ${getStatusColor(tournament.status)}`}>
                  {getStatusLabel(tournament.status)}
                </Badge>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-4 px-5 pb-5 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Game</p>
                  <p className="mt-0.5 font-medium">{tournament.game_name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Bet</p>
                  <p className="mt-0.5 font-medium tabular-nums">${tournament.bet_amount}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Players</p>
                  <p className="mt-0.5 font-medium tabular-nums">{tournament.player_count}/{tournament.max_players}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Created</p>
                  <p className="mt-0.5 font-medium">{new Date(tournament.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="border-t border-border/50 p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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
            </div>
          ))
        )}
      </div>
    </div>
  );
}
