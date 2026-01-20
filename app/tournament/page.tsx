"use client";

import { useActiveTournament } from "@/hooks/use-tournament-realtime";
import { TournamentHeader } from "@/components/tournament/tournament-header";
import { LiveBracket } from "@/components/tournament/live-bracket";
import { HowToEnter } from "@/components/tournament/how-to-enter";
import { WinnersCircle } from "@/components/tournament/winners-circle";
import { Button } from "@/components/ui/button";
import { Loader2, Trophy, RefreshCw, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function TournamentPage() {
  const { tournament, isLoading, refresh } = useActiveTournament();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading tournament...</p>
        </div>
      </main>
    );
  }

  if (!tournament) {
    return (
      <main className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
          <div className="container mx-auto flex items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-foreground">R2K2</span>
            </Link>
            <Button asChild size="sm">
              <a href="https://kick.com/r2ktwo" target="_blank" rel="noopener noreferrer">
                Watch Live
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </header>

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
            <Button onClick={() => refresh()} variant="outline">
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
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">R2K2</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => refresh()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button asChild size="sm">
              <a href="https://kick.com/r2ktwo" target="_blank" rel="noopener noreferrer">
                Watch Live
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Tournament Header */}
        <TournamentHeader tournament={tournament} />

        {/* Main Content Grid */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - How to Enter & Winners */}
          <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
            <HowToEnter
              minWager={tournament.min_wager || 0}
              requireActive={tournament.require_active !== false}
            />
            <WinnersCircle />
          </div>

          {/* Main Bracket Area */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="bg-card/30 rounded-xl border border-border/50 p-6 backdrop-blur">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Live Bracket</h2>
                {tournament.status === "in_progress" && (
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-medium text-red-400">LIVE</span>
                  </div>
                )}
                {tournament.status === "registration" && (
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-green-400">Registration Open</span>
                  </div>
                )}
              </div>
              <LiveBracket
                matches={tournament.matches || []}
                players={tournament.players || []}
              />
            </div>

            {/* Player Count */}
            {tournament.players && tournament.players.length > 0 && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{tournament.players.length}</span>
                <span>/ {tournament.max_players} players registered</span>
              </div>
            )}
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
  );
}
