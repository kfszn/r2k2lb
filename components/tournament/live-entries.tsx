"use client";

import { useEffect, useState } from "react";
import { Users, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TournamentEntry {
  id: string;
  kick_username: string;
  acebet_username: string;
  status: "registered" | "accepted" | "denied" | "pending";
  created_at?: string;
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
    const interval = setInterval(fetchEntries, 5000);
    return () => clearInterval(interval);
  }, []);

  const accepted = entries.filter((e) => e.status === "registered");

  return (
    <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">Entrants</span>
        </div>
        <Badge
          variant="outline"
          className="border-primary/30 bg-primary/8 text-primary text-xs font-bold tabular-nums"
        >
          {accepted.length}
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : accepted.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-center px-4">
          <Users className="h-7 w-7 text-muted-foreground/25" />
          <p className="text-xs text-muted-foreground">No entrants yet</p>
          <p className="text-[11px] text-muted-foreground/60">
            Type !enter in chat to join
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[240px]">
          <div className="p-2 space-y-1">
            {accepted
              .sort(
                (a, b) =>
                  new Date(b.created_at ?? 0).getTime() -
                  new Date(a.created_at ?? 0).getTime()
              )
              .map((entry, idx) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 bg-muted/20 hover:bg-muted/35 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {entry.kick_username}
                      </p>
                      {entry.acebet_username && (
                        <p className="text-[11px] text-muted-foreground/70 truncate">
                          {entry.acebet_username}
                        </p>
                      )}
                    </div>
                  </div>
                  {entry.created_at ? (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Clock className="h-2.5 w-2.5 text-muted-foreground/40" />
                      <span className="text-[10px] text-muted-foreground/50 font-mono">
                        {new Date(entry.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/40 flex-shrink-0 font-mono tabular-nums">
                      #{idx + 1}
                    </span>
                  )}
                </div>
              ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
