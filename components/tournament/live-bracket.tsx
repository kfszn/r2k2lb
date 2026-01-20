"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BracketMatch, TournamentPlayer } from "@/lib/types/tournament";
import { Crown, Swords } from "lucide-react";

interface LiveBracketProps {
  matches: BracketMatch[];
  players: TournamentPlayer[];
}

export function LiveBracket({ matches, players }: LiveBracketProps) {
  const getPlayerName = (playerId: string | null) => {
    if (!playerId) return null;
    const player = players.find((p) => p.id === playerId);
    return player?.acebet_username || "TBD";
  };

  // Group matches by round
  const rounds = matches.reduce<Record<number, BracketMatch[]>>((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {});

  const roundNames: Record<number, string> = {
    1: "Round 1",
    2: "Quarter Finals",
    3: "Semi Finals",
    4: "Finals",
  };

  const getRoundName = (round: number, totalRounds: number) => {
    const roundsFromEnd = totalRounds - round + 1;
    if (roundsFromEnd === 1) return "Finals";
    if (roundsFromEnd === 2) return "Semi Finals";
    if (roundsFromEnd === 3) return "Quarter Finals";
    return `Round ${round}`;
  };

  const totalRounds = Math.max(...Object.keys(rounds).map(Number), 0);

  if (matches.length === 0) {
    return (
      <Card className="bg-card/50 border-border/50 backdrop-blur p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <Swords className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-lg font-medium text-foreground">Bracket Not Generated</p>
          <p className="text-sm text-muted-foreground mt-1">
            Waiting for registration to close and bracket to be generated...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-8 min-w-max">
        {Object.entries(rounds)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([round, roundMatches]) => (
            <div key={round} className="flex flex-col gap-4">
              <div className="text-center">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  {getRoundName(Number(round), totalRounds)}
                </Badge>
              </div>
              <div
                className="flex flex-col justify-around gap-4"
                style={{ minHeight: `${roundMatches.length * 140}px` }}
              >
                {roundMatches
                  .sort((a, b) => a.match_number - b.match_number)
                  .map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      player1Name={getPlayerName(match.player1_id)}
                      player2Name={getPlayerName(match.player2_id)}
                      winnerName={match.winner_id ? getPlayerName(match.winner_id) : null}
                      isFinal={Number(round) === totalRounds}
                    />
                  ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

interface MatchCardProps {
  match: BracketMatch & {
    player1_slot_name?: string | null;
    player1_slot_type?: string | null;
    player2_slot_name?: string | null;
    player2_slot_type?: string | null;
  };
  player1Name: string | null;
  player2Name: string | null;
  winnerName: string | null;
  isFinal: boolean;
}

function MatchCard({ match, player1Name, player2Name, winnerName, isFinal }: MatchCardProps) {
  const isLive = match.status === "in_progress";
  const isComplete = match.status === "completed";
  const isPlayer1Winner = match.winner_id === match.player1_id;
  const isPlayer2Winner = match.winner_id === match.player2_id;

  return (
    <Card
      className={cn(
        "w-72 overflow-hidden border transition-all",
        isLive && "border-primary ring-2 ring-primary/20",
        isComplete && "border-border/50 opacity-90",
        isFinal && isComplete && "border-yellow-500/50 ring-2 ring-yellow-500/20"
      )}
    >
      {isLive && (
        <div className="bg-primary px-3 py-1 text-center">
          <span className="text-xs font-bold text-primary-foreground uppercase tracking-wider flex items-center justify-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
        </div>
      )}
      {isFinal && isComplete && (
        <div className="bg-yellow-500 px-3 py-1 text-center">
          <span className="text-xs font-bold text-black uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Crown className="h-3 w-3" />
            CHAMPION
          </span>
        </div>
      )}
      <div className="p-3 space-y-2 bg-card">
        {/* Player 1 */}
        <PlayerSlot
          name={player1Name}
          multiplier={match.player1_score}
          slotName={match.player1_slot_name}
          slotType={match.player1_slot_type}
          isWinner={isPlayer1Winner}
          isLoser={isComplete && !isPlayer1Winner && player1Name !== null}
        />
        
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-medium">VS</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Player 2 */}
        <PlayerSlot
          name={player2Name}
          multiplier={match.player2_score}
          slotName={match.player2_slot_name}
          slotType={match.player2_slot_type}
          isWinner={isPlayer2Winner}
          isLoser={isComplete && !isPlayer2Winner && player2Name !== null}
        />
      </div>
    </Card>
  );
}

interface PlayerSlotProps {
  name: string | null;
  multiplier: number | null;
  slotName?: string | null;
  slotType?: string | null;
  isWinner: boolean;
  isLoser: boolean;
}

function PlayerSlot({ name, multiplier, slotName, slotType, isWinner, isLoser }: PlayerSlotProps) {
  return (
    <div
      className={cn(
        "rounded-md px-3 py-2 transition-colors",
        !name && "bg-muted/30 border border-dashed border-border",
        name && !isWinner && !isLoser && "bg-muted/50",
        isWinner && "bg-green-500/20 border border-green-500/50",
        isLoser && "bg-muted/30 opacity-60"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isWinner && <Crown className="h-4 w-4 text-yellow-500" />}
          <span
            className={cn(
              "font-medium truncate max-w-[120px]",
              !name && "text-muted-foreground italic",
              isWinner && "text-green-400",
              isLoser && "text-muted-foreground line-through"
            )}
          >
            {name || "TBD"}
          </span>
        </div>
        {multiplier !== null && (
          <Badge
            variant={isWinner ? "default" : "secondary"}
            className={cn(
              "font-mono font-bold",
              isWinner && "bg-green-500 text-white"
            )}
          >
            {multiplier.toFixed(2)}x
          </Badge>
        )}
      </div>
      {/* Slot Call Display */}
      {slotName && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Slot:</span>
          <span className="text-foreground font-medium truncate max-w-[140px]">{slotName}</span>
          {slotType && (
            <Badge variant="outline" className={cn(
              "text-[10px] px-1.5 py-0",
              slotType === "super" && "border-yellow-500/50 text-yellow-500",
              slotType === "regular" && "border-muted-foreground/50 text-muted-foreground"
            )}>
              {slotType}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
