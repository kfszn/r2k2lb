"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Trophy } from "lucide-react";

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
                Be active under code <span className="font-bold text-primary">R2K2</span> on acebet.com and meet the specified wagered amount
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
    </div>
  );
}
