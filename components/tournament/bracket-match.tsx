"use client";

import { cn } from "@/lib/utils";
import type { BracketMatchWithPlayers } from "@/lib/types/tournament";
import { Crown, Clock, Swords } from "lucide-react";

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
  const isPending = !hasWinner && !matchInProgress;

  return (
    <div
      className={cn(
        "relative w-56 rounded-lg border bg-card overflow-hidden transition-all duration-300",
        matchInProgress &&
          "border-primary/60 shadow-md shadow-primary/10 ring-1 ring-primary/20",
        hasWinner && !matchInProgress && "border-border/40 opacity-85",
        isPending && "border-border/40"
      )}
    >
      {/* Top status strip */}
      <div
        className={cn(
          "h-0.5 w-full",
          matchInProgress && "bg-primary animate-pulse",
          hasWinner && "bg-green-500/50",
          isPending && "bg-border/30"
        )}
      />

      {/* Match header */}
      <div className="flex items-center justify-between px-2.5 pt-2 pb-1">
        <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wide">
          Match #{match.match_number}
        </span>
        {matchInProgress && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Live
          </span>
        )}
        {hasWinner && !matchInProgress && (
          <Crown className="h-3 w-3 text-yellow-500" />
        )}
        {isPending && (
          <Clock className="h-3 w-3 text-muted-foreground/40" />
        )}
      </div>

      {/* Players */}
      <div className="px-2 pb-2.5 space-y-1">
        <PlayerRow
          player={match.player1}
          score={match.player1_score}
          isWinner={player1Won}
          isLoser={hasWinner && !player1Won && !!match.player1}
          matchInProgress={matchInProgress}
        />

        <div className="flex items-center gap-1.5 px-1">
          <div className="flex-1 h-px bg-border/30" />
          <Swords className="h-2.5 w-2.5 text-muted-foreground/30" />
          <div className="flex-1 h-px bg-border/30" />
        </div>

        <PlayerRow
          player={match.player2}
          score={match.player2_score}
          isWinner={player2Won}
          isLoser={hasWinner && !player2Won && !!match.player2}
          matchInProgress={matchInProgress}
        />
      </div>
    </div>
  );
}

interface PlayerRowProps {
  player: BracketMatchWithPlayers["player1"];
  score: number | null;
  isWinner: boolean;
  isLoser: boolean;
  matchInProgress: boolean;
}

function PlayerRow({ player, score, isWinner, isLoser, matchInProgress }: PlayerRowProps) {
  if (!player) {
    return (
      <div className="flex items-center justify-between rounded-md border border-dashed border-border/30 bg-muted/20 px-2.5 py-1.5">
        <span className="text-xs italic text-muted-foreground/50">TBD</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md px-2.5 py-1.5 transition-all",
        isWinner && "bg-green-500/15 border border-green-500/30",
        isLoser && "bg-muted/20 border border-border/20 opacity-50",
        !isWinner &&
          !isLoser &&
          matchInProgress &&
          "bg-primary/8 border border-primary/20",
        !isWinner && !isLoser && !matchInProgress && "bg-muted/30 border border-border/20"
      )}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {isWinner && <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />}
        <span
          className={cn(
            "text-xs font-medium truncate max-w-[110px]",
            isWinner && "text-green-400",
            isLoser && "text-muted-foreground line-through",
            !isWinner && !isLoser && "text-foreground"
          )}
        >
          {player.display_name ?? player.kick_username ?? "Unknown"}
        </span>
      </div>
      {score !== null && (
        <span
          className={cn(
            "text-xs font-bold tabular-nums font-mono ml-2 flex-shrink-0",
            isWinner && "text-green-400",
            isLoser && "text-muted-foreground",
            matchInProgress && !isWinner && !isLoser && "text-primary"
          )}
        >
          {score.toFixed(2)}x
        </span>
      )}
    </div>
  );
}
