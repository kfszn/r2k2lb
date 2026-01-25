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
    
    // Round 1 with byes: players get byes first, then regular matches
    let playerIndex = 0;
    let matchNumber = 0;
    
    // Create bye matches (player vs null automatically advances)
    for (let i = 0; i < byeCount; i++) {
      newMatches.push({
        id: `match-1-${matchNumber}`,
        round: 1,
        matchNumber: matchNumber,
        player1: players[playerIndex] || null,
        player2: null, // Bye - no second player
        player1Score: 0,
        player2Score: 0,
        status: 'pending',
      });
      playerIndex++;
      matchNumber++;
    }
    
    // Create regular matches with remaining players
    const remainingPlayers = players.length - byeCount;
    for (let i = 0; i < remainingPlayers / 2; i++) {
      newMatches.push({
        id: `match-1-${matchNumber}`,
        round: 1,
        matchNumber: matchNumber,
        player1: players[playerIndex] || null,
        player2: players[playerIndex + 1] || null,
        player1Score: 0,
        player2Score: 0,
        status: 'pending',
      });
      playerIndex += 2;
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
      let updated = prev.map(match =>
        match.id === matchId
          ? { ...match, winnerId, status: 'completed' }
          : match
      );

      // Advance winner to next round
      const match = updated.find(m => m.id === matchId);
      if (match) {
        const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(updated.filter(m => m.round === 1).length * 2)));
        const numRounds = Math.ceil(Math.log2(nextPowerOfTwo));
        
        if (match.round < numRounds) {
          const nextRound = match.round + 1;
          const nextMatchIndex = Math.floor(match.matchNumber / 2);
          const isPlayer1Slot = match.matchNumber % 2 === 0;

          updated = updated.map(m => {
            if (m.round === nextRound && m.matchNumber === nextMatchIndex) {
              const winnerPlayer = match.player1?.id === winnerId ? match.player1 : match.player2;
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

      // Auto-advance bye winners (matches with null player2)
      updated = updated.map(match => {
        if (match.status !== 'completed' && match.player2 === null && match.player1) {
          // Auto-complete bye match
          return {
            ...match,
            winnerId: match.player1.id,
            status: 'completed',
          };
        }
        return match;
      });

      // Advance auto-completed byes to next round
      updated.forEach(match => {
        if (match.status === 'completed' && match.winnerId && match.player2 === null) {
          const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(updated.filter(m => m.round === 1).length * 2)));
          const numRounds = Math.ceil(Math.log2(nextPowerOfTwo));
          
          if (match.round < numRounds) {
            const nextRound = match.round + 1;
            const nextMatchIndex = Math.floor(match.matchNumber / 2);
            const isPlayer1Slot = match.matchNumber % 2 === 0;

            updated = updated.map(m => {
              if (m.round === nextRound && m.matchNumber === nextMatchIndex && !m.player1 && !m.player2) {
                const winnerPlayer = match.player1?.id === match.winnerId ? match.player1 : match.player2;
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
