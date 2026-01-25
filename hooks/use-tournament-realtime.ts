"use client";

import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TournamentWithDetails, BracketMatchWithPlayers } from "@/lib/types/tournament";
import useSWR from "swr";

async function fetchTournament(tournamentId: string): Promise<TournamentWithDetails | null> {
  const supabase = createClient();
  
  const { data: tournament, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", tournamentId)
    .single();
  
  if (error || !tournament) return null;
  
  const { data: players } = await supabase
    .from("tournament_players")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("seed_number", { ascending: true });
  
  const { data: matches } = await supabase
    .from("bracket_matches")
    .select(`
      *,
      player1:tournament_players!bracket_matches_player1_id_fkey(*),
      player2:tournament_players!bracket_matches_player2_id_fkey(*),
      winner:tournament_players!bracket_matches_winner_id_fkey(*)
    `)
    .eq("tournament_id", tournamentId)
    .order("round_number", { ascending: true })
    .order("match_number", { ascending: true });
  
  return {
    ...tournament,
    players: players || [],
    matches: (matches || []) as BracketMatchWithPlayers[],
  };
}

export function useTournamentRealtime(tournamentId: string | null) {
  const { data, error, mutate } = useSWR(
    tournamentId ? `tournament-${tournamentId}` : null,
    () => (tournamentId ? fetchTournament(tournamentId) : null),
    {
      refreshInterval: 0, // We'll use realtime instead
      revalidateOnFocus: true,
    }
  );

  const handleRealtimeUpdate = useCallback(() => {
    mutate();
  }, [mutate]);

  useEffect(() => {
    if (!tournamentId) return;

    const supabase = createClient();

    // Subscribe to tournament changes
    const tournamentChannel = supabase
      .channel(`tournament-${tournamentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tournaments",
          filter: `id=eq.${tournamentId}`,
        },
        handleRealtimeUpdate
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tournament_players",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        handleRealtimeUpdate
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bracket_matches",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        handleRealtimeUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tournamentChannel);
    };
  }, [tournamentId, handleRealtimeUpdate]);

  return {
    tournament: data,
    isLoading: !error && !data && tournamentId !== null,
    isError: error,
    refresh: mutate,
  };
}

export function useActiveTournament() {
  const { data, error, isLoading: isIdLoading, mutate: mutateId } = useSWR(
    "active-tournament",
    async () => {
      const supabase = createClient();

      const { data: tournament, error: queryError } = await supabase
        .from("tournaments")
        .select("id")
        .in("status", ["pending", "registration", "active"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (queryError) {
        console.error("[v0] Error fetching active tournament:", queryError);
      }

      return tournament?.id || null;
    },
    {
      revalidateOnFocus: true,
      refreshInterval: 3000, // Poll every 3 seconds to catch new tournaments
      dedupingInterval: 0,
      focusThrottleInterval: 1000,
    }
  );

  // Subscribe to tournament table changes to detect when a new one goes live
  useEffect(() => {
    const supabase = createClient();

    const tournamentChannel = supabase
      .channel("active-tournament-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tournaments",
          filter: "status=in.(pending,registration,active)",
        },
        () => {
          console.log("[v0] Tournament status changed, refreshing active tournament");
          mutateId();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tournamentChannel);
    };
  }, [mutateId]);

  const { tournament, isLoading: isTournamentLoading, refresh: refreshTournament } = useTournamentRealtime(data || null);

  const isLoading = isIdLoading || (data !== null && data !== undefined && isTournamentLoading);

  return {
    tournament,
    isLoading,
    isError: error,
    refresh: refreshTournament || mutateId,
  };
}
