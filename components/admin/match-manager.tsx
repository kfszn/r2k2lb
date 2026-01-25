"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { TournamentWithDetails, BracketMatchWithPlayers } from "@/lib/types/tournament";
import { calculateRoundName } from "@/lib/tournament/client-utils";
import { cn } from "@/lib/utils";
import { Play, Trophy, Loader2, Edit2 } from "lucide-react";

interface MatchManagerProps {
  tournament: TournamentWithDetails;
  onUpdate: () => void;
}

export function MatchManager({ tournament, onUpdate }: MatchManagerProps) {
  const [selectedMatch, setSelectedMatch] = useState<BracketMatchWithPlayers | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [player1Score, setPlayer1Score] = useState("");
  const [player2Score, setPlayer2Score] = useState("");

  const totalRounds = tournament.matches.length > 0
    ? Math.max(...tournament.matches.map((m) => m.round))
    : 0;

  const matchesByRound = tournament.matches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match as BracketMatchWithPlayers);
    return acc;
  }, {} as Record<number, BracketMatchWithPlayers[]>);

  const openScoreDialog = (match: BracketMatchWithPlayers) => {
    setSelectedMatch(match);
    setPlayer1Score(match.player1_score?.toString() || "");
    setPlayer2Score(match.player2_score?.toString() || "");
  };

  const handleStartMatch = async (matchId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/match/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });

      if (!response.ok) throw new Error("Failed to start match");
      onUpdate();
    } catch (error) {
      console.error("Error starting match:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitScore = async () => {
    if (!selectedMatch) return;

    setIsLoading(true);
    try {
      const p1Score = parseFloat(player1Score);
      const p2Score = parseFloat(player2Score);

      const response = await fetch("/api/admin/match/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          player1Score: p1Score,
          player2Score: p2Score,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit score");

      setSelectedMatch(null);
      onUpdate();
    } catch (error) {
      console.error("Error submitting score:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (tournament.matches.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">
            Start the tournament to generate the bracket
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {Object.entries(matchesByRound).map(([round, matches]) => (
          <Card key={round}>
            <CardHeader>
              <CardTitle className="text-lg">
                {calculateRoundName(parseInt(round), totalRounds)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {matches.map((match) => (
                  <MatchRow
                    key={match.id}
                    match={match}
                    onStart={() => handleStartMatch(match.id)}
                    onEdit={() => openScoreDialog(match)}
                    isLoading={isLoading}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Score entry dialog */}
      <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Match Results</DialogTitle>
            <DialogDescription>
              Enter the final multiplier scores for each player
            </DialogDescription>
          </DialogHeader>

          {selectedMatch && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="player1-score">
                  {selectedMatch.player1?.kick_username || selectedMatch.player1?.acebet_username || selectedMatch.player1?.display_name || "Player 1"} Score
                </Label>
                <Input
                  id="player1-score"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 125.50"
                  value={player1Score}
                  onChange={(e) => setPlayer1Score(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="player2-score">
                  {selectedMatch.player2?.kick_username || selectedMatch.player2?.acebet_username || selectedMatch.player2?.display_name || "Player 2"} Score
                </Label>
                <Input
                  id="player2-score"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 98.25"
                  value={player2Score}
                  onChange={(e) => setPlayer2Score(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedMatch(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitScore}
              disabled={isLoading || !player1Score || !player2Score}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trophy className="mr-2 h-4 w-4" />
              )}
              Submit Results
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface MatchRowProps {
  match: BracketMatchWithPlayers;
  onStart: () => void;
  onEdit: () => void;
  isLoading: boolean;
}

function MatchRow({ match, onStart, onEdit, isLoading }: MatchRowProps) {
  const canStart = match.player1_id && match.player2_id && match.status === "pending";
  const isLive = match.status === "in_progress";
  const isComplete = match.status === "completed";

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border p-4",
        isLive && "border-live/50 bg-live/5",
        isComplete && "border-winner/30 bg-winner/5"
      )}
    >
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">
          #{match.match_number}
        </span>

        <div className="flex items-center gap-2">
          <PlayerBadge
            name={match.player1?.kick_username || match.player1?.acebet_username || match.player1?.display_name}
            score={match.player1_score}
            isWinner={match.winner_id === match.player1_id}
          />
          <span className="text-muted-foreground">vs</span>
          <PlayerBadge
            name={match.player2?.kick_username || match.player2?.acebet_username || match.player2?.display_name}
            score={match.player2_score}
            isWinner={match.winner_id === match.player2_id}
          />
        </div>

        {isLive && (
          <Badge variant="outline" className="border-live/50 bg-live/20 text-live">
            LIVE
          </Badge>
        )}

        {isComplete && (
          <Badge variant="outline" className="border-winner/50 bg-winner/20 text-winner">
            Complete
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {canStart && (
          <Button size="sm" onClick={onStart} disabled={isLoading}>
            <Play className="mr-2 h-4 w-4" />
            Start
          </Button>
        )}

        {isLive && (
          <Button size="sm" onClick={onEdit} disabled={isLoading}>
            <Edit2 className="mr-2 h-4 w-4" />
            Enter Score
          </Button>
        )}

        {isComplete && (
          <Button size="sm" variant="outline" onClick={onEdit} disabled={isLoading}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
      </div>
    </div>
  );
}

interface PlayerBadgeProps {
  name?: string;
  score: number | null;
  isWinner: boolean;
}

function PlayerBadge({ name, score, isWinner }: PlayerBadgeProps) {
  if (!name) {
    return (
      <span className="rounded bg-muted px-2 py-1 text-sm italic text-muted-foreground">
        TBD
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex items-center gap-2 rounded px-2 py-1 text-sm font-medium",
        isWinner ? "bg-winner/20 text-winner" : "bg-secondary"
      )}
    >
      {isWinner && <Trophy className="h-3 w-3" />}
      {name}
      {score !== null && (
        <span className="font-mono text-xs opacity-75">{score.toFixed(2)}x</span>
      )}
    </span>
  );
}
