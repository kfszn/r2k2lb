"use client";

import { BracketMatch } from "./bracket-match";
import type { BracketMatchWithPlayers } from "@/lib/types/tournament";
import { calculateRoundName } from "@/lib/tournament/client-utils";

interface BracketViewProps {
  matches: BracketMatchWithPlayers[];
  totalRounds: number;
}

export function BracketView({ matches, totalRounds }: BracketViewProps) {
  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, BracketMatchWithPlayers[]>);

  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  if (rounds.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-card/50">
        <p className="text-muted-foreground">No matches yet. Waiting for tournament to start.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max gap-8 p-4">
        {rounds.map((round) => (
          <RoundColumn
            key={round}
            round={round}
            matches={matchesByRound[round]}
            totalRounds={totalRounds}
            isLastRound={round === totalRounds}
          />
        ))}
      </div>
    </div>
  );
}

interface RoundColumnProps {
  round: number;
  matches: BracketMatchWithPlayers[];
  totalRounds: number;
  isLastRound: boolean;
}

function RoundColumn({ round, matches, totalRounds, isLastRound }: RoundColumnProps) {
  const roundName = calculateRoundName(round, totalRounds);
  
  // Calculate spacing based on round - later rounds need more spacing
  const spacing = Math.pow(2, round - 1);
  
  return (
    <div className="flex flex-col">
      {/* Round header */}
      <div className="mb-4 text-center">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
          {roundName}
        </h3>
        <p className="text-xs text-muted-foreground">
          {matches.length} {matches.length === 1 ? "match" : "matches"}
        </p>
      </div>

      {/* Matches */}
      <div
        className="flex flex-1 flex-col justify-around gap-4"
        style={{ minHeight: `${matches.length * 120 * spacing}px` }}
      >
        {matches.map((match) => (
          <div
            key={match.id}
            className="w-64"
            style={{ marginTop: round > 1 ? `${(spacing - 1) * 60}px` : 0 }}
          >
            <BracketMatch
              match={match}
              roundName={roundName}
              isLive={match.status === "in_progress"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
