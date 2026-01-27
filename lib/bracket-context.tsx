'use client';

import React from "react"

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface BracketPlayer {
  id: string;
  acebet_username: string;
  kick_username: string;
}

export interface BracketMatch {
  id: string;
  roundIndex: number;
  matchIndex: number;
  slotAId: string | null; // entrant id or null (bye)
  slotBId: string | null; // entrant id or null (bye)
  winnerId: string | null;
  nextMatchId: string | null;
  nextSlot: 'A' | 'B';
  player1Score: number;
  player2Score: number;
  status: 'pending' | 'live' | 'completed';
}

interface BracketContextType {
  matches: BracketMatch[];
  getPlayerName: (id: string | null) => string;
  generateBracket: (players: BracketPlayer[]) => void;
  updateMatchScore: (matchId: string, player1Score: number, player2Score: number) => void;
  setMatchWinner: (matchId: string, winnerId: string) => void;
  clearBracket: () => void;
}

const BracketContext = createContext<BracketContextType | undefined>(undefined);

// Store entrant data for name lookup
let entrantMap: Record<string, BracketPlayer> = {};

export function BracketProvider({ children }: { children: React.ReactNode }) {
  const [matches, setMatches] = useState<BracketMatch[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load bracket and aliveMap from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bracket-matches');
      if (saved) {
        setMatches(JSON.parse(saved));
      }
      const savedAliveMap = localStorage.getItem('bracket-alive-map');
      if (savedAliveMap) {
        currentAliveMap = JSON.parse(savedAliveMap);
      }
      const savedEntrants = localStorage.getItem('bracket-entrants');
      if (savedEntrants) {
        entrantMap = JSON.parse(savedEntrants);
      }
    } catch (e) {
      console.error('[v0] Error loading bracket from localStorage:', e);
    }
    setIsHydrated(true);
  }, []);

  // Generate canonical seed order for bracket size S
  const generateSeedOrder = (size: number): number[] => {
    if (size === 2) return [1, 2];
    const half = size / 2;
    const smaller = generateSeedOrder(half);
    const result = [];
    for (const seed of smaller) {
      result.push(seed);
      result.push(size + 1 - seed);
    }
    return result;
  };

  // CRITICAL: Compute "alive" map - does each side of a match have ANY real entrant in its subtree?
  // This distinguishes BYE (dead subtree) from TBD (opponent not decided yet)
  type AliveMap = Record<string, { aAlive: boolean; bAlive: boolean }>;
  
  const computeAliveMap = (all: BracketMatch[], S: number, numRounds: number): AliveMap => {
    const map: AliveMap = {};

    // Initialize R0: alive = slot has a real entrant
    for (const m of all.filter(x => x.roundIndex === 0)) {
      map[m.id] = { aAlive: m.slotAId !== null, bAlive: m.slotBId !== null };
    }

    // Build upward: each side is alive if its child subtree contains ANY entrant
    for (let r = 1; r < numRounds; r++) {
      const matchesInRound = S / Math.pow(2, r + 1);
      for (let i = 0; i < matchesInRound; i++) {
        const id = `match-${r}-${i}`;
        const leftChildId = `match-${r - 1}-${2 * i}`;
        const rightChildId = `match-${r - 1}-${2 * i + 1}`;

        const left = map[leftChildId] ?? { aAlive: false, bAlive: false };
        const right = map[rightChildId] ?? { aAlive: false, bAlive: false };

        map[id] = {
          aAlive: left.aAlive || left.bAlive,   // Left child feeds slot A
          bAlive: right.aAlive || right.bAlive, // Right child feeds slot B
        };
      }
    }

    return map;
  };

  // Store aliveMap for runtime use
  let currentAliveMap: AliveMap = {};

  // Static version of propagateWinner that uses aliveMap to distinguish BYE vs TBD
  const propagateWinnerStatic = (
    matches: BracketMatch[], 
    winningId: string | null, 
    fromMatchId: string,
    aliveMap: AliveMap
  ): BracketMatch[] => {
    let updated = [...matches];
    const fromMatch = updated.find(m => m.id === fromMatchId);
    
    if (!fromMatch || !winningId || !fromMatch.nextMatchId) return updated;

    // Place winner in next match's designated slot
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

    // Check if the next match can auto-resolve
    const updatedNextMatch = updated.find(m => m.id === fromMatch.nextMatchId);
    if (!updatedNextMatch || updatedNextMatch.winnerId) return updated;

    const nextAlive = aliveMap[updatedNextMatch.id] ?? { aAlive: false, bAlive: false };
    const hasA = updatedNextMatch.slotAId !== null;
    const hasB = updatedNextMatch.slotBId !== null;

    // CRITICAL: Only auto-win if the OTHER side is truly DEAD (not just TBD)
    // Slot A filled, slot B empty - only auto-win if B side has NO entrants anywhere
    if (hasA && !hasB && !nextAlive.bAlive) {
      const autoWinner = updatedNextMatch.slotAId!;
      updated = updated.map(m => 
        m.id === updatedNextMatch.id ? { ...m, winnerId: autoWinner, status: 'completed' } : m
      );
      updated = propagateWinnerStatic(updated, autoWinner, updatedNextMatch.id, aliveMap);
    }

    // Slot B filled, slot A empty - only auto-win if A side has NO entrants anywhere
    if (hasB && !hasA && !nextAlive.aAlive) {
      const autoWinner = updatedNextMatch.slotBId!;
      updated = updated.map(m => 
        m.id === updatedNextMatch.id ? { ...m, winnerId: autoWinner, status: 'completed' } : m
      );
      updated = propagateWinnerStatic(updated, autoWinner, updatedNextMatch.id, aliveMap);
    }

    return updated;
  };

  const generateBracket = useCallback((players: BracketPlayer[]) => {
    if (players.length < 2 || players.length > 20) return;

    try {
      // Shuffle for random seeding
      const shuffled = [...players].sort(() => Math.random() - 0.5);
      entrantMap = Object.fromEntries(shuffled.map(p => [p.id, p]));

      const N = shuffled.length;
      const S = Math.pow(2, Math.ceil(Math.log2(N))); // Next power of 2
      const numRounds = Math.ceil(Math.log2(S));
      
      // Generate seed order and place entrants
      const seedOrder = generateSeedOrder(S);
      const entrantsByPosition: (string | null)[] = new Array(S).fill(null);
      
      for (let pos = 0; pos < S; pos++) {
        const seedNum = seedOrder[pos];
        if (seedNum <= N) {
          entrantsByPosition[pos] = shuffled[seedNum - 1].id;
        }
      }

      let newMatches: BracketMatch[] = [];

      // Create ALL matches for ALL rounds (never skip)
      // Critical: R0 always has S/2 matches, R1 has S/4, etc
      for (let round = 0; round < numRounds; round++) {
        const matchesInRound = S / Math.pow(2, round + 1);
        
        for (let i = 0; i < matchesInRound; i++) {
          let slotAId: string | null = null;
          let slotBId: string | null = null;

          // R0: pair up from positions array
          if (round === 0) {
            const posA = i * 2;
            const posB = i * 2 + 1;
            slotAId = entrantsByPosition[posA];
            slotBId = entrantsByPosition[posB];
          }

          // Deterministic next match mapping
          let nextMatchId: string | null = null;
          let nextSlot: 'A' | 'B' = 'A';
          
          if (round < numRounds - 1) {
            const nextRound = round + 1;
            const nextMatchIndex = Math.floor(i / 2);
            nextSlot = i % 2 === 0 ? 'A' : 'B';
            nextMatchId = `match-${nextRound}-${nextMatchIndex}`;
          }

          const match: BracketMatch = {
            id: `match-${round}-${i}`,
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
          };

          newMatches.push(match);
        }
      }

      // Compute aliveMap ONCE after creating all matches
      // This tells us which sides have real entrants vs dead subtrees
      const aliveMap = computeAliveMap(newMatches, S, numRounds);
      currentAliveMap = aliveMap; // Store for runtime use

      // NOW process R0 matches for auto-wins (byes) and cascade forward
      const r0Matches = newMatches.filter(m => m.roundIndex === 0);
      
      for (const match of r0Matches) {
        const hasA = match.slotAId !== null;
        const hasB = match.slotBId !== null;
        
        // R0 auto-win: exactly one slot filled (the other is a true BYE in R0)
        if (hasA !== hasB) {
          const autoWinner = hasA ? match.slotAId : match.slotBId;
          
          // Mark this match as completed with winner
          newMatches = newMatches.map(m =>
            m.id === match.id ? { ...m, winnerId: autoWinner, status: 'completed' } : m
          );
          
          // Propagate winner forward using aliveMap (handles multi-round bye chains correctly)
          newMatches = propagateWinnerStatic(newMatches, autoWinner, match.id, aliveMap);
        }
        // Empty match (both null): leave as pending, no winner, no propagation
        // Playable match (both filled): leave as pending, wait for play
      }

      setMatches(newMatches);
      localStorage.setItem('bracket-matches', JSON.stringify(newMatches));
      localStorage.setItem('bracket-alive-map', JSON.stringify(aliveMap));
      localStorage.setItem('bracket-entrants', JSON.stringify(entrantMap));
    } catch (e) {
      console.error('[v0] Error generating bracket:', e);
    }
  }, []);

  const updateMatchScore = useCallback((matchId: string, player1Score: number, player2Score: number) => {
    setMatches(prev => {
      const updated = prev.map(match =>
        match.id === matchId
          ? { ...match, player1Score, player2Score, status: 'live' }
          : match
      );
      localStorage.setItem('bracket-matches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setMatchWinner = useCallback((matchId: string, winnerId: string) => {
    try {
      setMatches(prev => {
        let updated = prev.map(match =>
          match.id === matchId
            ? { ...match, winnerId, status: 'completed' }
            : match
        );

        // Propagate winner to next match using aliveMap (handles BYE vs TBD correctly)
        updated = propagateWinnerStatic(updated, winnerId, matchId, currentAliveMap);

        localStorage.setItem('bracket-matches', JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error('[v0] Error setting match winner:', e);
    }
  }, []);

  const clearBracket = useCallback(() => {
    setMatches([]);
    localStorage.removeItem('bracket-matches');
    localStorage.removeItem('bracket-alive-map');
    localStorage.removeItem('bracket-entrants');
    entrantMap = {};
    currentAliveMap = {};
  }, []);

  const getPlayerName = useCallback((id: string | null): string => {
    if (!id) return '';
    const player = entrantMap[id];
    return player?.kick_username || player?.acebet_username || '';
  }, []);

  return (
    <BracketContext.Provider value={{ matches, generateBracket, updateMatchScore, setMatchWinner, clearBracket, getPlayerName }}>
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
