-- Fix missing columns in tournaments table
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 20;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS game_name TEXT;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS bet_amount DECIMAL(10, 2) DEFAULT 1;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS spin_count INTEGER DEFAULT 10;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS min_wager DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS require_active BOOLEAN DEFAULT true;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS wager_timeframe TEXT DEFAULT 'all';

-- Fix missing columns in tournament_players table
ALTER TABLE tournament_players ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE tournament_players ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'registered';
ALTER TABLE tournament_players ADD COLUMN IF NOT EXISTS acebet_wager DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE tournament_players ADD COLUMN IF NOT EXISTS acebet_active BOOLEAN DEFAULT false;
ALTER TABLE tournament_players ADD COLUMN IF NOT EXISTS slot_name TEXT;
ALTER TABLE tournament_players ADD COLUMN IF NOT EXISTS slot_type TEXT;

-- Fix missing columns in bracket_matches table
ALTER TABLE bracket_matches ADD COLUMN IF NOT EXISTS round INTEGER;
ALTER TABLE bracket_matches ADD COLUMN IF NOT EXISTS player1_slot_name TEXT;
ALTER TABLE bracket_matches ADD COLUMN IF NOT EXISTS player1_slot_type TEXT;
ALTER TABLE bracket_matches ADD COLUMN IF NOT EXISTS player2_slot_name TEXT;
ALTER TABLE bracket_matches ADD COLUMN IF NOT EXISTS player2_slot_type TEXT;

-- Create tournament_winners table if not exists
CREATE TABLE IF NOT EXISTS tournament_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acebet_username TEXT NOT NULL UNIQUE,
  win_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and add policy for winners table
ALTER TABLE tournament_winners ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies (safe way to ensure they exist)
DROP POLICY IF EXISTS "Allow public read on tournament_winners" ON tournament_winners;
CREATE POLICY "Allow public read on tournament_winners" ON tournament_winners FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow service role full access on tournament_winners" ON tournament_winners;
CREATE POLICY "Allow service role full access on tournament_winners" ON tournament_winners FOR ALL USING (true) WITH CHECK (true);
