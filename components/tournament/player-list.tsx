"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TournamentPlayer } from "@/lib/types/tournament";
import { Users, Trophy, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerListProps {
  players: TournamentPlayer[];
  maxPlayers: number;
}

export function PlayerList({ players, maxPlayers }: PlayerListProps) {
  const activePlayers = players.filter((p) => p.status !== "eliminated");
  const eliminatedPlayers = players.filter((p) => p.status === "eliminated");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Players
          </span>
          <Badge variant="outline" className="font-mono">
            {players.length}/{maxPlayers}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {activePlayers.map((player, index) => (
              <PlayerRow key={player.id} player={player} rank={index + 1} />
            ))}
            
            {eliminatedPlayers.length > 0 && (
              <>
                <div className="my-4 flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">Eliminated</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                {eliminatedPlayers.map((player, index) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    rank={activePlayers.length + index + 1}
                  />
                ))}
              </>
            )}
            
            {players.length === 0 && (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                <p>No players registered yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface PlayerRowProps {
  player: TournamentPlayer;
  rank: number;
}

function PlayerRow({ player, rank }: PlayerRowProps) {
  const statusConfig = {
    registered: {
      icon: Clock,
      color: "text-muted-foreground",
      bg: "bg-muted/50",
    },
    checked_in: {
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    playing: {
      icon: Trophy,
      color: "text-live",
      bg: "bg-live/10",
    },
    eliminated: {
      icon: XCircle,
      color: "text-loser",
      bg: "bg-loser/10",
    },
    winner: {
      icon: Trophy,
      color: "text-winner",
      bg: "bg-winner/10",
    },
  };

  const config = statusConfig[player.status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border px-3 py-2 transition-all",
        player.status === "eliminated" ? "border-border/30 opacity-50" : "border-border",
        player.status === "playing" && "border-live/50 ring-1 ring-live/30"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
            config.bg,
            config.color
          )}
        >
          {rank}
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">
            {player.display_name}
          </p>
          <p className="text-xs text-muted-foreground">
            Seed #{player.seed || "—"}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {player.best_multiplier && (
          <Badge variant="secondary" className="font-mono text-xs">
            {player.best_multiplier.toFixed(2)}x
          </Badge>
        )}
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>
    </div>
  );
}
