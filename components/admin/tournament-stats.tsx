"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { TournamentWithDetails } from "@/lib/types/tournament";
import { formatCurrency } from "@/lib/tournament/utils";
import { Users, Trophy, Swords, Clock } from "lucide-react";

interface TournamentStatsProps {
  tournament: TournamentWithDetails;
}

export function TournamentStats({ tournament }: TournamentStatsProps) {
  const completedMatches = tournament.matches.filter(m => m.status === "completed").length;
  const totalMatches = tournament.matches.length;
  const activeMatch = tournament.matches.find(m => m.status === "in_progress");

  const stats = [
    {
      label: "Players",
      value: `${tournament.players.length}/${tournament.max_players}`,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Prize Pool",
      value: formatCurrency(tournament.prize_pool),
      icon: Trophy,
      color: "text-winner",
      bgColor: "bg-winner/10",
    },
    {
      label: "Matches",
      value: totalMatches > 0 ? `${completedMatches}/${totalMatches}` : "0",
      icon: Swords,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Current Match",
      value: activeMatch ? `Round ${activeMatch.round}` : "None",
      icon: Clock,
      color: activeMatch ? "text-live" : "text-muted-foreground",
      bgColor: activeMatch ? "bg-live/10" : "bg-muted",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border/50 bg-card/50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`rounded-lg ${stat.bgColor} p-2.5`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-muted-foreground">
                {stat.label}
              </p>
              <p className="truncate text-lg font-bold text-foreground">
                {stat.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
