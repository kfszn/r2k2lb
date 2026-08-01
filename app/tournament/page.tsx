"use client";

import { BracketDisplay } from "@/components/tournament/bracket-display";
import { HowToEnter } from "@/components/tournament/how-to-enter";
import { WinnersCircle } from "@/components/tournament/winners-circle";
import { LiveEntries } from "@/components/tournament/live-entries";
import { GiveawayCounter } from "@/components/giveaway-counter";
import { useBracket } from "@/lib/bracket-context";
import { Header } from "@/components/header";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trophy, Swords, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TournamentPage() {
  const { matches, loadBracketForTournament } = useBracket();
  const [tournamentStatus, setTournamentStatus] = useState<string | null>(null);
  const [currentTournamentId, setCurrentTournamentId] = useState<string | null>(null);
  const [tournamentName, setTournamentName] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const checkTournamentStatus = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("tournaments")
          .select("id, status, name, max_players")
          .eq("is_current", true)
          .in("status", ["registration", "live"])
          .single();

        if (error || !data) {
          setTournamentStatus(null);
          setCurrentTournamentId(null);
          setTournamentName(null);
        } else {
          setTournamentStatus(data.status);
          setCurrentTournamentId(data.id);
          setTournamentName(data.name);
        }
      } catch {
        setTournamentStatus(null);
        setCurrentTournamentId(null);
      } finally {
        setIsLoaded(true);
      }
    };

    checkTournamentStatus();

    const supabase = createClient();
    const channel = supabase
      .channel("tournaments-status")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tournaments" },
        (payload) => {
          if (
            payload.new?.is_current === true &&
            ["registration", "live"].includes(payload.new?.status)
          ) {
            setTournamentStatus(payload.new.status);
            setCurrentTournamentId(payload.new.id);
            setTournamentName(payload.new.name);
          } else {
            setTournamentStatus(null);
            setCurrentTournamentId(null);
            setTournamentName(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!currentTournamentId) return;
    loadBracketForTournament(currentTournamentId);
  }, [currentTournamentId, loadBracketForTournament]);

  // Load player count separately
  useEffect(() => {
    if (!currentTournamentId) return;
    const supabase = createClient();
    supabase
      .from("tournament_players")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", currentTournamentId)
      .then(({ count }) => {
        setPlayerCount(count ?? 0);
      });
  }, [currentTournamentId]);

  const hasBracket =
    (tournamentStatus === "live" || tournamentStatus === "registration") &&
    isLoaded &&
    matches.length > 0;

  const isRegistration = tournamentStatus === "registration";
  const isLive = tournamentStatus === "live";

  return (
    <div className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />

      {hasBracket ? (
        <main>
          {/* Tournament banner */}
          <div className="border-b border-border/60 bg-card/40 backdrop-blur-sm sticky top-0 z-10">
            <div className="container mx-auto px-4 max-w-7xl">
              <div className="flex items-center justify-between h-12">
                <div className="flex items-center gap-3">
                  <Swords className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm text-foreground truncate max-w-[200px] sm:max-w-none">
                    {tournamentName ?? "Tournament"}
                  </span>
                  {playerCount > 0 && (
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {playerCount} players &middot; {matches.length} matches
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isLive && (
                    <Badge
                      variant="outline"
                      className="border-red-500/40 bg-red-500/10 text-red-400 text-xs gap-1.5"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                      LIVE
                    </Badge>
                  )}
                  {isRegistration && (
                    <Badge
                      variant="outline"
                      className="border-primary/40 bg-primary/10 text-primary text-xs gap-1.5"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      REGISTERING
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-6 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
              {/* Sidebar */}
              <aside className="space-y-4 order-2 lg:order-1">
                <HowToEnter minWager={0} requireActive={true} />
                <LiveEntries />
                <WinnersCircle />
              </aside>

              {/* Bracket area */}
              <section className="order-1 lg:order-2 min-w-0">
                <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                    <div className="flex items-center gap-2.5">
                      <Swords className="h-4 w-4 text-primary" />
                      <h2 className="font-semibold text-foreground">Live Bracket</h2>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Radio className="h-3.5 w-3.5" />
                      <span>{matches.length} matches</span>
                    </div>
                  </div>
                  <div className="p-2 sm:p-4">
                    <BracketDisplay />
                  </div>
                </div>
              </section>
            </div>
          </div>

          <footer className="border-t border-border/40 bg-card/30 py-5 mt-8">
            <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
              <p>R2K2 Tournaments &mdash; Live Slot Bracket Battles</p>
              <p className="mt-1">Play responsibly. Must be 18+ to participate.</p>
            </div>
          </footer>
        </main>
      ) : (
        <main className="min-h-[calc(100vh-64px)]">
          {/* Empty state hero */}
          <div className="border-b border-border/40 bg-card/20">
            <div className="container mx-auto px-4 max-w-4xl py-16 text-center">
              <div className="inline-flex items-center justify-center rounded-full border border-border/50 bg-card p-5 mb-5">
                <Trophy className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
                No Active Tournament
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
                There&apos;s no tournament running right now. Follow R2K2 on Kick to be notified when the next one kicks off.
              </p>
              <a
                href="https://kick.com/r2k2lb"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
              >
                <Radio className="h-4 w-4" />
                Watch on Kick
              </a>
            </div>
          </div>

          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <HowToEnter minWager={0} requireActive={true} />
              <WinnersCircle />
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
