"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, CheckCircle2 } from "lucide-react";

interface TournamentEntry {
  id: string;
  kick_username: string;
  acebet_username: string;
  status: "registered" | "accepted" | "denied" | "pending";
}

export function LiveEntries() {
  const [entries, setEntries] = useState<TournamentEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await fetch("/api/tournament/entries");
        if (response.ok) {
          const data = await response.json();
          setEntries(data.entries || []);
        }
      } catch (error) {
        console.error("[v0] Failed to fetch entries:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntries();

    // Poll for new entries every 5 seconds
    const interval = setInterval(fetchEntries, 5000);
    return () => clearInterval(interval);
  }, []);

  const acceptedCount = entries.filter((e) => e.status === "registered").length;

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-foreground">Live Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading entries...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold text-foreground">Live Entries</CardTitle>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {acceptedCount} Entered
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Waiting for entries... Type !enter [username] in chat</p>
        ) : (
          entries
            .filter((e) => e.status === "accepted")
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
            .map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/40 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-foreground">{entry.kick_username}</p>
                    <p className="text-xs text-muted-foreground">Acebet: {entry.acebet_username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(entry.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))
        )}
      </CardContent>
    </Card>
  );
}
