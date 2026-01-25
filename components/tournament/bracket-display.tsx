'use client';

import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import { useBracket } from '@/lib/bracket-context';

export function BracketDisplay() {
  const { matches } = useBracket();

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

  const totalRounds = rounds.length;

  if (matches.length === 0) {
    return (
      <div className="border-0 bg-gradient-to-br from-background to-secondary/20 rounded-lg p-8">
        <div className="flex flex-col items-center justify-center text-center py-12">
          <Trophy className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">Bracket will appear here when generated</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="min-w-full flex gap-8 p-6">
        {rounds.map((round, roundIndex) => (
          <div key={round} className="flex flex-col gap-6 min-w-fit">
            {/* Round Label */}
            <div className="text-center mb-2">
              <h3 className="font-bold text-xs uppercase tracking-widest text-primary/80">
                {round === totalRounds ? 'Finals' : `Round ${round}`}
              </h3>
              <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto mt-2" />
            </div>

            {/* Matches in this round */}
            <div className="flex flex-col gap-12">
              {matchesByRound[round]?.map((match) => (
                <div key={match.id} className="relative group">
                  {/* Match Card */}
                  <div className="w-80 rounded-xl border border-primary/20 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-card via-card to-secondary/20">
                    {/* Status bar */}
                    {match.status === 'completed' && (
                      <div className="h-1 bg-gradient-to-r from-primary via-primary to-transparent" />
                    )}
                    {match.status === 'live' && (
                      <div className="h-1 bg-gradient-to-r from-red-500 via-red-400 to-transparent animate-pulse" />
                    )}
                    {match.status === 'pending' && (
                      <div className="h-1 bg-gradient-to-r from-muted via-muted to-transparent" />
                    )}

                    <div className="p-5 space-y-4">
                      {/* Player 1 */}
                      <div
                        className={`p-3 rounded-lg transition-all duration-200 ${
                          match.status === 'completed' && match.winnerId === match.player1?.id
                            ? 'bg-primary/15 border border-primary/40 shadow-md'
                            : 'bg-secondary/30 border border-transparent hover:bg-secondary/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">
                              {match.player1?.acebet_username || 'TBD'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {match.player1 ? 'Registered' : 'Waiting for seed'}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-2xl font-black text-foreground">
                              {match.player1Score || '—'}
                            </div>
                          </div>
                        </div>
                        {match.status === 'completed' && match.winnerId === match.player1?.id && (
                          <div className="mt-2 flex items-center gap-1">
                            <span className="text-xs font-bold text-primary uppercase">✓ Winner</span>
                          </div>
                        )}
                      </div>

                      {/* VS Divider */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
                        <span className="text-xs font-bold text-muted-foreground/60 uppercase px-1">
                          vs
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
                      </div>

                      {/* Player 2 */}
                      <div
                        className={`p-3 rounded-lg transition-all duration-200 ${
                          match.status === 'completed' && match.winnerId === match.player2?.id
                            ? 'bg-primary/15 border border-primary/40 shadow-md'
                            : 'bg-secondary/30 border border-transparent hover:bg-secondary/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">
                              {match.player2?.acebet_username || 'TBD'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {match.player2 ? 'Registered' : 'Waiting for seed'}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-2xl font-black text-foreground">
                              {match.player2Score || '—'}
                            </div>
                          </div>
                        </div>
                        {match.status === 'completed' && match.winnerId === match.player2?.id && (
                          <div className="mt-2 flex items-center gap-1">
                            <span className="text-xs font-bold text-primary uppercase">✓ Winner</span>
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="pt-2 flex gap-2">
                        {match.status === 'completed' && (
                          <Badge className="flex-1 justify-center bg-primary/20 text-primary hover:bg-primary/25 border border-primary/40">
                            Completed
                          </Badge>
                        )}
                        {match.status === 'live' && (
                          <Badge className="flex-1 justify-center bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/20 animate-pulse">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                              Live
                            </span>
                          </Badge>
                        )}
                        {match.status === 'pending' && (
                          <Badge className="flex-1 justify-center bg-muted/40 text-muted-foreground border border-border/40 hover:bg-muted/50">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Connector line to next round */}
                  {roundIndex < rounds.length - 1 && (
                    <div className="absolute top-1/2 -right-8 w-8 h-px bg-gradient-to-r from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Champion Section */}
        {matches.some((m) => m.status === 'completed' && m.round === totalRounds) && (
          <div className="flex flex-col items-center justify-center min-w-fit ml-4">
            <div className="text-center mb-6">
              <h3 className="font-bold text-xs uppercase tracking-widest text-primary/80">
                Champion
              </h3>
              <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto mt-2" />
            </div>
            {matches
              .filter((m) => m.round === totalRounds && m.winnerId)
              .map((m) => (
                <div
                  key={m.id}
                  className="w-80 rounded-xl border-2 border-primary/60 shadow-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-card to-primary/5"
                >
                  <div className="p-8 text-center">
                    <div className="text-6xl mb-4 animate-bounce">👑</div>
                    <p className="text-2xl font-black text-foreground mb-1">
                      {m.player1?.id === m.winnerId
                        ? m.player1?.acebet_username
                        : m.player2?.acebet_username}
                    </p>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">
                      Tournament Champion
                    </p>
                    <div className="mt-4 flex gap-2 justify-center">
                      <div className="h-1 w-8 bg-gradient-to-r from-primary to-transparent rounded" />
                      <div className="h-1 w-8 bg-gradient-to-r from-transparent via-primary to-transparent rounded" />
                      <div className="h-1 w-8 bg-gradient-to-r to-primary from-transparent rounded" />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
