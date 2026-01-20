"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { TournamentWithDetails } from "@/lib/types/tournament";
import { formatCurrency } from "@/lib/tournament/utils";
import {
  Play,
  Pause,
  StopCircle,
  Users,
  Trophy,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface TournamentControlsProps {
  tournament: TournamentWithDetails;
  onUpdate: () => void;
}

export function TournamentControls({ tournament, onUpdate }: TournamentControlsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/tournament/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId: tournament.id,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      onUpdate();
    } catch (error) {
      console.error("Error updating tournament status:", error);
    } finally {
      setIsLoading(false);
      setConfirmAction(null);
    }
  };

  const statusColors = {
    pending: "bg-muted text-muted-foreground",
    registration: "bg-primary/20 text-primary border-primary/50",
    in_progress: "bg-live/20 text-live border-live/50",
    completed: "bg-winner/20 text-winner border-winner/50",
    cancelled: "bg-destructive/20 text-destructive border-destructive/50",
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-primary" />
              {tournament.name}
            </CardTitle>
            <Badge
              variant="outline"
              className={statusColors[tournament.status]}
            >
              {tournament.status.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-secondary p-4">
              <p className="text-xs font-medium text-muted-foreground">Players</p>
              <p className="text-2xl font-bold">
                {tournament.players.length}/{tournament.max_players}
              </p>
            </div>
            <div className="rounded-lg bg-secondary p-4">
              <p className="text-xs font-medium text-muted-foreground">Prize Pool</p>
              <p className="text-2xl font-bold text-winner">
                {formatCurrency(tournament.prize_pool)}
              </p>
            </div>
            <div className="rounded-lg bg-secondary p-4">
              <p className="text-xs font-medium text-muted-foreground">Matches</p>
              <p className="text-2xl font-bold">{tournament.matches.length}</p>
            </div>
            <div className="rounded-lg bg-secondary p-4">
              <p className="text-xs font-medium text-muted-foreground">Buy-in</p>
              <p className="text-2xl font-bold">{formatCurrency(tournament.buy_in)}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {tournament.status === "pending" && (
              <Button
                onClick={() => handleStatusChange("registration")}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Users className="mr-2 h-4 w-4" />
                )}
                Open Registration
              </Button>
            )}

            {tournament.status === "registration" && (
              <>
                <Button
                  onClick={() => setConfirmAction("start")}
                  disabled={isLoading || tournament.players.length < 2}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  Start Tournament
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange("pending")}
                  disabled={isLoading}
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Close Registration
                </Button>
              </>
            )}

            {tournament.status === "in_progress" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setConfirmAction("complete")}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <StopCircle className="mr-2 h-4 w-4" />
                  )}
                  End Tournament
                </Button>
              </>
            )}

            {(tournament.status === "pending" || tournament.status === "registration") && (
              <Button
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmAction("cancel")}
                disabled={isLoading}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Cancel Tournament
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation dialogs */}
      <AlertDialog open={confirmAction === "start"} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              This will close registration and generate the tournament bracket with{" "}
              {tournament.players.length} players. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleStatusChange("in_progress")}>
              Start Tournament
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAction === "complete"} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the tournament as completed. Make sure all matches have been resolved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleStatusChange("completed")}>
              End Tournament
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAction === "cancel"} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the tournament. All player registrations will be lost.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Tournament</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => handleStatusChange("cancelled")}
            >
              Cancel Tournament
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
