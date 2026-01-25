"use client";

import React from "react"

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { TournamentWithDetails } from "@/lib/types/tournament";
import { formatCurrency } from "@/lib/tournament/client-utils";
import { Trophy, Users } from "lucide-react";

interface TournamentHeaderProps {
  tournament: TournamentWithDetails;
}

export function TournamentHeader({ tournament }: TournamentHeaderProps) {
  const statusColors = {
    pending: "bg-muted text-muted-foreground",
    registration: "bg-primary/20 text-primary border-primary/50",
    in_progress: "bg-live/20 text-live border-live/50 animate-pulse",
    completed: "bg-winner/20 text-winner border-winner/50",
    cancelled: "bg-destructive/20 text-destructive border-destructive/50",
  };

  const statusLabels = {
    pending: "Pending",
    registration: "Registration Open",
    in_progress: "Live Now",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return (
    <div className="space-y-6">
      {/* Main header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {tournament.name}
            </h1>
            <Badge
              variant="outline"
              className={statusColors[tournament.status]}
            >
              {tournament.status === "in_progress" && (
                <span className="mr-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-live opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
                </span>
              )}
              {statusLabels[tournament.status]}
            </Badge>
          </div>
          {tournament.description && (
            <p className="mt-2 text-muted-foreground">{tournament.description}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Powered by</span>
          <span className="font-bold text-primary">R2K2</span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          icon={Trophy}
          label="Prize Pool"
          value={formatCurrency(tournament.prize_pool)}
          iconColor="text-winner"
        />
        <StatCard
          icon={Users}
          label="Players"
          value={`${tournament.players?.length || 0} / ${tournament.max_players}`}
          iconColor="text-primary"
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: string;
  iconColor?: string;
}

function StatCard({ icon: Icon, label, value, subValue, iconColor = "text-primary" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-4">
        <div className={`rounded-full bg-secondary p-3 ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-xl font-bold text-foreground">{value}</p>
          {subValue && (
            <p className="text-xs text-muted-foreground">{subValue}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default TournamentHeader;
