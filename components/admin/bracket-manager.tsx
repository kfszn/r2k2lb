'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight, Trophy, X, Check } from 'lucide-react';
import { useBracket } from '@/lib/bracket-context';

interface Tournament {
  id: string;
  name: string;
  status: string;
}

interface ScoreEditState {
  matchId: string;
  score1: string;
  score2: string;
}

export function BracketManager({ tournament }: { tournament: Tournament }) {
  const { matches, updateMatchScore, setMatchWinner } = useBracket();
  const [editingScore, setEditingScore] = useState<ScoreEditState | null>(null);

  // Group matches by round
  const matchesByRound = matches.reduce(
    (acc, match) => {
      if (!acc[match.round]) acc[match.round] = [];
      acc[match.round].push(match);
      return acc;
    },
    {} as Record<number, typeof matches>
  );

  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  const handleSetWinner = (matchId: string, winnerId: string) => {
    setMatchWinner(matchId, winnerId);
  };

  const handleSaveScore = (matchId: string) => {
    if (!editingScore) return;

    const score1 = parseInt(editingScore.score1, 10);
    const score2 = parseInt(editingScore.score2, 10);

    if (isNaN(score1) || isNaN(score2)) {
      alert('Please enter valid numbers for both scores');
      return;
    }

    // Update scores
    updateMatchScore(matchId, score1, score2);

    // Auto-determine winner based on higher score
    const match = matches.find(m => m.id === matchId);
    if (match && score1 !== score2) {
      const winnerId = score1 > score2 ? match.player1?.id : match.player2?.id;
      if (winnerId) {
        setMatchWinner(matchId, winnerId);
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
        <div className="space-y-8">
          {rounds.map((round) => (
            <div key={round} className="space-y-4">
              <h3 className="font-semibold text-sm text-foreground">Round {round}</h3>
              <div className="space-y-3">
                {matchesByRound[round]?.map((match) => {
                  const isEditing = editingScore?.matchId === match.id;

                  return (
                    <div key={match.id} className="border border-border rounded-lg p-4 bg-card/50">
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex-1">
                            <p className="font-medium">
                              {match.player1?.kick_username || match.player1?.acebet_username || 'TBD'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Score: {match.player1Score}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
                          <div className="flex-1 text-right">
                            <p className="font-medium">
                              {match.player2?.kick_username || match.player2?.acebet_username || 'TBD'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Score: {match.player2Score}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2 flex-wrap">
                        {match.player1 && match.player2 && (
                          <>
                            {isEditing ? (
                              <>
                                <Input
                                  type="number"
                                  min="0"
                                  value={editingScore.score1}
                                  onChange={(e) =>
                                    setEditingScore({
                                      ...editingScore,
                                      score1: e.target.value,
                                    })
                                  }
                                  placeholder={`${match.player1?.kick_username || match.player1?.acebet_username} score`}
                                  className="flex-1"
                                />
                                <Input
                                  type="number"
                                  min="0"
                                  value={editingScore.score2}
                                  onChange={(e) =>
                                    setEditingScore({
                                      ...editingScore,
                                      score2: e.target.value,
                                    })
                                  }
                                  placeholder={`${match.player2?.kick_username || match.player2?.acebet_username} score`}
                                  className="flex-1"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSaveScore(match.id)}
                                  className="gap-1"
                                >
                                  <Check className="h-4 w-4" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingScore(null)}
                                  className="gap-1"
                                >
                                  <X className="h-4 w-4" />
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 bg-transparent"
                                  onClick={() =>
                                    setEditingScore({
                                      matchId: match.id,
                                      score1: String(match.player1Score),
                                      score2: String(match.player2Score),
                                    })
                                  }
                                >
                                  Edit Scores
                                </Button>
                                {match.player1Score > 0 && match.player2Score > 0 && match.player1Score === match.player2Score && (
                                  <>
                                    <Button
                                      size="sm"
                                      className="flex-1"
                                      onClick={() =>
                                        handleSetWinner(match.id, match.player1?.id || '')
                                      }
                                      disabled={match.status === 'completed'}
                                    >
                                      {match.player1?.acebet_username} Wins
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="flex-1"
                                      onClick={() =>
                                        handleSetWinner(match.id, match.player2?.id || '')
                                      }
                                      disabled={match.status === 'completed'}
                                    >
                                      {match.player2?.acebet_username} Wins
                                    </Button>
                                  </>
                                )}
                              </>
                            )}

                            {match.status === 'completed' && (
                              <Button disabled className="w-full" size="sm">
                                ✓ Completed
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
