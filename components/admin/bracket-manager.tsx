'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trophy, X, Check, Swords, Crown, Clock, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
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

const CARD_H = 116;
const CARD_W = 220;
const GAP_X = 36;
const BASE_GAP_Y = 10;

export function BracketManager({ tournament }: { tournament: Tournament }) {
  const {
    matches,
    updateMatchScore,
    setMatchWinner,
    getPlayerName,
    loadBracketForTournament,
  } = useBracket();
  const [editingScore, setEditingScore] = useState<ScoreEditState | null>(null);

  useEffect(() => {
    if (tournament.id) loadBracketForTournament(tournament.id);
  }, [tournament.id, loadBracketForTournament]);

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
    if (isNaN(score1) || isNaN(score2)) return;

    updateMatchScore(matchId, score1, score2);

    const match = matches.find((m) => m.id === matchId);
    if (match && score1 !== score2) {
      const winnerId = score1 > score2 ? match.slotAId : match.slotBId;
      if (winnerId) {
        handleSetWinner(matchId, winnerId);
      }
    }
    setEditingScore(null);
  };

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/40 py-10 text-center">
        <Swords className="h-7 w-7 text-muted-foreground/25" />
        <p className="text-sm text-muted-foreground">No matches yet — generate a bracket first</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card/30 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
        <Trophy className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">Manage Bracket</span>
        <span className="ml-auto text-xs text-muted-foreground">{matches.length} matches</span>
      </div>

      <div className="overflow-x-auto p-4">
        <div className="inline-flex gap-0 pb-2">
          {rounds.map((round, colIdx) => {
            const spacingMult = Math.pow(2, colIdx);
            const gapY = BASE_GAP_Y * spacingMult + CARD_H * (spacingMult - 1);
            const topOffset =
              colIdx === 0 ? 0 : (CARD_H + gapY) / 2 - CARD_H / 2;
            const roundMatches = [...(matchesByRound[round] || [])].sort(
              (a, b) => a.matchIndex - b.matchIndex
            );
            const isFinals = round === rounds[rounds.length - 1];
            const roundLabel = isFinals
              ? 'Finals'
              : `Round ${round + 1}`;

            return (
              <div
                key={round}
                className="flex flex-col"
                style={{ width: CARD_W + GAP_X }}
              >
                {/* Round label */}
                <div
                  className="mb-3 flex items-center justify-center"
                  style={{ width: CARD_W }}
                >
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                      isFinals
                        ? 'border-yellow-500/30 bg-yellow-500/8 text-yellow-500'
                        : 'border-primary/25 bg-primary/6 text-primary/80'
                    )}
                  >
                    {roundLabel}
                  </span>
                </div>

                <div
                  className="flex flex-col"
                  style={{ gap: gapY, paddingTop: topOffset }}
                >
                  {roundMatches.map((match) => {
                    const isEditing = editingScore?.matchId === match.id;
                    const isDone = match.status === 'completed';
                    const isLive = match.status === 'live';
                    const isBye = match.slotBId === null && match.slotAId !== null;
                    const p1 = getPlayerName(match.slotAId);
                    const p2 = getPlayerName(match.slotBId);
                    const p1Wins = isDone && match.winnerId === match.slotAId;
                    const p2Wins = isDone && match.winnerId === match.slotBId;
                    const tieBreak =
                      match.player1Score > 0 &&
                      match.player2Score > 0 &&
                      match.player1Score === match.player2Score;

                    return (
                      <div
                        key={match.id}
                        className={cn(
                          'rounded-lg border bg-card overflow-hidden transition-all',
                          isLive && 'border-primary/40 ring-1 ring-primary/20',
                          isDone && 'border-border/30 opacity-80',
                          !isLive && !isDone && 'border-border/35'
                        )}
                        style={{ width: CARD_W }}
                      >
                        {/* Top strip */}
                        <div
                          className={cn(
                            'h-0.5',
                            isLive && 'bg-primary animate-pulse',
                            isDone && 'bg-green-500/40',
                            !isLive && !isDone && 'bg-border/20'
                          )}
                        />

                        {/* Match header */}
                        <div className="flex items-center justify-between px-2.5 pt-1.5 pb-0.5">
                          <span className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-wide">
                            Match {match.matchIndex + 1}
                          </span>
                          <span>
                            {isDone && <Crown className="h-3 w-3 text-yellow-500/70" />}
                            {isLive && (
                              <Badge className="h-4 px-1.5 text-[9px] border-primary/30 bg-primary/10 text-primary rounded-full">
                                LIVE
                              </Badge>
                            )}
                            {!isDone && !isLive && (
                              <Clock className="h-3 w-3 text-muted-foreground/25" />
                            )}
                          </span>
                        </div>

                        <div className="px-2 pb-2.5 space-y-1">
                          {isBye ? (
                            /* BYE match */
                            <div className="rounded-md border border-primary/20 bg-primary/8 px-2.5 py-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground truncate">
                                  {p1 || 'TBD'}
                                </span>
                                <span className="text-[10px] font-bold text-primary ml-2">
                                  BYE
                                </span>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Player A */}
                              <AdminSlot
                                name={p1}
                                score={match.player1Score}
                                isWinner={p1Wins}
                                isLoser={isDone && !p1Wins && !!match.slotAId}
                                isLive={isLive}
                                isEmpty={!match.slotAId}
                              />

                              <div className="flex items-center gap-1 px-1">
                                <div className="flex-1 h-px bg-border/25" />
                                <Swords className="h-2 w-2 text-muted-foreground/25" />
                                <div className="flex-1 h-px bg-border/25" />
                              </div>

                              {/* Player B */}
                              <AdminSlot
                                name={p2}
                                score={match.player2Score}
                                isWinner={p2Wins}
                                isLoser={isDone && !p2Wins && !!match.slotBId}
                                isLive={isLive}
                                isEmpty={!match.slotBId}
                              />

                              {/* Score editor */}
                              {isEditing ? (
                                <div className="pt-1.5 space-y-1">
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
                                    placeholder={`${p1 || 'P1'} score`}
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
                                    placeholder={`${p2 || 'P2'} score`}
                                    className="h-7 text-xs"
                                  />
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      className="flex-1 h-7 text-xs gap-1"
                                      onClick={() => handleSaveScore(match.id)}
                                    >
                                      <Check className="h-3 w-3" />
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 w-7 p-0"
                                      onClick={() => setEditingScore(null)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="pt-1.5 space-y-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full h-7 text-xs gap-1.5"
                                    disabled={isDone}
                                    onClick={() =>
                                      setEditingScore({
                                        matchId: match.id,
                                        score1: String(match.player1Score || ''),
                                        score2: String(match.player2Score || ''),
                                      })
                                    }
                                  >
                                    <Edit3 className="h-3 w-3" />
                                    {isDone ? 'Completed' : 'Set Scores'}
                                  </Button>

                                  {/* Tie-break buttons */}
                                  {tieBreak && !isDone && (
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        className="flex-1 h-7 text-[11px] bg-primary/80 hover:bg-primary"
                                        onClick={() =>
                                          handleSetWinner(
                                            match.id,
                                            match.slotAId || ''
                                          )
                                        }
                                      >
                                        <Crown className="h-3 w-3 mr-1" />
                                        {p1 || 'P1'}
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="flex-1 h-7 text-[11px] bg-primary/80 hover:bg-primary"
                                        onClick={() =>
                                          handleSetWinner(
                                            match.id,
                                            match.slotBId || ''
                                          )
                                        }
                                      >
                                        <Crown className="h-3 w-3 mr-1" />
                                        {p2 || 'P2'}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface AdminSlotProps {
  name: string;
  score: number;
  isWinner: boolean;
  isLoser: boolean;
  isLive: boolean;
  isEmpty: boolean;
}

function AdminSlot({ name, score, isWinner, isLoser, isLive, isEmpty }: AdminSlotProps) {
  if (isEmpty) {
    return (
      <div className="flex items-center rounded-md border border-dashed border-border/25 bg-muted/10 px-2.5 py-1.5">
        <span className="text-xs italic text-muted-foreground/40">TBD</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-md px-2.5 py-1.5 transition-all',
        isWinner && 'bg-green-500/12 border border-green-500/25',
        isLoser && 'bg-muted/10 border border-border/15 opacity-50',
        !isWinner && !isLoser && isLive && 'bg-primary/8 border border-primary/20',
        !isWinner && !isLoser && !isLive && 'bg-muted/20 border border-border/15'
      )}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {isWinner && <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />}
        <span
          className={cn(
            'text-xs font-semibold truncate',
            isWinner && 'text-green-400',
            isLoser && 'text-muted-foreground line-through',
            !isWinner && !isLoser && 'text-foreground'
          )}
        >
          {name || '—'}
        </span>
      </div>
      {score > 0 && (
        <span
          className={cn(
            'text-[11px] font-bold font-mono ml-1.5 flex-shrink-0 tabular-nums',
            isWinner && 'text-green-400',
            isLoser && 'text-muted-foreground/50',
            !isWinner && !isLoser && 'text-foreground'
          )}
        >
          {score.toFixed(2)}x
        </span>
      )}
    </div>
  );
}
