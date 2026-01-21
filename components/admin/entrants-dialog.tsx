"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TournamentWithDetails } from "@/lib/types/tournament";
import { User, Trophy, CheckCircle, XCircle, Plus, Trash2, Loader2 } from "lucide-react";

interface EntrantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: TournamentWithDetails;
  onRefresh: () => void;
}

export function EntrantsDialog({ open, onOpenChange, tournament, onRefresh }: EntrantsDialogProps) {
  const [kickUsername, setKickUsername] = useState("");
  const [acebetUsername, setAcebetUsername] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const sortedPlayers = [...tournament.players].sort((a, b) => {
    return new Date(a.registered_at).getTime() - new Date(b.registered_at).getTime();
  });

  const handleAddPlayer = async () => {
    if (!kickUsername.trim() || !acebetUsername.trim()) {
      setError("Both usernames are required");
      return;
    }

    setIsAdding(true);
    setError("");

    try {
      const response = await fetch("/api/admin/player/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId: tournament.id,
          kickUsername: kickUsername.trim(),
          acebetUsername: acebetUsername.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to add player");
        return;
      }

      setKickUsername("");
      setAcebetUsername("");
      onRefresh();
    } catch (err) {
      setError("Failed to add player");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    setRemovingId(playerId);

    try {
      const response = await fetch("/api/admin/player/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          tournamentId: tournament.id,
        }),
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to remove player:", err);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Tournament Entrants
            <Badge variant="secondary">{tournament.players.length}/{tournament.max_players}</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Manual Add Player Form */}
        <div className="rounded-lg border border-border bg-secondary/30 p-4">
          <h4 className="mb-3 text-sm font-medium text-foreground">Manually Add Player</h4>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Kick Username"
              value={kickUsername}
              onChange={(e) => setKickUsername(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Acebet Username"
              value={acebetUsername}
              onChange={(e) => setAcebetUsername(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddPlayer} disabled={isAdding} className="gap-2">
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add
            </Button>
          </div>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>

        <ScrollArea className="max-h-[50vh]">
          {sortedPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <User className="mb-2 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No players registered yet</p>
              <p className="mt-1 text-sm text-muted-foreground/70">
                Players can join via !enter command in chat or add them manually above
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Kick User</TableHead>
                  <TableHead>Acebet User</TableHead>
                  <TableHead className="text-right">Wager</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPlayers.map((player, index) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {player.kick_username}
                    </TableCell>
                    <TableCell className="text-primary">
                      {player.acebet_username}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${(player.acebet_wager || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {player.acebet_active ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          player.status === "active"
                            ? "border-green-500/50 bg-green-500/10 text-green-500"
                            : player.status === "eliminated"
                              ? "border-red-500/50 bg-red-500/10 text-red-500"
                              : "border-muted text-muted-foreground"
                        }
                      >
                        {player.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemovePlayer(player.id)}
                        disabled={removingId === player.id}
                      >
                        {removingId === player.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        {sortedPlayers.length > 0 && (
          <div className="border-t border-border pt-3 text-center text-sm text-muted-foreground">
            {tournament.max_players - tournament.players.length} spots remaining
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
