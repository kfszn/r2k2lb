"use client";

import { UserCheck, Trophy, Swords } from "lucide-react";

interface HowToEnterProps {
  minWager?: number;
  requireActive?: boolean;
}

export function HowToEnter({ minWager = 0, requireActive = true }: HowToEnterProps) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/40 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
        <Swords className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm text-foreground">How To Enter</span>
      </div>
      <div className="p-4 space-y-4">
        {[
          {
            step: "1",
            title: "Sign up on Acebet",
            desc: (
              <>
                Use code{" "}
                <span className="font-bold text-primary">R2K2</span> when
                signing up at acebet.co
              </>
            ),
          },
          {
            step: "2",
            title: "Meet Requirements",
            desc: (
              <>
                Be active under code{" "}
                <span className="font-bold text-primary">R2K2</span> on
                acebet.co and meet the specified wagered amount
              </>
            ),
          },
          {
            step: "3",
            title: "Enter via Kick Chat",
            desc: "Type the entry command in R2K2's Kick chat when registration is open",
          },
        ].map(({ step, title, desc }) => (
          <div key={step} className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary font-bold text-xs">
              {step}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
          </div>
        ))}

        <div className="pt-1 border-t border-border/30 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <UserCheck className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
            <span>Entry accepted = You&apos;re in the bracket!</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Trophy className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
            <span>Winners get added to the Hall of Fame</span>
          </div>
        </div>
      </div>
    </div>
  );
}
