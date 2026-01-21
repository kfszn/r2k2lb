export type TournamentStatus = 'pending' | 'registration' | 'active' | 'paused' | 'completed' | 'cancelled'
export type MatchStatus = 'pending' | 'active' | 'completed' | 'cancelled'

export interface Tournament {
  id: string
  name: string
  status: TournamentStatus
  game: string | null
  max_entrants: number
  max_players: number
  buy_in_amount: number
  prize_pool: number
  current_round: number
  total_rounds: number
  registration_open: boolean
  min_wager: number | null
  require_active: boolean
  created_at: string
  updated_at: string
  started_at: string | null
  ended_at: string | null
}

export interface TournamentPlayer {
  id: string
  tournament_id: string
  kick_username: string
  acebet_username: string | null
  acebet_validated: boolean
  acebet_wager: number | null
  acebet_active: boolean | null
  display_name: string | null
  seed_number: number | null
  status: 'registered' | 'active' | 'eliminated'
  is_eliminated: boolean
  eliminated_round: number | null
  final_placement: number | null
  registered_at: string
}

export interface BracketMatch {
  id: string
  tournament_id: string
  round: number
  round_number: number
  match_number: number
  player1_id: string | null
  player2_id: string | null
  winner_id: string | null
  player1_score: number | null
  player2_score: number | null
  is_bye: boolean
  status: MatchStatus
  next_match_id: string | null
  created_at: string
  updated_at: string
  // Joined data
  player1?: TournamentPlayer | null
  player2?: TournamentPlayer | null
  winner?: TournamentPlayer | null
}

export interface TournamentAdmin {
  id: string
  kick_username: string
  is_active: boolean
  created_at: string
}

export interface TournamentWithDetails extends Tournament {
  players: TournamentPlayer[]
  matches: BracketMatch[]
}

// Chat bot command types
export interface ChatCommand {
  command: string
  username: string
  args: string[]
}

export interface ChatResponse {
  success: boolean
  message: string
  data?: Record<string, unknown>
}

// Acebet API types
export interface AcebetValidationResponse {
  success: boolean
  username?: string
  totalWagered?: number
  isActive?: boolean
  error?: string
}
