"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, AlertCircle, CheckCircle2 } from "lucide-react";

interface WagerData {
  userId: string;
  name: string;
  wagered: number;
  deposited: number;
  earned: number;
  firstSeen: string;
  lastSeen: string;
}

export function WagerVerification() {
  const [username, setUsername] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [wagerData, setWagerData] = useState<WagerData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!username.trim()) {
      setError("Please enter an Acebet username");
      return;
    }
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }

    setError(null);
    setWagerData(null);
    setIsLoading(true);

    try {
      // Ensure dates are in YYYY-MM-DD format
      const start = new Date(startDate).toISOString().split('T')[0];
      const end = new Date(endDate).toISOString().split('T')[0];
      
      const url = `/api/leaderboard?start_at=${start}&end_at=${end}`;
      console.log("[v0] Fetching wager data:", url);
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard data");
      }

      const data = await response.json();
      console.log("[v0] API response:", data);

      if (!data.ok || !data.data) {
        throw new Error("Invalid response from leaderboard API");
      }

      // Find the user by username (case-insensitive)
      const user = data.data.find(
        (u: WagerData) => u.name?.toLowerCase() === username.toLowerCase()
      );

      if (!user) {
        setError(
          `No data found for username "${username}" in the selected date range (${start} to ${end})`
        );
        setWagerData(null);
      } else {
        // Convert from cents to dollars (divide by 100)
        const convertedUser = {
          ...user,
          wagered: user.wagered / 100,
          deposited: user.deposited / 100,
          earned: user.earned / 100,
        };
        console.log("[v0] Converted user data:", convertedUser);
        setWagerData(convertedUser);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred while fetching data"
      );
      setWagerData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Card className="border-primary/20 bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Wager Verification
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Look up player wager statistics by username and date range for reward verification
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="username" className="text-sm font-medium">
              Acebet Username
            </Label>
            <Input
              id="username"
              placeholder="Enter referral username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate" className="text-sm font-medium">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isLoading}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="text-sm font-medium">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isLoading}
                className="mt-1.5"
              />
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className="w-full gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Verify Wagers
              </>
            )}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Results Section */}
        {wagerData && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Player Found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {wagerData.name} (ID: {wagerData.userId})
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-primary/10">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Wagered ({startDate} to {endDate})
                </p>
                <p className="text-2xl font-bold text-primary">
                  ${wagerData.wagered.toFixed(2)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Deposited
                </p>
                <p className="text-2xl font-bold text-foreground">
                  ${wagerData.deposited.toFixed(2)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Net Earnings
                </p>
                <p
                  className={`text-2xl font-bold ${
                    wagerData.earned >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  ${wagerData.earned.toFixed(2)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Activity Window
                </p>
                <p className="text-sm font-medium">
                  {wagerData.firstSeen} to {wagerData.lastSeen}
                </p>
              </div>
            </div>

            {/* Copy Button for Verification */}
            <div className="pt-2 border-t border-primary/10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const text = `${wagerData.name}: $${wagerData.wagered.toFixed(
                    2
                  )} wagered (${startDate} to ${endDate})`;
                  navigator.clipboard.writeText(text);
                }}
                className="w-full"
              >
                Copy Verification
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
