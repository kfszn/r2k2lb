-- Add slot call columns to tournament_players table
ALTER TABLE tournament_players 
ADD COLUMN IF NOT EXISTS slot_name TEXT,
ADD COLUMN IF NOT EXISTS slot_type TEXT CHECK (slot_type IN ('super', 'regular'));

-- Add slot call columns to bracket_matches for each player in the match
ALTER TABLE bracket_matches
ADD COLUMN IF NOT EXISTS player1_slot_name TEXT,
ADD COLUMN IF NOT EXISTS player1_slot_type TEXT,
ADD COLUMN IF NOT EXISTS player2_slot_name TEXT,
ADD COLUMN IF NOT EXISTS player2_slot_type TEXT;
