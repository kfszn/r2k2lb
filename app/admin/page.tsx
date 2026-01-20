"use client";

import { useState } from "react";
import { useActiveTournament } from "@/hooks/use-tournament-realtime";
import { AdminHeader } from "@/components/admin/admin-header";
import { QuickActions } from "@/components/admin/quick-actions";
import { TournamentStats } from "@/components/admin/tournament-stats";
import { MatchManager } from "@/components/admin/match-manager";
import { PlayerManager } from "@/components/admin/player-manager";
import { CreateTournamentDialog } from "@/components/admin/create-tournament-dialog";
import { EntrantsDialog } from "@/components/admin/entrants-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trophy, Users, Swords, Settings, Zap } from "lucide-react";

export default function AdminPage() {
  const { tournament, isLoading, refresh } = useActiveTournament();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEntrantsDialog, setShowEntrantsDialog] = useState(false);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="flex h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading admin panel...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <AdminHeader />

      <div className="container mx-auto px-4 py-6">
        {!tournament ? (
          /* No Tournament State */
          <div className="flex flex-col items-center justify-center gap-8 py-16">
            <div className="relative">
              <div className="absolute -inset-4 animate-pulse rounded-full bg-primary/20 blur-xl" />
              <div className="relative rounded-full bg-gradient-to-br from-primary/20 to-accent/20 p-8">
                <Trophy className="h-16 w-16 text-primary" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground">
                Ready to Start a Tournament?
              </h2>
              <p className="mt-3 max-w-md text-muted-foreground">
                Create a new tournament bracket and let viewers join via chat commands
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} size="lg" className="gap-2">
              <Zap className="h-5 w-5" />
              Create Tournament
            </Button>
          </div>
        ) : (
          /* Active Tournament State */
          <div className="space-y-6">
            {/* Quick Actions Bar */}
            <QuickActions 
              tournament={tournament} 
              onUpdate={refresh}
              onViewEntrants={() => setShowEntrantsDialog(true)}
              onCreateNew={() => setShowCreateDialog(true)}
            />

            {/* Stats Cards */}
            <TournamentStats tournament={tournament} />

            {/* Management Tabs */}
            <Tabs defaultValue="matches" className="space-y-4">
              <TabsList className="grid w-full max-w-lg grid-cols-3 bg-secondary">
                <TabsTrigger value="matches" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Swords className="h-4 w-4" />
                  Matches
                </TabsTrigger>
                <TabsTrigger value="players" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Users className="h-4 w-4" />
                  Players
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="matches">
                <MatchManager tournament={tournament} onUpdate={refresh} />
              </TabsContent>

              <TabsContent value="players">
                <PlayerManager tournament={tournament} onUpdate={refresh} />
              </TabsContent>

              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>Tournament Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-xs font-medium text-muted-foreground">Tournament ID</p>
                        <p className="mt-1 font-mono text-sm">{tournament.id.slice(0, 8)}...</p>
                      </div>
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-xs font-medium text-muted-foreground">Created</p>
                        <p className="mt-1 text-sm">{new Date(tournament.created_at).toLocaleString()}</p>
                      </div>
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-xs font-medium text-muted-foreground">Game</p>
                        <p className="mt-1 text-sm">{tournament.game_name}</p>
                      </div>
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-xs font-medium text-muted-foreground">Bet Amount</p>
                        <p className="mt-1 text-sm">${tournament.bet_amount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      <CreateTournamentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={refresh}
      />

      {tournament && (
        <EntrantsDialog
          open={showEntrantsDialog}
          onOpenChange={setShowEntrantsDialog}
          tournament={tournament}
          onRefresh={refresh}
        />
      )}
    </main>
  );
}
