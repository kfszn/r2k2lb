import { createClient } from "@/lib/supabase/server";
import type {
  Tournament,
  TournamentPlayer,
  BracketMatch,
  TournamentWithDetails,
  BracketMatchWithPlayers,
} from "@/lib/types/tournament";

export async function getActiveTournament(): Promise<TournamentWithDetails | null> {
  const supabase = await createClient();
  
  const { data: tournament, error } = await supabase
    .from("tournaments")
    .select("*")
    .in("status", ["registration", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  
  if (error || !tournament) return null;
  
  const { data: players } = await supabase
    .from("tournament_players")
    .select("*")
    .eq("tournament_id", tournament.id)
    .order("seed", { ascending: true });
  
  const { data: matches } = await supabase
    .from("bracket_matches")
    .select("*")
    .eq("tournament_id", tournament.id)
    .order("round", { ascending: true })
    .order("match_number", { ascending: true });
  
  return {
    ...tournament,
    players: players || [],
    matches: matches || [],
  };
}

export async function getTournamentById(id: string): Promise<TournamentWithDetails | null> {
  const supabase = await createClient();
  
  const { data: tournament, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error || !tournament) return null;
  
  const { data: players } = await supabase
    .from("tournament_players")
    .select("*")
    .eq("tournament_id", id)
    .order("seed", { ascending: true });
  
  const { data: matches } = await supabase
    .from("bracket_matches")
    .select("*")
    .eq("tournament_id", id)
    .order("round", { ascending: true })
    .order("match_number", { ascending: true });
  
  return {
    ...tournament,
    players: players || [],
    matches: matches || [],
  };
}

export async function getBracketMatchesWithPlayers(
  tournamentId: string
): Promise<BracketMatchWithPlayers[]> {
  const supabase = await createClient();
  
  const { data: matches } = await supabase
    .from("bracket_matches")
    .select(`
      *,
      player1:tournament_players!bracket_matches_player1_id_fkey(*),
      player2:tournament_players!bracket_matches_player2_id_fkey(*),
      winner:tournament_players!bracket_matches_winner_id_fkey(*)
    `)
    .eq("tournament_id", tournamentId)
    .order("round", { ascending: true })
    .order("match_number", { ascending: true });
  
  return (matches || []) as BracketMatchWithPlayers[];
}

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
  
  // Find the next power of 2
  let mainBracketSize = 1;
  while (mainBracketSize < numPlayers) {
    mainBracketSize *= 2;
  }
  
  // Calculate how many players need preliminaries
  const spotsInMainBracket = mainBracketSize;
  const numNeedingPrelim = numPlayers - (spotsInMainBracket / 2);
  
  let matchNumber = 1;
  let round = 1;
  
  // **PRELIMINARY ROUND** - For players that need to be eliminated first
  if (numNeedingPrelim > 0) {
    for (let i = 0; i < numNeedingPrelim; i++) {
      matches.push({
        round,
        match_number: matchNumber++,
        player1_id: players[i * 2]?.id || null,
        player2_id: players[i * 2 + 1]?.id || null,
      });
    }
    round++;
  }
  
  // **MAIN BRACKET ROUND**
  // Players from prelims advance, remaining players get byes to this round
  let playerIndex = numNeedingPrelim * 2;
  let matchesInMainRound = spotsInMainBracket / 2;
  
  for (let i = 0; i < matchesInMainRound; i++) {
    let player1_id: string | null = null;
    let player2_id: string | null = null;
    
    // Some slots come from prelim winners (null for now), others from direct seeding
    if (i < numNeedingPrelim) {
      // This match slot will be filled by a prelim winner
      player1_id = null;
      player2_id = null;
    } else {
      // Direct seeding for players without prelim
      if (playerIndex < numPlayers) {
        player1_id = players[playerIndex]?.id || null;
        playerIndex++;
      }
      if (playerIndex < numPlayers) {
        player2_id = players[playerIndex]?.id || null;
        playerIndex++;
      }
    }
    
    matches.push({
      round,
      match_number: matchNumber++,
      player1_id,
      player2_id,
    });
  }
  
  // Generate subsequent rounds (empty, to be filled as tournament progresses)
  let currentRoundMatches = matchesInMainRound / 2;
  round++;
  
  while (currentRoundMatches >= 1) {
    for (let i = 0; i < currentRoundMatches; i++) {
      matches.push({
        round,
        match_number: matchNumber++,
        player1_id: null,
        player2_id: null,
      });
    }
    currentRoundMatches = currentRoundMatches / 2;
    round++;
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
