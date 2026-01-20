"use client";

import { cn } from "@/lib/utils";
import type { BracketMatchWithPlayers } from "@/lib/types/tournament";
import { Trophy, Clock, Swords } from "lucide-react";

interface BracketMatchProps {
  match: BracketMatchWithPlayers;
  roundName: string;
  isLive?: boolean;
}

export function BracketMatch({ match, roundName, isLive }: BracketMatchProps) {
  const player1Won = match.winner_id === match.player1_id;
  const player2Won = match.winner_id === match.player2_id;
  const hasWinner = match.winner_id !== null;
  const matchInProgress = match.status === "in_progress";

  return (
    <div
      className={cn(
        "relative rounded-lg border bg-card p-3 transition-all duration-300",
        matchInProgress && "border-live ring-2 ring-live/30 shadow-lg shadow-live/20",
        hasWinner && "border-border",
        !hasWinner && !matchInProgress && "border-border/50 opacity-80"
      )}
    >
      {/* Match status indicator */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Match #{match.match_number}
        </span>
        {matchInProgress && (
          <span className="flex items-center gap-1 rounded-full bg-live/20 px-2 py-0.5 text-xs font-semibold text-live">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
            </span>
            LIVE
          </span>
        )}
        {hasWinner && (
          <Trophy className="h-4 w-4 text-winner" />
        )}
        {!hasWinner && !matchInProgress && (
          <Clock className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Players */}
      <div className="space-y-2">
        <PlayerSlot
          player={match.player1}
          score={match.player1_score}
          isWinner={player1Won}
          isLoser={player2Won}
          matchInProgress={matchInProgress}
        />
        
        <div className="flex items-center justify-center">
          <Swords className="h-3 w-3 text-muted-foreground" />
        </div>
        
        <PlayerSlot
          player={match.player2}
          score={match.player2_score}
          isWinner={player2Won}
          isLoser={player1Won}
          matchInProgress={matchInProgress}
        />
      </div>
    </div>
  );
}

interface PlayerSlotProps {
  player: BracketMatchWithPlayers["player1"];
  score: number | null;
  isWinner: boolean;
  isLoser: boolean;
  matchInProgress: boolean;
}

function PlayerSlot({ player, score, isWinner, isLoser, matchInProgress }: PlayerSlotProps) {
  if (!player) {
    return (
      <div className="flex items-center justify-between rounded-md border border-dashed border-border/50 bg-muted/30 px-3 py-2">
        <span className="text-sm italic text-muted-foreground">TBD</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md px-3 py-2 transition-all",
        isWinner && "bg-winner/20 border border-winner/50",
        isLoser && "bg-loser/10 border border-loser/30 opacity-60",
        !isWinner && !isLoser && "bg-secondary border border-border/50",
        matchInProgress && !isWinner && !isLoser && "bg-primary/10 border-primary/30"
      )}
    >
      <div className="flex items-center gap-2">
        {isWinner && <Trophy className="h-3 w-3 text-winner" />}
        <span
          className={cn(
            "text-sm font-medium",
            isWinner && "text-winner",
            isLoser && "text-loser"
          )}
        >
          {player.display_name}
        </span>
      </div>
      
      {score !== null && (
        <span
          className={cn(
            "rounded bg-background/50 px-2 py-0.5 text-xs font-bold tabular-nums",
            isWinner && "text-winner",
            isLoser && "text-loser",
            matchInProgress && "animate-pulse"
          )}
        >
          {score.toFixed(2)}x
        </span>
      )}
    </div>
  );
}
