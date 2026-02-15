'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Zap, Trash2 } from 'lucide-react';
import useSWR from 'swr';
import { useBracket } from '@/lib/bracket-context';
import { createClient } from '@/lib/supabase/client';

interface Tournament {
  id: string;
  name: string;
  status: string;
  max_players: number;
}

export function BracketGenerator({ tournament }: { tournament: Tournament }) {
  const supabase = createClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { generateBracket, clearBracket, matches, loadBracketForTournament, activeTournamentId } = useBracket();

  // Load bracket for this tournament on mount
  useEffect(() => {
    console.log('[v0] BracketGenerator - tournament.id:', tournament.id, 'activeTournamentId:', activeTournamentId);
    if (tournament.id) {
      console.log('[v0] BracketGenerator - Loading bracket for tournament:', tournament.id);
      loadBracketForTournament(tournament.id);
    }
  }, [tournament.id, loadBracketForTournament]);

  const { data: players = [] } = useSWR(
    tournament ? `players-${tournament.id}` : null,
    async () => {
      const { data } = await supabase
        .from('tournament_players')
        .select('id, acebet_username, kick_username')
        .eq('tournament_id', tournament.id)
        .eq('status', 'registered');
      return data || [];
    }
  );

  const handleGenerateBracket = async () => {
    if (players.length < 2) {
      setError('Need at least 2 players to generate bracket');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccess('');

    try {
      await generateBracket(players, tournament.id);
      const numRounds = Math.ceil(Math.log2(players.length));
      setSuccess(
        `Bracket generated with ${Math.floor(players.length / 2)} matches across ${numRounds} rounds`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate bracket');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearBracket = async () => {
    if (!confirm('Are you sure you want to clear this bracket? This cannot be undone.')) {
      return;
    }

    try {
      await clearBracket(tournament.id);
      setSuccess('Bracket cleared successfully');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear bracket');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Generate Bracket
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-secondary rounded-lg">
          <p className="text-sm font-medium">Players Registered: {players.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Need at least 2 players</p>
          {matches.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">Current bracket: {matches.length} matches</p>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleGenerateBracket}
            disabled={isGenerating || players.length < 2}
            className="flex-1"
          >
            {isGenerating ? 'Generating...' : 'Generate Bracket'}
          </Button>

          {matches.length > 0 && (
            <Button
              onClick={handleClearBracket}
              variant="destructive"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
