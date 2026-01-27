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

  // Load bracket from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bracket-matches');
      if (saved) {
        setMatches(JSON.parse(saved));
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
        // else: position remains null (bye)
      }

      const newMatches: BracketMatch[] = [];
      let matchId = 0;

      // Generate all rounds
      for (let round = 0; round < numRounds; round++) {
        const matchesInRound = Math.pow(2, numRounds - round - 1);
        const startPos = round === 0 ? 0 : -1; // Position tracking (not needed after R0)

        for (let i = 0; i < matchesInRound; i++) {
          let slotA: string | null = null;
          let slotB: string | null = null;

          if (round === 0) {
            // R0: pair up entrants from positions
            const posA = i * 2;
            const posB = i * 2 + 1;
            slotA = entrantsByPosition[posA];
            slotB = entrantsByPosition[posB];
          }
          // Other rounds start with null, filled by advancing winners

          // Calculate next match
          let nextMatchId = null;
          let nextSlot: 'A' | 'B' = 'A';
          
          if (round < numRounds - 1) {
            const nextRound = round + 1;
            const nextRoundMatchCount = Math.pow(2, numRounds - nextRound - 1);
            const nextMatchIndex = Math.floor(i / 2);
            nextSlot = i % 2 === 0 ? 'A' : 'B';
            
            // Calculate the actual next match ID (number assigned so far in bracket)
            let idOffset = 0;
            for (let r = 0; r < nextRound; r++) {
              idOffset += Math.pow(2, numRounds - r - 1);
            }
            nextMatchId = `match-${nextRound}-${nextMatchIndex}`;
          }

          const match: BracketMatch = {
            id: `match-${round}-${i}`,
            roundIndex: round,
            matchIndex: i,
            slotAId: slotA,
            slotBId: slotB,
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

      setMatches(newMatches);
      localStorage.setItem('bracket-matches', JSON.stringify(newMatches));
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

  const propagateWinner = (matches: BracketMatch[], winningId: string | null, fromMatchId: string): BracketMatch[] => {
    let updated = [...matches];
    const fromMatch = updated.find(m => m.id === fromMatchId);
    
    if (!fromMatch || !winningId || !fromMatch.nextMatchId) return updated;

    const nextMatch = updated.find(m => m.id === fromMatch.nextMatchId);
    if (!nextMatch) return updated;

    // Place winner in the correct slot
    const player = entrantMap[winningId];
    if (fromMatch.nextSlot === 'A') {
      updated = updated.map(m =>
        m.id === fromMatch.nextMatchId ? { ...m, slotAId: winningId } : m
      );
    } else {
      updated = updated.map(m =>
        m.id === fromMatch.nextMatchId ? { ...m, slotBId: winningId } : m
      );
    }

    // Check if next match can auto-resolve (one real entrant, one bye)
    const updatedNextMatch = updated.find(m => m.id === fromMatch.nextMatchId);
    if (updatedNextMatch) {
      const hasSlotA = updatedNextMatch.slotAId !== null;
      const hasSlotB = updatedNextMatch.slotBId !== null;
      const bothFilled = hasSlotA && hasSlotB;
      const oneFilled = hasSlotA !== hasSlotB;

      if (oneFilled && !updatedNextMatch.winnerId) {
        // Auto-resolve
        const autoWinner = hasSlotA ? updatedNextMatch.slotAId : updatedNextMatch.slotBId;
        updated = updated.map(m =>
          m.id === fromMatch.nextMatchId ? { ...m, winnerId: autoWinner, status: 'completed' } : m
        );
        // Propagate the auto-winner
        updated = propagateWinner(updated, autoWinner, fromMatch.nextMatchId);
      }
    }

    return updated;
  };

  const setMatchWinner = useCallback((matchId: string, winnerId: string) => {
    try {
      setMatches(prev => {
        let updated = prev.map(match =>
          match.id === matchId
            ? { ...match, winnerId, status: 'completed' }
            : match
        );

        // Propagate winner to next match
        updated = propagateWinner(updated, winnerId, matchId);

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
    entrantMap = {};
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
