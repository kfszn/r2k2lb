'use client';

import React from "react"

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface BracketPlayer {
  id: string;
  acebet_username: string;
  kick_username: string;
}

export interface BracketMatch {
  id: string;
  roundIndex: number;
  matchIndex: number;
  slotAId: string | null;
  slotBId: string | null;
  winnerId: string | null;
  nextMatchId: string | null;
  nextSlot: 'A' | 'B';
  player1Score: number;
  player2Score: number;
  status: 'pending' | 'live' | 'completed';
}

interface BracketContextType {
  matches: BracketMatch[];
  setMatches: React.Dispatch<React.SetStateAction<BracketMatch[]>>;
  activeTournamentId: string | null;
  setActiveTournamentId: (id: string | null) => void;
  getPlayerName: (id: string | null) => string;
  generateBracket: (players: BracketPlayer[], tournamentId: string) => Promise<void>;
  updateMatchScore: (matchId: string, player1Score: number, player2Score: number) => void;
  setMatchWinner: (matchId: string, winnerId: string, tournamentInfo?: { id?: string; name?: string; prize?: number }) => void;
  clearBracket: (tournamentId: string) => Promise<void>;
  loadBracketForTournament: (tournamentId: string) => Promise<void>;
}

const BracketContext = createContext<BracketContextType | undefined>(undefined);

// Store entrant data for name lookup
let entrantMap: Record<string, BracketPlayer> = {};

// Store aliveMap for runtime use
type AliveMap = Record<string, { aAlive: boolean; bAlive: boolean }>;
let currentAliveMap: AliveMap = {};

export function BracketProvider({ children }: { children: React.ReactNode }) {
  const [matches, setMatches] = useState<BracketMatch[]>([]);
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);

  // Load entrant map when tournament changes
  useEffect(() => {
    if (!activeTournamentId) return;

    const loadEntrants = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('tournament_players')
        .select('id, acebet_username, kick_username')
        .eq('tournament_id', activeTournamentId);

      if (data) {
        entrantMap = Object.fromEntries(data.map(p => [p.id, p]));
      }
    };

    loadEntrants();
  }, [activeTournamentId]);

  // Load bracket matches from Supabase for a specific tournament
  const loadBracketForTournament = useCallback(async (tournamentId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('bracket_matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round', { ascending: true })
        .order('match_number', { ascending: true });

      if (error) {
        console.error('[v0] Error loading bracket:', error);
        setMatches([]);
        return;
      }

      if (data && data.length > 0) {
        // Map DB columns to our BracketMatch interface
        const mapped: BracketMatch[] = data.map(row => ({
          id: row.id,
          roundIndex: row.round,
          matchIndex: row.match_number,
          slotAId: row.player1_id || null,
          slotBId: row.player2_id || null,
          winnerId: row.winner_id || null,
          nextMatchId: row.next_match_id || null,
          nextSlot: (row.player1_slot_type as 'A' | 'B') || 'A',
          player1Score: Number(row.player1_score) || 0,
          player2Score: Number(row.player2_score) || 0,
          status: (row.status as 'pending' | 'live' | 'completed') || 'pending',
        }));
        
        // Rebuild aliveMap from loaded matches
        const maxRound = Math.max(...mapped.map(m => m.roundIndex));
        const numRounds = maxRound + 1;
        const S = Math.pow(2, numRounds + 1) / 2; // bracket size
        const r0Count = mapped.filter(m => m.roundIndex === 0).length;
        const bracketSize = r0Count * 2;
        currentAliveMap = computeAliveMap(mapped, bracketSize, numRounds);
        
        setMatches(mapped);
      } else {
        setMatches([]);
      }

      setActiveTournamentId(tournamentId);

      // Also load entrants
      const { data: players } = await supabase
        .from('tournament_players')
        .select('id, acebet_username, kick_username')
        .eq('tournament_id', tournamentId);

      if (players) {
        entrantMap = Object.fromEntries(players.map(p => [p.id, p]));
      }
    } catch (e) {
      console.error('[v0] Error loading bracket for tournament:', e);
      setMatches([]);
    }
  }, []);

  // Generate canonical seed order for bracket size S
  const generateSeedOrder = (size: number): number[] => {
    if (size === 2) return [1, 2];
    const half = size / 2;
    const smaller = generateSeedOrder(half);
    const result: number[] = [];
    for (const seed of smaller) {
      result.push(seed);
      result.push(size + 1 - seed);
    }
    return result;
  };

  const computeAliveMap = (all: BracketMatch[], S: number, numRounds: number): AliveMap => {
    const map: AliveMap = {};
    // Build a lookup by roundIndex + matchIndex
    const byPos: Record<string, BracketMatch> = {};
    for (const m of all) {
      byPos[`${m.roundIndex}-${m.matchIndex}`] = m;
    }
    for (const m of all.filter(x => x.roundIndex === 0)) {
      map[m.id] = { aAlive: m.slotAId !== null, bAlive: m.slotBId !== null };
    }
    for (let r = 1; r < numRounds; r++) {
      const matchesInRound = S / Math.pow(2, r + 1);
      for (let i = 0; i < matchesInRound; i++) {
        const match = byPos[`${r}-${i}`];
        const leftChild = byPos[`${r - 1}-${2 * i}`];
        const rightChild = byPos[`${r - 1}-${2 * i + 1}`];
        const left = leftChild ? (map[leftChild.id] ?? { aAlive: false, bAlive: false }) : { aAlive: false, bAlive: false };
        const right = rightChild ? (map[rightChild.id] ?? { aAlive: false, bAlive: false }) : { aAlive: false, bAlive: false };
        if (match) {
          map[match.id] = {
            aAlive: left.aAlive || left.bAlive,
            bAlive: right.aAlive || right.bAlive,
          };
        }
      }
    }
    return map;
  };

  const propagateWinnerStatic = (
    matchList: BracketMatch[],
    winningId: string | null,
    fromMatchId: string,
    aliveMap: AliveMap
  ): BracketMatch[] => {
    let updated = [...matchList];
    const fromMatch = updated.find(m => m.id === fromMatchId);
    if (!fromMatch || !winningId || !fromMatch.nextMatchId) return updated;

    updated = updated.map(m => {
      if (m.id === fromMatch.nextMatchId) {
        if (fromMatch.nextSlot === 'A') {
          return { ...m, slotAId: winningId };
        } else {
          return { ...m, slotBId: winningId };
        }
      }
      return m;
    });

    const updatedNextMatch = updated.find(m => m.id === fromMatch.nextMatchId);
    if (!updatedNextMatch || updatedNextMatch.winnerId) return updated;

    const nextAlive = aliveMap[updatedNextMatch.id] ?? { aAlive: false, bAlive: false };
    const hasA = updatedNextMatch.slotAId !== null;
    const hasB = updatedNextMatch.slotBId !== null;

    if (hasA && !hasB && !nextAlive.bAlive) {
      const autoWinner = updatedNextMatch.slotAId!;
      updated = updated.map(m =>
        m.id === updatedNextMatch.id ? { ...m, winnerId: autoWinner, status: 'completed' } : m
      );
      updated = propagateWinnerStatic(updated, autoWinner, updatedNextMatch.id, aliveMap);
    }

    if (hasB && !hasA && !nextAlive.aAlive) {
      const autoWinner = updatedNextMatch.slotBId!;
      updated = updated.map(m =>
        m.id === updatedNextMatch.id ? { ...m, winnerId: autoWinner, status: 'completed' } : m
      );
      updated = propagateWinnerStatic(updated, autoWinner, updatedNextMatch.id, aliveMap);
    }

    return updated;
  };

  // Save a single match update to Supabase
  const saveMatchToDb = async (match: BracketMatch) => {
    if (!activeTournamentId) return;
    const supabase = createClient();
    await supabase
      .from('bracket_matches')
      .update({
        player1_id: match.slotAId,
        player2_id: match.slotBId,
        winner_id: match.winnerId,
        player1_score: match.player1Score,
        player2_score: match.player2Score,
        status: match.status,
      })
      .eq('id', match.id);
  };

  // Save all matches to Supabase
  const saveAllMatchesToDb = async (matchList: BracketMatch[]) => {
    if (!activeTournamentId) return;
    const supabase = createClient();
    for (const match of matchList) {
      await supabase
        .from('bracket_matches')
        .update({
          player1_id: match.slotAId,
          player2_id: match.slotBId,
          winner_id: match.winnerId,
          player1_score: match.player1Score,
          player2_score: match.player2Score,
          status: match.status,
        })
        .eq('id', match.id);
    }
  };

  const generateBracket = useCallback(async (players: BracketPlayer[], tournamentId: string) => {
    if (players.length < 2 || players.length > 20) return;

    try {
      const supabase = createClient();
      
      // Clear existing bracket for this tournament
      await supabase
        .from('bracket_matches')
        .delete()
        .eq('tournament_id', tournamentId);

      // Shuffle for random seeding
      const shuffled = [...players].sort(() => Math.random() - 0.5);
      entrantMap = Object.fromEntries(shuffled.map(p => [p.id, p]));

      const N = shuffled.length;
      const S = Math.pow(2, Math.ceil(Math.log2(N)));
      const numRounds = Math.ceil(Math.log2(S));

      const seedOrder = generateSeedOrder(S);
      const entrantsByPosition: (string | null)[] = new Array(S).fill(null);

      for (let pos = 0; pos < S; pos++) {
        const seedNum = seedOrder[pos];
        if (seedNum <= N) {
          entrantsByPosition[pos] = shuffled[seedNum - 1].id;
        }
      }

      // Generate UUIDs for each match and build a map from logical ID to UUID
      const logicalToUuid: Record<string, string> = {};
      for (let round = 0; round < numRounds; round++) {
        const matchesInRound = S / Math.pow(2, round + 1);
        for (let i = 0; i < matchesInRound; i++) {
          logicalToUuid[`match-${round}-${i}`] = crypto.randomUUID();
        }
      }

      let newMatches: BracketMatch[] = [];

      for (let round = 0; round < numRounds; round++) {
        const matchesInRound = S / Math.pow(2, round + 1);
        for (let i = 0; i < matchesInRound; i++) {
          let slotAId: string | null = null;
          let slotBId: string | null = null;

          if (round === 0) {
            slotAId = entrantsByPosition[i * 2];
            slotBId = entrantsByPosition[i * 2 + 1];
          }

          let nextMatchId: string | null = null;
          let nextSlot: 'A' | 'B' = 'A';
          if (round < numRounds - 1) {
            nextSlot = i % 2 === 0 ? 'A' : 'B';
            const logicalNextId = `match-${round + 1}-${Math.floor(i / 2)}`;
            nextMatchId = logicalToUuid[logicalNextId];
          }

          const logicalId = `match-${round}-${i}`;
          newMatches.push({
            id: logicalToUuid[logicalId],
            roundIndex: round,
            matchIndex: i,
            slotAId,
            slotBId,
            winnerId: null,
            nextMatchId,
            nextSlot,
            player1Score: 0,
            player2Score: 0,
            status: 'pending',
          });
        }
      }

      const aliveMap = computeAliveMap(newMatches, S, numRounds);
      currentAliveMap = aliveMap;

      // Process R0 auto-wins (byes)
      const r0Matches = newMatches.filter(m => m.roundIndex === 0);
      for (const match of r0Matches) {
        const hasA = match.slotAId !== null;
        const hasB = match.slotBId !== null;
        if (hasA !== hasB) {
          const autoWinner = hasA ? match.slotAId : match.slotBId;
          newMatches = newMatches.map(m =>
            m.id === match.id ? { ...m, winnerId: autoWinner, status: 'completed' } : m
          );
          newMatches = propagateWinnerStatic(newMatches, autoWinner, match.id, aliveMap);
        }
      }

      // Save ALL matches to Supabase with UUIDs
      const dbRows = newMatches.map(m => ({
        id: m.id,
        tournament_id: tournamentId,
        round: m.roundIndex,
        round_number: m.roundIndex,
        match_number: m.matchIndex,
        player1_id: m.slotAId,
        player2_id: m.slotBId,
        winner_id: m.winnerId,
        next_match_id: m.nextMatchId,
        player1_slot_type: m.nextSlot,
        player1_score: m.player1Score,
        player2_score: m.player2Score,
        status: m.status,
        is_bye: (m.slotAId !== null && m.slotBId === null) || (m.slotAId === null && m.slotBId !== null),
      }));

      const { error } = await supabase
        .from('bracket_matches')
        .insert(dbRows);

      if (error) {
        console.error('[v0] Error saving bracket to DB:', error);
        return;
      }

      setMatches(newMatches);
      setActiveTournamentId(tournamentId);
    } catch (e) {
      console.error('[v0] Error generating bracket:', e);
    }
  }, []);

  const updateMatchScore = useCallback((matchId: string, player1Score: number, player2Score: number) => {
    setMatches(prev => {
      const updated = prev.map(match =>
        match.id === matchId
          ? { ...match, player1Score, player2Score, status: 'live' as const }
          : match
      );
      // Save to DB
      const changedMatch = updated.find(m => m.id === matchId);
      if (changedMatch) saveMatchToDb(changedMatch);
      return updated;
    });
  }, [activeTournamentId]);

  const recordTournamentWinner = async (winnerId: string, tournamentId?: string, tournamentName?: string, prizeAmount?: number) => {
    try {
      const winner = entrantMap[winnerId];
      if (!winner) return;
      const supabase = createClient();
      await supabase.from('tournament_winners').insert({
        acebet_username: winner.acebet_username,
        kick_username: winner.kick_username,
        tournament_id: tournamentId || null,
        tournament_name: tournamentName || 'Tournament',
        prize_amount: prizeAmount || 0,
      });
    } catch (e) {
      console.error('[v0] Error recording tournament winner:', e);
    }
  };

  const setMatchWinner = useCallback((matchId: string, winnerId: string, tournamentInfo?: { id?: string; name?: string; prize?: number }) => {
    try {
      setMatches(prev => {
        let updated = prev.map(match =>
          match.id === matchId
            ? { ...match, winnerId, status: 'completed' as const }
            : match
        );

        updated = propagateWinnerStatic(updated, winnerId, matchId, currentAliveMap);

        // Check if bracket is complete (finals match has winner)
        const finalsMatch = updated.find(m => m.nextMatchId === null);
        if (finalsMatch && finalsMatch.winnerId) {
          recordTournamentWinner(
            finalsMatch.winnerId,
            tournamentInfo?.id,
            tournamentInfo?.name,
            tournamentInfo?.prize
          );
        }

        // Save all changed matches to DB
        saveAllMatchesToDb(updated);
        return updated;
      });
    } catch (e) {
      console.error('[v0] Error setting match winner:', e);
    }
  }, [activeTournamentId]);

  const clearBracket = useCallback(async (tournamentId: string) => {
    const supabase = createClient();
    await supabase
      .from('bracket_matches')
      .delete()
      .eq('tournament_id', tournamentId);

    setMatches([]);
    entrantMap = {};
    currentAliveMap = {};
  }, []);

  const getPlayerName = useCallback((id: string | null): string => {
    if (!id) return '';
    const player = entrantMap[id];
    return player?.kick_username || player?.acebet_username || '';
  }, []);

  return (
    <BracketContext.Provider value={{
      matches,
      setMatches,
      activeTournamentId,
      setActiveTournamentId,
      getPlayerName,
      generateBracket,
      updateMatchScore,
      setMatchWinner,
      clearBracket,
      loadBracketForTournament,
    }}>
      {children}
    </BracketContext.Provider>
  );
}

export function useBracket() {
  const context = useContext(BracketContext);
  if (!context) {
    throw new Error('useBracket must be used within BracketProvider');
  }
  return context;
}
