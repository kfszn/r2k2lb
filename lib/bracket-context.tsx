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
      }
    } catch (e) {
      console.error('[v0] Error loading bracket from localStorage:', e);
    }
    setIsHydrated(true);
  }, []);

  const generateBracket = useCallback((players: BracketPlayer[]) => {
    if (players.length < 2) return;

    try {
      // Shuffle players for random seeding
      const shuffled = [...players].sort(() => Math.random() - 0.5);

      const newMatches: BracketMatch[] = [];
      
      // Find the next power of 2
      const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(shuffled.length)));
      const byeCount = nextPowerOfTwo - shuffled.length;
      const numRounds = Math.ceil(Math.log2(nextPowerOfTwo));
      
      // In a proper bracket with byes:
      // - R1 has nextPowerOfTwo/2 total slots
      // - byeCount of those are empty (byes)
      // - The remaining nextPowerOfTwo/2 - byeCount slots have matches
      // - So R1 has (nextPowerOfTwo/2 - byeCount) actual matches
      // - Bye matches (empty slots) are distributed throughout R1
      //
      // For 10 players (16 slots, 6 byes):
      // R1: 8 slots total, 6 are empty (byes), so 2 actual matches
      // But that's wrong! We should have 5 matches in R1 for 10 players
      // 
      // The correct interpretation: 
      // - All 10 players play in R1 = 5 matches
      // - R2 has 5 slots to fill, but only 5 winners come from R1, so 0 byes in R2
      // - Then R2 to R3: 5 matches needs 8 slots in R3, so 3 byes in R3
      
      const r1MatchCount = shuffled.length / 2;
      
      let matchNumber = 0;
      
      // R1: All players play (no byes in R1, all real matches)
      for (let i = 0; i < r1MatchCount; i++) {
        newMatches.push({
          id: `match-1-${matchNumber}`,
          round: 1,
          matchNumber: i,
          player1: shuffled[i * 2] || null,
          player2: shuffled[i * 2 + 1] || null,
          player1Score: 0,
          player2Score: 0,
          status: 'pending',
        });
        matchNumber++;
      }
      
      // Generate all subsequent rounds
      for (let round = 2; round <= numRounds; round++) {
        const prevRoundMatches = Math.pow(2, numRounds - round + 1) / 2;
        const matchesInRound = prevRoundMatches / 2;
        for (let i = 0; i < matchesInRound; i++) {
          newMatches.push({
            id: `match-${round}-${matchNumber}`,
            round,
            matchNumber: i,
            player1: null,
            player2: null,
            player1Score: 0,
            player2Score: 0,
            status: 'pending',
          });
          matchNumber++;
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

  const setMatchWinner = useCallback((matchId: string, winnerId: string) => {
    try {
      setMatches(prev => {
        let updated = [...prev];
        
        // 1. Mark the match as completed with winner
        updated = updated.map(match =>
          match.id === matchId
            ? { ...match, winnerId, status: 'completed' }
            : match
        );

        // 2. Advance the winner to next round
        const completedMatch = updated.find(m => m.id === matchId);
        if (completedMatch) {
          const winnerPlayer = completedMatch.player1?.id === winnerId 
            ? completedMatch.player1 
            : completedMatch.player2;
          
          const nextRound = completedMatch.round + 1;
          
          // Get match counts for current and next round
          const currentRoundMatches = updated.filter(m => m.round === completedMatch.round);
          const nextRoundMatches = updated.filter(m => m.round === nextRound);
          
          if (nextRoundMatches.length === 0) {
            // No next round, this is the finals winner
            localStorage.setItem('bracket-matches', JSON.stringify(updated));
            return updated;
          }
          
          // Calculate advancement mapping based on ratio of matches
          // If current round has N matches and next round has M matches:
          // - If N == M: 1:1 mapping (match i → match i, player2 slot)
          // - If N == 2*M: 2:1 mapping (matches 0,1 → match 0; matches 2,3 → match 1)
          const ratio = currentRoundMatches.length / nextRoundMatches.length;
          
          let nextMatchIndex: number;
          let slotIsPlayer2: boolean;
          
          if (ratio === 1) {
            // 1:1 mapping - each match advances to same-numbered match
            nextMatchIndex = completedMatch.matchNumber;
            slotIsPlayer2 = true; // Winner goes to player2 since bye is in player1
          } else {
            // 2:1 or standard bracket mapping
            nextMatchIndex = Math.floor(completedMatch.matchNumber / 2);
            slotIsPlayer2 = completedMatch.matchNumber % 2 === 1;
          }
          
          updated = updated.map(m => {
            if (m.round === nextRound && m.matchNumber === nextMatchIndex) {
              // Try to place in the appropriate slot, fallback to empty slot
              if (slotIsPlayer2) {
                if (!m.player2) {
                  return { ...m, player2: winnerPlayer };
                } else if (!m.player1) {
                  return { ...m, player1: winnerPlayer };
                }
              } else {
                if (!m.player1) {
                  return { ...m, player1: winnerPlayer };
                } else if (!m.player2) {
                  return { ...m, player2: winnerPlayer };
                }
              }
            }
            return m;
          });
        }

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
