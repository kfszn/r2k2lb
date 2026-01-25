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
    const numRounds = Math.ceil(Math.log2(players.length));
    
    // Generate first round matches
    for (let i = 0; i < players.length; i += 2) {
      newMatches.push({
        id: `match-1-${Math.floor(i / 2)}`,
        round: 1,
        matchNumber: Math.floor(i / 2),
        player1: players[i] || null,
        player2: players[i + 1] || null,
        player1Score: 0,
        player2Score: 0,
        status: 'pending',
      });
    }

    // Generate subsequent rounds (with TBD slots for winners to advance to)
    let currentRoundMatches = newMatches.length;
    for (let round = 2; round <= numRounds; round++) {
      const matchesInRound = currentRoundMatches / 2;
      for (let i = 0; i < matchesInRound; i++) {
        newMatches.push({
          id: `match-${round}-${i}`,
          round,
          matchNumber: i,
          player1: null,
          player2: null,
          player1Score: 0,
          player2Score: 0,
          status: 'pending',
        });
      }
      currentRoundMatches = matchesInRound;
    }

    console.log('[v0] Generated bracket with', newMatches.length, 'matches');
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
      if (match && match.round < Math.ceil(Math.log2(updated.length))) {
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
