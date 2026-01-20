import type { TournamentPlayer } from "@/lib/types/tournament";

export function generateBracket(players: TournamentPlayer[]): {
  round: number;
  match_number: number;
  player1_id: string | null;
  player2_id: string | null;
}[] {
  const matches: {
    round: number;
    match_number: number;
    player1_id: string | null;
    player2_id: string | null;
  }[] = [];
  
  const numPlayers = players.length;
  const numRounds = Math.ceil(Math.log2(numPlayers));
  const bracketSize = Math.pow(2, numRounds);
  
  // Seed players using standard bracket seeding
  const seededPlayers: (TournamentPlayer | null)[] = new Array(bracketSize).fill(null);
  
  for (let i = 0; i < players.length; i++) {
    seededPlayers[i] = players[i];
  }
  
  // Generate first round matches
  let matchNumber = 1;
  for (let i = 0; i < bracketSize / 2; i++) {
    const player1 = seededPlayers[i * 2];
    const player2 = seededPlayers[i * 2 + 1];
    
    matches.push({
      round: 1,
      match_number: matchNumber++,
      player1_id: player1?.id || null,
      player2_id: player2?.id || null,
    });
  }
  
  // Generate subsequent round matches (empty, to be filled as tournament progresses)
  let matchesInRound = bracketSize / 4;
  for (let round = 2; round <= numRounds; round++) {
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        round,
        match_number: matchNumber++,
        player1_id: null,
        player2_id: null,
      });
    }
    matchesInRound = matchesInRound / 2;
  }
  
  return matches;
}

export function calculateRoundName(round: number, totalRounds: number): string {
  const roundsFromEnd = totalRounds - round;
  
  switch (roundsFromEnd) {
    case 0:
      return "Finals";
    case 1:
      return "Semi-Finals";
    case 2:
      return "Quarter-Finals";
    default:
      return `Round ${round}`;
  }
}

export function formatMultiplier(multiplier: number): string {
  return `${multiplier.toFixed(2)}x`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
