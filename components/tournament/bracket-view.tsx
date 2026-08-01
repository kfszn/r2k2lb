"use client";

import { BracketMatch } from "./bracket-match";
import type { BracketMatchWithPlayers } from "@/lib/types/tournament";
import { calculateRoundName } from "@/lib/tournament/client-utils";
import { Swords } from "lucide-react";

interface BracketViewProps {
  matches: BracketMatchWithPlayers[];
  totalRounds: number;
}

// Card dimensions (must stay in sync with bracket-match.tsx sizing)
const CARD_H = 108; // px — approximate rendered height of a match card
const CARD_W = 224; // px — w-56 = 224px
const GAP_X = 40; // px — horizontal gap between rounds
const BASE_GAP_Y = 12; // px — vertical gap between matches in round 1

export function BracketView({ matches, totalRounds }: BracketViewProps) {
  const matchesByRound = matches.reduce(
    (acc, match) => {
      if (!acc[match.round]) acc[match.round] = [];
      acc[match.round].push(match);
      return acc;
    },
    {} as Record<number, BracketMatchWithPlayers[]>
  );

  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  if (rounds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/40 bg-muted/10 py-16 text-center">
        <Swords className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm font-medium text-muted-foreground">Bracket not generated yet</p>
        <p className="text-xs text-muted-foreground/60">Waiting for registration to close…</p>
      </div>
    );
  }

  // Compute per-round layout
  const roundLayouts = rounds.map((round) => {
    // Spacing multiplier doubles each round: 1, 2, 4, 8…
    const spacingMult = Math.pow(2, round);
    const gapY = BASE_GAP_Y * spacingMult + CARD_H * (spacingMult - 1);
    const topOffset = (CARD_H + gapY) / 2 - CARD_H / 2; // centre first card
    return { round, gapY, topOffset };
  });

  const r0 = matchesByRound[rounds[0]];
  const totalHeight =
    r0.length * CARD_H + (r0.length - 1) * BASE_GAP_Y + 16;

  return (
    <div className="overflow-x-auto pb-4">
      <div
        className="relative inline-flex gap-0"
        style={{
          minHeight: totalHeight,
          paddingTop: 8,
          paddingBottom: 8,
        }}
      >
        {rounds.map((round, colIdx) => {
          const { gapY, topOffset } = roundLayouts[colIdx];
          const roundMatches = [...matchesByRound[round]].sort(
            (a, b) => a.match_number - b.match_number
          );
          const roundName = calculateRoundName(round, totalRounds);
          const isLastRound = round === totalRounds;

          return (
            <div
              key={round}
              className="flex flex-col"
              style={{ width: CARD_W + GAP_X }}
            >
              {/* Round label */}
              <div
                className="flex items-center justify-center mb-3"
                style={{ width: CARD_W }}
              >
                <span
                  className={`rounded-full border px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                    isLastRound
                      ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-500"
                      : "border-primary/30 bg-primary/8 text-primary"
                  }`}
                >
                  {roundName}
                </span>
              </div>

              {/* Match cards with spacing */}
              <div
                className="relative flex flex-col"
                style={{ gap: gapY, paddingTop: topOffset }}
              >
                {roundMatches.map((match) => (
                  <div key={match.id} style={{ width: CARD_W }}>
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
        })}
      </div>
    </div>
  );
}
