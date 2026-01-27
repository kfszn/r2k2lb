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
  round: number;
  matchNumber: number;
  player1?: BracketPlayer | null;
  player2?: BracketPlayer | null;
  player1Score: number;
  player2Score: number;
  winnerId?: string | null;
  status: 'pending' | 'live' | 'completed';
}

interface BracketContextType {
  matches: BracketMatch[];
  generateBracket: (players: BracketPlayer[]) => void;
  updateMatchScore: (matchId: string, player1Score: number, player2Score: number) => void;
  setMatchWinner: (matchId: string, winnerId: string) => void;
  clearBracket: () => void;
}

const BracketContext = createContext<BracketContextType | undefined>(undefined);

export function BracketProvider({ children }: { children: React.ReactNode }) {
  const [matches, setMatches] = useState<BracketMatch[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load bracket from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bracket-matches');
      if (saved) {
        setMatches(JSON.parse(saved));
        console.log('[v0] Loaded bracket from localStorage:', JSON.parse(saved).length, 'matches');
      }
    } catch (e) {
      console.error('[v0] Error loading bracket from localStorage:', e);
    }
    setIsHydrated(true);
  }, []);

  const generateBracket = useCallback((players: BracketPlayer[]) => {
    if (players.length < 2) return;

    const newMatches: BracketMatch[] = [];
    
    // Find the next power of 2
    const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(players.length)));
    const byeCount = nextPowerOfTwo - players.length;
    
    // Proper seeding: Top seeds get byes, lower seeds play first round
    // For 6 players in 8 slots: seeds 1,2 get byes, then 5v4, 3v6, 2 has bye
    
    let matchNumber = 0;
    
    // Create R1 matches with proper seeding:
    // Top seeds get byes, remaining seeds are paired: (last, second-to-last), etc.
    
    // Seeds that get byes (top seeds)
    const byeSeeds = Array.from({ length: byeCount }, (_, i) => i);
    
    // Seeds that play in R1 (remaining seeds in reverse order for pairing)
    const playingSeeds = Array.from(
      { length: players.length - byeCount }, 
      (_, i) => byeCount + i
    );
    
    // Pair lower seeds: (last with second-to-last), etc.
    let playerIdx = byeCount;
    
    // Interleave byes and regular matches to fill R1 bracket properly
    // For 6 players: match 0 = bye, match 1 = (5,4), match 2 = (3,6), match 3 = bye
    for (let i = 0; i < nextPowerOfTwo / 2; i++) {
      if (i < byeCount) {
        // First byeCount matches are byes for top seeds
        newMatches.push({
          id: `match-1-${matchNumber}`,
          round: 1,
          matchNumber: matchNumber,
          player1: players[i] || null,
          player2: null, // Bye
          player1Score: 0,
          player2Score: 0,
          status: 'pending',
        });
      } else {
        // Remaining matches pair lower seeds
        const idx = (i - byeCount) * 2;
        if (idx + 1 < playingSeeds.length) {
          newMatches.push({
            id: `match-1-${matchNumber}`,
            round: 1,
            matchNumber: matchNumber,
            player1: players[playingSeeds[idx]] || null,
            player2: players[playingSeeds[idx + 1]] || null,
            player1Score: 0,
            player2Score: 0,
            status: 'pending',
          });
        }
      }
      matchNumber++;
    }

    // Generate subsequent rounds
    const numRounds = Math.ceil(Math.log2(nextPowerOfTwo));
    let currentRoundMatches = nextPowerOfTwo / 2;
    
    for (let round = 2; round <= numRounds; round++) {
      const matchesInRound = currentRoundMatches / 2;
      for (let i = 0; i < matchesInRound; i++) {
        newMatches.push({
          id: `match-${round}-${matchNumber}`,
          round,
          matchNumber: matchNumber,
          player1: null,
          player2: null,
          player1Score: 0,
          player2Score: 0,
          status: 'pending',
        });
        matchNumber++;
      }
      currentRoundMatches = matchesInRound;
    }

    console.log('[v0] Generated bracket with', newMatches.length, 'matches (', byeCount, 'byes for', players.length, 'players)');
    setMatches(newMatches);
    localStorage.setItem('bracket-matches', JSON.stringify(newMatches));
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
    setMatches(prev => {
      let updated = [...prev];
      
      // 1. Mark the match as completed with winner
      updated = updated.map(match =>
        match.id === matchId
          ? { ...match, winnerId, status: 'completed' }
          : match
      );

      // 2. Auto-complete all bye matches (player2 is null)
      updated = updated.map(match => {
        if (match.player2 === null && match.player1 && match.status !== 'completed') {
          return { ...match, winnerId: match.player1.id, status: 'completed' };
        }
        return match;
      });

      // 3. Advance all completed match winners to next round
      updated.forEach(match => {
        if (match.status === 'completed' && match.winnerId) {
          const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(updated.filter(m => m.round === 1).length * 2)));
          const numRounds = Math.ceil(Math.log2(nextPowerOfTwo));
          
          if (match.round < numRounds) {
            const nextRound = match.round + 1;
            const nextMatchIndex = Math.floor(match.matchNumber / 2);
            const isPlayer1Slot = match.matchNumber % 2 === 0;
            
            // Get the winner player object
            const winnerPlayer = match.player1?.id === match.winnerId ? match.player1 : match.player2;

            // Place winner in the correct slot of next round match
            updated = updated.map(m => {
              if (m.round === nextRound && m.matchNumber === nextMatchIndex) {
                if (isPlayer1Slot) {
                  return { ...m, player1: winnerPlayer };
                } else {
                  return { ...m, player2: winnerPlayer };
                }
              }
              return m;
            });
          }
        }
      });

      localStorage.setItem('bracket-matches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearBracket = useCallback(() => {
    setMatches([]);
    localStorage.removeItem('bracket-matches');
  }, []);

  return (
    <BracketContext.Provider value={{ matches, generateBracket, updateMatchScore, setMatchWinner, clearBracket }}>
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
