"use client";

import type { Metadata } from 'next'
import { BracketDisplay } from "@/components/tournament/bracket-display";
import { HowToEnter } from "@/components/tournament/how-to-enter";
import { WinnersCircle } from "@/components/tournament/winners-circle";
import { LiveEntries } from "@/components/tournament/live-entries";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trophy } from "lucide-react";
import { GiveawayCounter } from "@/components/giveaway-counter";
import { useBracket } from "@/lib/bracket-context";
import { Header } from "@/components/header";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TournamentPage() {
  const { matches, setMatches } = useBracket();
  const [tournamentStatus, setTournamentStatus] = useState<string | null>(null);
  const [currentTournamentId, setCurrentTournamentId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Check tournament status on mount
  useEffect(() => {
    const checkTournamentStatus = async () => {
      try {
        const supabase = createClient();
        
        // First, try to find a tournament marked as current
        let { data, error } = await supabase
          .from("tournaments")
          .select("id, status")
          .eq("is_current", true)
          .single();

        // If no current tournament, fall back to most recent live/registration tournament
        if (error || !data) {
          console.log("[v0] No is_current tournament, falling back to recent live tournament");
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("tournaments")
            .select("id, status")
            .in("status", ["live", "registration"])
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          
          if (fallbackError || !fallbackData) {
            console.log("[v0] No live tournaments found");
            setTournamentStatus(null);
            setCurrentTournamentId(null);
          } else {
            console.log("[v0] Found fallback tournament with id:", fallbackData.id, "status:", fallbackData.status);
            setTournamentStatus(fallbackData.status);
            setCurrentTournamentId(fallbackData.id);
          }
        } else {
          console.log("[v0] Found is_current tournament with id:", data.id, "status:", data.status);
          setTournamentStatus(data.status);
          setCurrentTournamentId(data.id);
        }
      } catch (error) {
        console.log("[v0] Error checking tournament status:", error);
        setTournamentStatus(null);
        setCurrentTournamentId(null);
      } finally {
        setIsLoaded(true);
      }
    };

    checkTournamentStatus();

    // Subscribe to tournament status changes
    const supabase = createClient();
    const channel = supabase
      .channel("tournaments-status")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tournaments" },
        (payload) => {
          if (payload.new?.is_current === true) {
            console.log("[v0] Tournament marked as current, id:", payload.new.id, "status:", payload.new.status);
            setTournamentStatus(payload.new.status);
            setCurrentTournamentId(payload.new.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch bracket matches for the current tournament
  useEffect(() => {
    if (!currentTournamentId) return;

    const fetchBracketMatches = async () => {
      try {
        const supabase = createClient();
        console.log("[v0] Fetching bracket for tournament:", currentTournamentId);
        
        const { data: matches, error } = await supabase
          .from("bracket_matches")
          .select("*")
          .eq("tournament_id", currentTournamentId)
          .order("round", { ascending: true })
          .order("match_number", { ascending: true });

        if (error) {
          console.log("[v0] Error fetching bracket matches:", error);
          return;
        }

        console.log("[v0] Fetched", matches?.length || 0, "matches from database for tournament:", currentTournamentId);
        if (matches && matches.length > 0) {
          setMatches(matches);
        }
      } catch (error) {
        console.log("[v0] Error in fetchBracketMatches:", error);
      }
    };

    fetchBracketMatches();
  }, [currentTournamentId, setMatches]);

  // Show bracket only if tournament is live or registration (not closed)
  const isLive = (tournamentStatus === "live" || tournamentStatus === "registration") && isLoaded && matches.length > 0;
  const hasBracket = isLive;

  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />

      {hasBracket ? (
        <main className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Sidebar */}
              <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
                <HowToEnter minWager={0} requireActive={true} />
                <LiveEntries />
                <WinnersCircle />
              </div>

              {/* Main Bracket Area */}
              <div className="lg:col-span-3 order-1 lg:order-2">
                <div className="bg-card/30 rounded-xl border border-border/50 p-6 backdrop-blur">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-foreground">Live Bracket</h2>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-sm font-medium text-red-400">LIVE</span>
                    </div>
                  </div>
                  <BracketDisplay />
                </div>

                {/* Match Count */}
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{matches.length}</span>
                  <span>matches</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t border-border bg-card/50 py-6 mt-12">
            <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
              <p>R2K2 Tournaments - Live Slot Bracket Battles</p>
              <p className="mt-1">Play responsibly. Must be 18+ to participate.</p>
            </div>
          </footer>
        </main>
      ) : (
        <main className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* No Tournament Banner */}
            <div className="flex flex-col items-center justify-center py-12 text-center mb-8">
              <div className="rounded-full bg-primary/10 p-6 mb-4">
                <Trophy className="h-12 w-12 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">No Active Tournament</h1>
              <p className="text-muted-foreground max-w-md mb-6">
                There's no tournament running right now. Follow R2K2 on Kick to know when the next one starts!
              </p>
              <Button onClick={() => window.location.reload()} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>

            {/* How To Enter and Winners Circle - Always visible */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <HowToEnter minWager={0} requireActive={true} />
              <WinnersCircle />
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
