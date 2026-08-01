"use client";

import { cn } from "@/lib/utils";
import type { BracketMatch, TournamentPlayer } from "@/lib/types/tournament";
import { Crown, Swords, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LiveBracketProps {
  matches: BracketMatch[];
  players: TournamentPlayer[];
}

const CARD_H = 108;
const CARD_W = 224;
const GAP_X = 40;
const BASE_GAP_Y = 12;

export function LiveBracket({ matches, players }: LiveBracketProps) {
  const getPlayerName = (playerId: string | null): string => {
    if (!playerId) return "";
    const player = players.find((p) => p.id === playerId);
    return player?.kick_username ?? player?.acebet_username ?? "TBD";
  };

  const rounds = matches.reduce<Record<number, BracketMatch[]>>((acc, match) => {
    const r = match.round ?? match.round_number;
    if (!acc[r]) acc[r] = [];
    acc[r].push(match);
    return acc;
  }, {});

  const roundNums = Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b);

  const totalRounds = roundNums.at(-1) ?? 0;

  const getRoundLabel = (round: number): string => {
    const fromEnd = totalRounds - round + 1;
    if (fromEnd === 1) return "Finals";
    if (fromEnd === 2) return "Semis";
    if (fromEnd === 3) return "Quarters";
    return `Round ${round}`;
  };

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Swords className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm font-medium text-muted-foreground">Bracket not generated yet</p>
        <p className="text-xs text-muted-foreground/60">Waiting for registration to close…</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="inline-flex gap-0 pt-2 pb-2">
        {roundNums.map((round, colIdx) => {
          const spacingMult = Math.pow(2, colIdx);
          const gapY = BASE_GAP_Y * spacingMult + CARD_H * (spacingMult - 1);
          const topOffset = colIdx === 0 ? 0 : (CARD_H + gapY) / 2 - CARD_H / 2;
          const roundMatches = [...rounds[round]].sort(
            (a, b) => a.match_number - b.match_number
          );
          const label = getRoundLabel(round);
          const isFinals = round === totalRounds;

          return (
            <div
              key={round}
              className="flex flex-col"
              style={{ width: CARD_W + GAP_X }}
            >
              {/* Round header */}
              <div
                className="mb-3 flex items-center justify-center"
                style={{ width: CARD_W }}
              >
                <span
                  className={cn(
                    "rounded-full border px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                    isFinals
                      ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-500"
                      : "border-primary/30 bg-primary/8 text-primary"
                  )}
                >
                  {label}
                </span>
              </div>

              {/* Matches */}
              <div
                className="flex flex-col"
                style={{ gap: gapY, paddingTop: topOffset }}
              >
                {roundMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    p1Name={getPlayerName(match.player1_id)}
                    p2Name={getPlayerName(match.player2_id)}
                    isFinals={isFinals}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface MatchCardProps {
  match: BracketMatch;
  p1Name: string;
  p2Name: string;
  isFinals: boolean;
}

function MatchCard({ match, p1Name, p2Name, isFinals }: MatchCardProps) {
  const isLive = match.status === "active" || match.status === "in_progress" as string;
  const isDone = match.status === "completed";
  const p1Won = match.winner_id === match.player1_id;
  const p2Won = match.winner_id === match.player2_id;
  const hasWinner = !!match.winner_id;
  const isBye = match.is_bye;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border bg-card transition-all duration-300",
        isLive && "border-primary/50 shadow-md shadow-primary/10 ring-1 ring-primary/20",
        isDone && !isLive && "border-border/35 opacity-80",
        !isLive && !isDone && "border-border/35"
      )}
      style={{ width: CARD_W }}
    >
      {/* Status strip */}
      <div
        className={cn(
          "h-0.5 w-full",
          isLive && "bg-primary animate-pulse",
          isDone && "bg-green-500/50",
          !isLive && !isDone && "bg-border/20"
        )}
      />

      {/* Header row */}
      <div className="flex items-center justify-between px-2.5 pt-1.5 pb-0.5">
        <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wide">
          #{match.match_number}
        </span>
        <span className="flex items-center gap-1">
          {isLive && (
            <Badge
              variant="outline"
              className="h-4 px-1.5 text-[9px] border-primary/40 bg-primary/10 text-primary"
            >
              LIVE
            </Badge>
          )}
          {isDone && isFinals && hasWinner && (
            <Crown className="h-3 w-3 text-yellow-500" />
          )}
          {isDone && !isFinals && <Crown className="h-3 w-3 text-green-500/70" />}
          {!isLive && !isDone && <Clock className="h-3 w-3 text-muted-foreground/30" />}
        </span>
      </div>

      {/* Players */}
      <div className="px-2 pb-2.5 space-y-1">
        <Slot
          name={p1Name || "TBD"}
          score={match.player1_score}
          isWinner={p1Won}
          isLoser={isDone && !p1Won && !!p1Name}
          isLive={isLive}
          isEmpty={!match.player1_id}
        />

        <div className="flex items-center gap-1 px-1">
          <div className="flex-1 h-px bg-border/25" />
          <Swords className="h-2 w-2 text-muted-foreground/25" />
          <div className="flex-1 h-px bg-border/25" />
        </div>

        {isBye ? (
          <div className="flex items-center justify-center rounded-md border border-dashed border-border/25 py-1.5">
            <span className="text-[10px] font-semibold text-primary/60 uppercase tracking-wider">BYE</span>
          </div>
        ) : (
          <Slot
            name={p2Name || "TBD"}
            score={match.player2_score}
            isWinner={p2Won}
            isLoser={isDone && !p2Won && !!p2Name}
            isLive={isLive}
            isEmpty={!match.player2_id}
          />
        )}
      </div>
    </div>
  );
}

interface SlotProps {
  name: string;
  score: number | null;
  isWinner: boolean;
  isLoser: boolean;
  isLive: boolean;
  isEmpty: boolean;
}

function Slot({ name, score, isWinner, isLoser, isLive, isEmpty }: SlotProps) {
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
        "flex items-center justify-between rounded-md px-2.5 py-1.5 transition-all",
        isWinner && "bg-green-500/12 border border-green-500/30",
        isLoser && "bg-muted/15 border border-border/15 opacity-50",
        !isWinner && !isLoser && isLive && "bg-primary/8 border border-primary/20",
        !isWinner && !isLoser && !isLive && "bg-muted/25 border border-border/15"
      )}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {isWinner && <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />}
        <span
          className={cn(
            "text-xs font-medium truncate",
            isWinner && "text-green-400",
            isLoser && "text-muted-foreground line-through",
            !isWinner && !isLoser && "text-foreground"
          )}
        >
          {name}
        </span>
      </div>
      {score !== null && score > 0 && (
        <span
          className={cn(
            "text-[11px] font-bold font-mono ml-1.5 flex-shrink-0 tabular-nums",
            isWinner && "text-green-400",
            isLoser && "text-muted-foreground/50",
            !isWinner && !isLoser && isLive && "text-primary"
          )}
        >
          {score.toFixed(2)}x
        </span>
      )}
    </div>
  );
}
