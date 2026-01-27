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
      
      // For a proper bracket with byes:
      // - Random players get byes and appear directly in R2
      // - Remaining players play in R1
      // 
      // For 6 players (8 slots, 2 byes):
      // R1: 2 matches with 4 players
      // R2: 2 matches with bye players pre-seeded
      // Finals: winner R2-0 vs winner R2-1
      
      // Players who play in R1 (no byes)
      const r1PlayerCount = (nextPowerOfTwo / 2 - byeCount) * 2;
      const r1Players = shuffled.slice(byeCount); // Players without byes
      
      // Players who get byes - go directly to R2
      const byePlayers = shuffled.slice(0, byeCount);
    
    let matchNumber = 0;
    
    // R1: Only actual matches (no bye matches)
    const r1MatchCount = r1PlayerCount / 2;
    for (let i = 0; i < r1MatchCount; i++) {
      newMatches.push({
        id: `match-1-${matchNumber}`,
        round: 1,
        matchNumber: i,
        player1: r1Players[i * 2] || null,
        player2: r1Players[i * 2 + 1] || null,
        player1Score: 0,
        player2Score: 0,
        status: 'pending',
      });
      matchNumber++;
    }
    
    // R2: Matches with bye players already placed
    // For 6 players: R2 has 2 matches
    // Match 0: Seed 1 (bye) vs winner of R1 match 0
    // Match 1: Winner of R1 match 1 vs Seed 2 (bye)
    // But we need to distribute bye players correctly across R2 matches
    const r2MatchCount = nextPowerOfTwo / 4;
    for (let i = 0; i < r2MatchCount; i++) {
      let player1 = null;
      let player2 = null;
      
      // Distribute bye players: byePlayers[i] goes to R2 match i as player1
      if (i < byePlayers.length) {
        player1 = byePlayers[i];
      }
      
      newMatches.push({
        id: `match-2-${matchNumber}`,
        round: 2,
        matchNumber: i,
        player1,
        player2,
        player1Score: 0,
        player2Score: 0,
        status: 'pending',
      });
      matchNumber++;
    }
    
    // Remaining rounds (Finals, etc.)
    for (let round = 3; round <= numRounds; round++) {
      const matchesInRound = Math.pow(2, numRounds - round);
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
          
          // Find next round match and slot
          const nextRound = completedMatch.round + 1;
          const nextMatchIndex = Math.floor(completedMatch.matchNumber / 2);
          // isPlayer1Slot should be based on position within the pair (matchNumber % 2)
          // matchNumber % 2 === 0 means this is the "first" match in the pair (player1 slot)
          // matchNumber % 2 === 1 means this is the "second" match in the pair (player2 slot)
          const isPlayer1Slot = completedMatch.matchNumber % 2 === 0;
          
          updated = updated.map(m => {
            if (m.round === nextRound && m.matchNumber === nextMatchIndex) {
              if (isPlayer1Slot) {
                // This is the first match in the pair, place in player1 slot
                return { ...m, player1: winnerPlayer };
              } else {
                // This is the second match in the pair, place in player2 slot
                return { ...m, player2: winnerPlayer };
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
