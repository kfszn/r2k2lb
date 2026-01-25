"use client";

import React from "react";
import { useState } from "react";
import { useActiveTournament } from "@/hooks/use-tournament-realtime";
import Header from "@/components/header";
import { GiveawayBanner } from "@/components/giveaway-banner";
import { QuickActions } from "@/components/admin/quick-actions";
import { TournamentStats } from "@/components/admin/tournament-stats";
import { MatchManager } from "@/components/admin/match-manager";
import { PlayerManager } from "@/components/admin/player-manager";
import { CreateTournamentDialog } from "@/components/admin/create-tournament-dialog";
import { EntrantsDialog } from "@/components/admin/entrants-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trophy, Users, Swords, Settings, Zap, UserCheck, Lock, ShieldAlert, ArrowLeft, LayoutList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ClaimsManager } from "@/components/admin/claims-manager";
import { EmailVerificationTool } from "@/components/admin/email-verification-tool";
import { AllTournamentsManager } from "@/components/admin/all-tournaments-manager";
import { TournamentSelector } from "@/components/admin/tournament-selector";
import { TournamentDetailView } from "@/components/admin/tournament-detail-view";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";

type AdminView = "dashboard" | "tournament" | "website" | "tournament-detail";

export default function AdminPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [currentView, setCurrentView] = useState<AdminView>("dashboard");
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const { tournament, isLoading, refresh } = useActiveTournament();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEntrantsDialog, setShowEntrantsDialog] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthorized(true);
      setPasswordError("");
    } else {
      setPasswordError("Incorrect password");
      setPasswordInput("");
    }
  };

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

  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="flex h-screen items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-2 text-center">
              <div className="flex justify-center mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Admin Access</CardTitle>
              <p className="text-sm text-muted-foreground">Enter the admin password to continue</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setPasswordError("");
                    }}
                    autoFocus
                  />
                  {passwordError && (
                    <p className="text-sm text-destructive">{passwordError}</p>
                  )}
                </div>
                <Button type="submit" className="w-full">
                  Unlock Admin Panel
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Dashboard View
  if (currentView === "dashboard") {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView("tournament")}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Trophy className="h-8 w-8 text-primary" />
                  <CardTitle>Tournament Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Create tournaments, manage matches, verify entries, and handle claims</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView("website")}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Settings className="h-8 w-8 text-primary" />
                  <CardTitle>Website Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Manage user accounts, email verification, and website settings</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  // Tournament Management View - Show Tournament Selector
  if (currentView === "tournament") {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => setCurrentView("dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Tournament Management</h1>
          </div>

          <TournamentSelector 
            onSelectTournament={(t) => {
              setSelectedTournament(t);
              setCurrentView("tournament-detail");
            }}
            onCreateNew={() => setShowCreateDialog(true)}
          />

          <CreateTournamentDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            onCreated={refresh}
          />
        </div>
      </main>
    );
  }

  // Tournament Detail View
  if (currentView === "tournament-detail" && selectedTournament) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <TournamentDetailView
            tournament={selectedTournament}
            onBack={() => {
              setSelectedTournament(null);
              setCurrentView("tournament");
            }}
          />
        </div>
      </main>
    );
  }

  // Website Management View
  if (currentView === "website") {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => setCurrentView("dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Website Management</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                Email Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EmailVerificationTool />
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }
}
