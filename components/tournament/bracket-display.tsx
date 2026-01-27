'use client';

import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import { useBracket } from '@/lib/bracket-context';

export function BracketDisplay() {
  const { matches, getPlayerName } = useBracket();

  // Group matches by round index (same as admin bracket-manager)
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

  if (matches.length === 0) {
    return (
      <div className="border-0 bg-gradient-to-br from-background to-secondary/20 rounded-lg p-8">
        <div className="flex flex-col items-center justify-center text-center py-8">
          <Trophy className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">Bracket will appear here when generated</p>
        </div>
      </div>
    );
  }

  return (
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
              {matchesByRound[round]?.map((match) => (
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
                      {/* Bye Match (slot B is null but slot A has a player) */}
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
                            className={`p-1.5 rounded transition-all duration-200 text-xs ${
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
                            className={`p-1.5 rounded transition-all duration-200 text-xs ${
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
              ))}
            </div>
          </div>
        ))}

        {/* Champion Section */}
        {matches.some((m) => m.status === 'completed' && m.roundIndex === rounds.length - 1) && (
          <div className="flex flex-col items-center justify-center min-w-fit ml-2">
            <div className="text-center mb-2 px-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-primary/80">Champion</h3>
            </div>
            {matches
              .filter((m) => m.roundIndex === rounds.length - 1 && m.winnerId)
              .map((m) => (
                <div
                  key={m.id}
                  className="w-56 rounded-lg border-2 border-primary/60 shadow-lg overflow-hidden bg-gradient-to-br from-primary/20 via-card to-primary/5"
                >
                  <div className="p-3 text-center">
                    <Trophy className="h-8 w-8 mx-auto mb-1 text-primary" />
                    <p className="text-sm font-bold text-foreground truncate">
                      {getPlayerName(m.winnerId)}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">
                      Winner
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
