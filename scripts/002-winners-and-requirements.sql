-- Winners Circle and Entry Requirements Schema

-- Winners table - tracks all tournament wins
CREATE TABLE IF NOT EXISTS tournament_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acebet_username TEXT NOT NULL,
  kick_username TEXT,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  tournament_name TEXT,
  prize_amount DECIMAL(10, 2) DEFAULT 0,
  won_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for querying wins by username
CREATE INDEX IF NOT EXISTS idx_tournament_winners_acebet ON tournament_winners(acebet_username);

-- Add entry requirement columns to tournaments table
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS min_wager DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS require_active BOOLEAN DEFAULT true;

-- Add wager and active status to tournament_players
ALTER TABLE tournament_players
ADD COLUMN IF NOT EXISTS acebet_wager DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS acebet_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Enable RLS on winners table
ALTER TABLE tournament_winners ENABLE ROW LEVEL SECURITY;

-- Allow public read on winners
CREATE POLICY "Allow public read on tournament_winners" ON tournament_winners FOR SELECT USING (true);

-- Allow service role full access on winners
CREATE POLICY "Allow service role full access on tournament_winners" ON tournament_winners FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for winners
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_winners;
