"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, UserCheck, Trophy, Gamepad2, Terminal } from "lucide-react";

interface HowToEnterProps {
  minWager?: number;
  requireActive?: boolean;
}

export function HowToEnter({ minWager = 0, requireActive = true }: HowToEnterProps) {
  return (
    <div className="space-y-4">
      {/* How To Enter Card */}
      <Card className="bg-card/50 border-border/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-foreground">How To Enter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-sm">
              1
            </div>
            <div>
              <p className="font-medium text-foreground">Sign up on Acebet</p>
              <p className="text-sm text-muted-foreground">
                Use code <span className="font-bold text-primary">R2K2</span> when signing up at acebet.com
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-sm">
              2
            </div>
            <div>
              <p className="font-medium text-foreground">Meet Requirements</p>
              <p className="text-sm text-muted-foreground">
                {requireActive && "Be active under code R2K2"}
                {requireActive && minWager > 0 && " and "}
                {minWager > 0 && `have at least $${minWager.toLocaleString()} wagered`}
                {!requireActive && minWager === 0 && "No requirements for this tournament!"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-sm">
              3
            </div>
            <div>
              <p className="font-medium text-foreground">Enter via Kick Chat</p>
              <p className="text-sm text-muted-foreground">
                Type the entry command in R2K2's Kick chat when registration is open
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <UserCheck className="h-3.5 w-3.5 text-green-500" />
              <span>Entry accepted = You're in the bracket!</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Trophy className="h-3.5 w-3.5 text-yellow-500" />
              <span>Winners get added to the Winners Circle</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Commands Card */}
      <Card className="bg-card/50 border-border/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            Chat Commands
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Enter Command */}
          <div className="rounded-lg bg-muted/50 p-3 border border-border/50">
            <div className="flex items-center justify-between mb-1">
              <code className="font-mono text-sm text-primary font-bold">!enter [name]</code>
              <Badge variant="outline" className="text-xs">Registration</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the tournament with your Acebet username
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Example:</span>
              <code className="font-mono text-foreground">!enter Haz369</code>
            </div>
          </div>

          {/* Slot Command */}
          <div className="rounded-lg bg-muted/50 p-3 border border-border/50">
            <div className="flex items-center justify-between mb-1">
              <code className="font-mono text-sm text-primary font-bold">!slot [name] [type]</code>
              <Badge variant="outline" className="text-xs">In Match</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Submit your slot choice for your match (super or regular)
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <Gamepad2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Example:</span>
              <code className="font-mono text-foreground">!slot Gates of Olympus super</code>
            </div>
          </div>

          {/* Status Command */}
          <div className="rounded-lg bg-muted/50 p-3 border border-border/50">
            <div className="flex items-center justify-between mb-1">
              <code className="font-mono text-sm text-primary font-bold">!status</code>
              <Badge variant="outline" className="text-xs">Anytime</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Check current tournament status and player count
            </p>
          </div>

          {/* Bracket Command */}
          <div className="rounded-lg bg-muted/50 p-3 border border-border/50">
            <div className="flex items-center justify-between mb-1">
              <code className="font-mono text-sm text-primary font-bold">!bracket</code>
              <Badge variant="outline" className="text-xs">Anytime</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              View remaining players in the bracket
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
