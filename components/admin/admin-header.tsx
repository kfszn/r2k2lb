"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trophy, ExternalLink, Home } from "lucide-react";

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">R2K2</span>
            <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
              Admin
            </span>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Public View
            </Link>
          </Button>
          <Button size="sm" asChild>
            <a
              href="https://kick.com/r2ktwo"
              target="_blank"
              rel="noopener noreferrer"
            >
              Stream
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
