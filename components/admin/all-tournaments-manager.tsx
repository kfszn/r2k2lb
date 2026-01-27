'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Tournament {
  id: string;
  name: string;
  status: 'pending' | 'registration' | 'live' | 'completed' | 'cancelled';
  game_name: string;
  bet_amount: number;
  max_players: number;
  created_at: string;
  updated_at: string;
}

export function AllTournamentsManager() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    showActive: true,
    showCompleted: true,
    showCancelled: false,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchTournaments = async () => {
    setIsLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[v0] Error fetching tournaments:', error);
    } else {
      setTournaments(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleDelete = async (id: string) => {
    const supabase = createClient();

    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[v0] Error deleting tournament:', error);
      alert('Failed to delete tournament');
    } else {
      setTournaments(tournaments.filter(t => t.id !== id));
      setDeleteConfirm(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-500/10 text-blue-700';
      case 'registration':
        return 'bg-green-500/10 text-green-700';
      case 'live':
        return 'bg-purple-500/10 text-purple-700';
      case 'completed':
        return 'bg-gray-500/10 text-gray-700';
      case 'cancelled':
        return 'bg-red-500/10 text-red-700';
      default:
        return 'bg-gray-500/10 text-gray-700';
    }
  };

  const filteredTournaments = tournaments.filter(t => {
    if (filters.showActive && ['pending', 'registration', 'live'].includes(t.status)) return true;
    if (filters.showCompleted && t.status === 'completed') return true;
    if (filters.showCancelled && t.status === 'cancelled') return true;
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
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              variant={filters.showActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, showActive: !filters.showActive })}
            >
              {filters.showActive ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              Active & Registering
            </Button>
            <Button
              variant={filters.showCompleted ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, showCompleted: !filters.showCompleted })}
            >
              {filters.showCompleted ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              Completed
            </Button>
            <Button
              variant={filters.showCancelled ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, showCancelled: !filters.showCancelled })}
            >
              {filters.showCancelled ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              Cancelled
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tournaments List */}
      <div className="grid gap-4">
        {filteredTournaments.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <AlertCircle className="h-5 w-5" />
              No tournaments match your filters
            </CardContent>
          </Card>
        ) : (
          filteredTournaments.map(tournament => (
            <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{tournament.name}</h3>
                      <Badge className={getStatusColor(tournament.status)}>
                        {tournament.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Game</p>
                        <p className="font-medium">{tournament.game_name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Bet Amount</p>
                        <p className="font-medium">${tournament.bet_amount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Max Players</p>
                        <p className="font-medium">{tournament.max_players}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Created</p>
                        <p className="font-medium">{new Date(tournament.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {deleteConfirm === tournament.id ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(tournament.id)}
                        >
                          Confirm Delete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteConfirm(tournament.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
