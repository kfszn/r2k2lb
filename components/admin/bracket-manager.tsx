'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trophy, X, Check } from 'lucide-react';
import { useBracket } from '@/lib/bracket-context';

interface Tournament {
  id: string;
  name: string;
  status: string;
  prize_pool?: number;
}

interface ScoreEditState {
  matchId: string;
  score1: string;
  score2: string;
}

export function BracketManager({ tournament }: { tournament: Tournament }) {
  const { matches, updateMatchScore, setMatchWinner, getPlayerName, loadBracketForTournament, activeTournamentId } = useBracket();
  const [editingScore, setEditingScore] = useState<ScoreEditState | null>(null);

  // Load bracket from DB when this tournament is opened
  useEffect(() => {
    if (tournament.id && tournament.id !== activeTournamentId) {
      loadBracketForTournament(tournament.id);
    }
  }, [tournament.id, activeTournamentId, loadBracketForTournament]);

  // Group matches by round index
  const matchesByRound = matches.reduce(
    (acc, match) => {
      if (!acc[match.roundIndex]) acc[match.roundIndex] = [];
      acc[match.roundIndex].push(match);
      return acc;
    },
    {} as Record<number, typeof matches>
  );

  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  const handleSetWinner = (matchId: string, winnerId: string) => {
    // Pass tournament info so winner can be recorded when bracket completes
    setMatchWinner(matchId, winnerId, {
      id: tournament.id,
      name: tournament.name,
      prize: tournament.prize_pool || 0,
    });
  };

  const handleSaveScore = (matchId: string) => {
    if (!editingScore) return;

    const score1 = parseFloat(editingScore.score1);
    const score2 = parseFloat(editingScore.score2);

    if (isNaN(score1) || isNaN(score2)) {
      alert('Please enter valid numbers for both scores');
      return;
    }

    updateMatchScore(matchId, score1, score2);

    const match = matches.find(m => m.id === matchId);
    if (match && score1 !== score2) {
      const winnerId = score1 > score2 ? match.slotAId : match.slotBId;
      if (winnerId) {
        // Pass tournament info so winner can be recorded when bracket completes
        setMatchWinner(matchId, winnerId, {
          id: tournament.id,
          name: tournament.name,
          prize: tournament.prize_pool || 0,
        });
      }
    }

    setEditingScore(null);
  };

  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manage Bracket</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No matches generated yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Manage Bracket
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto pb-4">
          <div className="inline-flex gap-6 p-2 min-w-full">
            {rounds.map((round) => (
              <div key={round} className="flex flex-col gap-2 min-w-fit">
                {/* Round Label */}
                <div className="text-center mb-2 px-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-primary/80">
                    {round === rounds.length - 1 ? 'FINALS' : `R${round + 1}`}
                  </h3>
                </div>

                {/* Matches in this round */}
                <div className="flex flex-col gap-2">
                  {matchesByRound[round]?.map((match) => {
                    const isEditing = editingScore?.matchId === match.id;

                    return (
                      <div key={match.id} className="relative group">
                        <div className="w-56 rounded-lg border border-primary/20 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden bg-gradient-to-br from-card via-card to-secondary/20">
                          {/* Status bar */}
                          {match.status === 'completed' && (
                            <div className="h-0.5 bg-primary" />
                          )}
                          {match.status === 'live' && (
                            <div className="h-0.5 bg-red-500 animate-pulse" />
                          )}
                          {match.status === 'pending' && match.slotBId !== null && (
                            <div className="h-0.5 bg-muted" />
                          )}

                          <div className="p-2 space-y-1.5">
                            {/* Bye Match (slot is null) */}
                            {match.slotBId === null && match.slotAId !== null ? (
                              <div className="p-2 rounded bg-primary/10 border border-primary/30">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-xs text-foreground truncate">
                                      {getPlayerName(match.slotAId) || 'TBD'}
                                    </p>
                                  </div>
                                  <span className="text-xs font-bold text-primary flex-shrink-0">BYE</span>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* Slot A */}
                                <div
                                  className={`p-1.5 rounded transition-all duration-200 text-xs cursor-pointer hover:border-primary/60 ${
                                    match.status === 'completed' && match.winnerId === match.slotAId
                                      ? 'bg-primary/15 border border-primary/40'
                                      : 'bg-secondary/30 border border-transparent'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-foreground truncate">
                                        {getPlayerName(match.slotAId) || '—'}
                                      </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <span className="font-bold text-foreground">
                                        {match.player1Score || '—'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* VS Divider */}
                                <div className="flex items-center gap-1 py-0.5">
                                  <div className="flex-1 h-px bg-border/40" />
                                  <span className="text-xs font-bold text-muted-foreground/50 px-1">vs</span>
                                  <div className="flex-1 h-px bg-border/40" />
                                </div>

                                {/* Slot B */}
                                <div
                                  className={`p-1.5 rounded transition-all duration-200 text-xs cursor-pointer hover:border-primary/60 ${
                                    match.status === 'completed' && match.winnerId === match.slotBId
                                      ? 'bg-primary/15 border border-primary/40'
                                      : 'bg-secondary/30 border border-transparent'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-foreground truncate">
                                        {getPlayerName(match.slotBId) || '—'}
                                      </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <span className="font-bold text-foreground">
                                        {match.player2Score || '—'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Score Edit Form */}
                                {isEditing ? (
                                  <div className="pt-2 space-y-1.5">
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={editingScore.score1}
                                      onChange={(e) =>
                                        setEditingScore({
                                          ...editingScore,
                                          score1: e.target.value,
                                        })
                                      }
                                      placeholder="Score"
                                      className="h-7 text-xs"
                                    />
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={editingScore.score2}
                                      onChange={(e) =>
                                        setEditingScore({
                                          ...editingScore,
                                          score2: e.target.value,
                                        })
                                      }
                                      placeholder="Score"
                                      className="h-7 text-xs"
                                    />
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleSaveScore(match.id)}
                                        className="flex-1 h-6 text-xs gap-1"
                                      >
                                        <Check className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditingScore(null)}
                                        className="flex-1 h-6 text-xs gap-1"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="pt-1 space-y-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full h-6 text-xs"
                                      onClick={() =>
                                        setEditingScore({
                                          matchId: match.id,
                                          score1: String(match.player1Score || 0),
                                          score2: String(match.player2Score || 0),
                                        })
                                      }
                                      disabled={match.status === 'completed'}
                                    >
                                      Edit Scores
                                    </Button>

                                    {match.player1Score !== undefined && 
                                     match.player2Score !== undefined &&
                                     match.player1Score > 0 && 
                                     match.player2Score > 0 && 
                                     match.player1Score === match.player2Score && (
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          className="flex-1 h-6 text-xs"
                                          onClick={() =>
                                            handleSetWinner(match.id, match.slotAId || '')
                                          }
                                          disabled={match.status === 'completed'}
                                        >
                                          A Wins
                                        </Button>
                                        <Button
                                          size="sm"
                                          className="flex-1 h-6 text-xs"
                                          onClick={() =>
                                            handleSetWinner(match.id, match.slotBId || '')
                                          }
                                          disabled={match.status === 'completed'}
                                        >
                                          B Wins
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Status Badge */}
                                <div className="pt-1">
                                  {match.status === 'completed' && (
                                    <Badge className="w-full justify-center bg-primary/20 text-primary hover:bg-primary/25 border border-primary/40 text-xs h-5">
                                      Done
                                    </Badge>
                                  )}
                                  {match.status === 'live' && (
                                    <Badge className="w-full justify-center bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/20 animate-pulse text-xs h-5">
                                      Live
                                    </Badge>
                                  )}
                                  {match.status === 'pending' && (
                                    <Badge className="w-full justify-center bg-muted/40 text-muted-foreground border border-border/40 hover:bg-muted/50 text-xs h-5">
                                      Pending
                                    </Badge>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
