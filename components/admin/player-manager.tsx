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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TournamentWithDetails, TournamentPlayer } from "@/lib/types/tournament";
import { cn } from "@/lib/utils";
import {
  Plus,
  MoreVertical,
  UserMinus,
  Trophy,
  Loader2,
  Search,
  Users,
} from "lucide-react";

interface PlayerManagerProps {
  tournament: TournamentWithDetails;
  onUpdate: () => void;
}

export function PlayerManager({ tournament, onUpdate }: PlayerManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [aceUsername, setAceUsername] = useState("");
  const [kickUsername, setKickUsername] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPlayers = tournament.players.filter(
    (player) =>
      player.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.acebet_username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddPlayer = async () => {
    // At least one username is required
    if (!aceUsername.trim() && !kickUsername.trim()) {
      alert("Please enter either an Acebet username or Kick username");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/player/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId: tournament.id,
          acebetUsername: aceUsername.trim() || null,
          kickUsername: kickUsername.trim() || aceUsername.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add player");
      }

      setAceUsername("");
      setKickUsername("");
      setShowAddDialog(false);
      onUpdate();
    } catch (error) {
      console.error("Error adding player:", error);
      alert(error instanceof Error ? error.message : "Failed to add player");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!confirm("Are you sure you want to remove this player?")) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/player/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });

      if (!response.ok) throw new Error("Failed to remove player");
      onUpdate();
    } catch (error) {
      console.error("Error removing player:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetSeed = async (playerId: string, seed: number) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/player/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, seed }),
      });

      if (!response.ok) throw new Error("Failed to set seed");
      onUpdate();
    } catch (error) {
      console.error("Error setting seed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const canAddPlayers =
    tournament.status === "registration" &&
    tournament.players.length < tournament.max_players;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Players ({tournament.players.length}/{tournament.max_players})
            </CardTitle>
            {canAddPlayers && (
              <Button size="sm" onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Player
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Player list */}
          <div className="space-y-2">
            {filteredPlayers.map((player) => (
              <PlayerRow
                key={player.id}
                player={player}
                onRemove={() => handleRemovePlayer(player.id)}
                onSetSeed={(seed) => handleSetSeed(player.id, seed)}
                canEdit={tournament.status === "registration"}
                isLoading={isLoading}
              />
            ))}

            {filteredPlayers.length === 0 && (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                {searchQuery
                  ? "No players match your search"
                  : "No players registered yet"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add player dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Player</DialogTitle>
            <DialogDescription>
              Manually add a player to the tournament
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ace-username">Acebet Username</Label>
              <Input
                id="ace-username"
                placeholder="Enter Acebet username"
                value={aceUsername}
                onChange={(e) => setAceUsername(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional - if provided, stats will be pulled from API
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kick-username">Kick Username</Label>
              <Input
                id="kick-username"
                placeholder="Enter Kick username"
                value={kickUsername}
                onChange={(e) => setKickUsername(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional - at least one username is required
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPlayer} disabled={isLoading || (!aceUsername.trim() && !kickUsername.trim())}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add Player
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface PlayerRowProps {
  player: TournamentPlayer;
  onRemove: () => void;
  onSetSeed: (seed: number) => void;
  canEdit: boolean;
  isLoading: boolean;
}

function PlayerRow({ player, onRemove, onSetSeed, canEdit, isLoading }: PlayerRowProps) {
  const statusConfig = {
    registered: { label: "Registered", color: "bg-muted text-muted-foreground" },
    checked_in: { label: "Checked In", color: "bg-primary/20 text-primary" },
    playing: { label: "Playing", color: "bg-live/20 text-live" },
    eliminated: { label: "Eliminated", color: "bg-loser/20 text-loser" },
    winner: { label: "Winner", color: "bg-winner/20 text-winner" },
  };

  const config = statusConfig[player.status];

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
            player.seed ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}
        >
          {player.seed || "—"}
        </div>
        <div>
          <p className="font-medium">{player.display_name}</p>
          <p className="text-xs text-muted-foreground">@{player.acebet_username}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {player.best_multiplier && (
          <Badge variant="secondary" className="font-mono">
            Best: {player.best_multiplier.toFixed(2)}x
          </Badge>
        )}

        <Badge variant="outline" className={config.color}>
          {player.status === "winner" && <Trophy className="mr-1 h-3 w-3" />}
          {config.label}
        </Badge>

        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isLoading}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((seed) => (
                <DropdownMenuItem key={seed} onClick={() => onSetSeed(seed)}>
                  Set Seed #{seed}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                className="text-destructive"
                onClick={onRemove}
              >
                <UserMinus className="mr-2 h-4 w-4" />
                Remove Player
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
