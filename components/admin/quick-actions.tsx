"use client";

import { useState } from "react";
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
import {
  Play,
  Pause,
  StopCircle,
  Users,
  Loader2,
  XCircle,
  Eye,
  Plus,
  Lock,
  Unlock,
  Trophy,
  Radio,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface QuickActionsProps {
  tournament: TournamentWithDetails;
  onUpdate: () => void;
  onViewEntrants: () => void;
  onCreateNew: () => void;
}

export function QuickActions({ tournament, onUpdate, onViewEntrants, onCreateNew }: QuickActionsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(newStatus);
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
      setIsLoading(null);
      setConfirmAction(null);
    }
  };

  const statusConfig = {
    pending: { 
      label: "PENDING", 
      color: "bg-muted text-muted-foreground",
      icon: Pause,
    },
    registration: { 
      label: "REGISTRATION OPEN", 
      color: "bg-primary/20 text-primary border-primary",
      icon: Unlock,
    },
    in_progress: { 
      label: "LIVE", 
      color: "bg-red-500/20 text-red-400 border-red-500 animate-pulse",
      icon: Radio,
    },
    completed: { 
      label: "COMPLETED", 
      color: "bg-winner/20 text-winner border-winner",
      icon: Trophy,
    },
    cancelled: { 
      label: "CANCELLED", 
      color: "bg-destructive/20 text-destructive border-destructive",
      icon: XCircle,
    },
  };

  const status = statusConfig[tournament.status];
  const StatusIcon = status.icon;

  return (
    <>
      {/* Main Action Bar */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Tournament Name & Status */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{tournament.name}</h1>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="outline" className={`${status.color} gap-1.5`}>
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {tournament.players.length}/{tournament.max_players} players
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Public View - Link to tournament page */}
            <Button variant="outline" asChild className="gap-2 bg-transparent">
              <Link href="/tournament" target="_blank">
                <ExternalLink className="h-4 w-4" />
                Public View
              </Link>
            </Button>

            {/* View Entrants - Always visible */}
            <Button variant="outline" onClick={onViewEntrants} className="gap-2 bg-transparent">
              <Eye className="h-4 w-4" />
              View Entrants
              <Badge variant="secondary" className="ml-1">
                {tournament.players.length}
              </Badge>
            </Button>

            {/* Status-specific actions */}
            {tournament.status === "pending" && (
              <Button 
                onClick={() => handleStatusChange("registration")}
                disabled={isLoading !== null}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                {isLoading === "registration" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Unlock className="h-4 w-4" />
                )}
                Open Registration
              </Button>
            )}

            {tournament.status === "registration" && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => handleStatusChange("pending")}
                  disabled={isLoading !== null}
                  className="gap-2"
                >
                  {isLoading === "pending" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  Close Registration
                </Button>
                <Button 
                  onClick={() => setConfirmAction("start")}
                  disabled={isLoading !== null || tournament.players.length < 2}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isLoading === "in_progress" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Start Tournament
                </Button>
              </>
            )}

            {tournament.status === "in_progress" && (
              <Button 
                variant="destructive"
                onClick={() => setConfirmAction("complete")}
                disabled={isLoading !== null}
                className="gap-2"
              >
                {isLoading === "completed" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <StopCircle className="h-4 w-4" />
                )}
                End Tournament
              </Button>
            )}

            {(tournament.status === "completed" || tournament.status === "cancelled") && (
              <Button onClick={onCreateNew} className="gap-2">
                <Plus className="h-4 w-4" />
                New Tournament
              </Button>
            )}

            {/* Cancel option for pending/registration */}
            {(tournament.status === "pending" || tournament.status === "registration") && (
              <Button
                variant="ghost"
                onClick={() => setConfirmAction("cancel")}
                disabled={isLoading !== null}
                className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <XCircle className="h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <AlertDialog open={confirmAction === "start"} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              This will close registration and generate the bracket with {tournament.players.length} players. 
              Make sure everyone who wants to join has registered!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleStatusChange("in_progress")}
              className="bg-green-600 hover:bg-green-700"
            >
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
              This will mark the tournament as completed. Make sure all matches have been resolved and there's a winner!
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
              This will cancel the tournament and all player registrations will be lost. This cannot be undone.
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
