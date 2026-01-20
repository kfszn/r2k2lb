-- Tournament System Database Schema
-- Supports live slot tournaments with bracket management

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Slot Tournament',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'registration', 'active', 'paused', 'completed', 'cancelled')),
  game TEXT,
  max_entrants INTEGER NOT NULL DEFAULT 20,
  buy_in_amount DECIMAL(10, 2) DEFAULT 0,
  prize_pool DECIMAL(10, 2) DEFAULT 0,
  current_round INTEGER DEFAULT 0,
  total_rounds INTEGER DEFAULT 0,
  registration_open BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Players/Entrants table
CREATE TABLE IF NOT EXISTS tournament_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  kick_username TEXT NOT NULL,
  acebet_username TEXT,
  acebet_validated BOOLEAN DEFAULT false,
  seed_number INTEGER,
  is_eliminated BOOLEAN DEFAULT false,
  eliminated_round INTEGER,
  final_placement INTEGER,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, kick_username)
);

-- Bracket Matches table
CREATE TABLE IF NOT EXISTS bracket_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id UUID REFERENCES tournament_players(id) ON DELETE SET NULL,
  player2_id UUID REFERENCES tournament_players(id) ON DELETE SET NULL,
  winner_id UUID REFERENCES tournament_players(id) ON DELETE SET NULL,
  player1_score DECIMAL(10, 2),
  player2_score DECIMAL(10, 2),
  is_bye BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  next_match_id UUID REFERENCES bracket_matches(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, round_number, match_number)
);

-- Admins table (simple admin key auth for chat bot)
CREATE TABLE IF NOT EXISTS tournament_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kick_username TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournament chat log (for audit)
CREATE TABLE IF NOT EXISTS tournament_chat_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  kick_username TEXT NOT NULL,
  command TEXT NOT NULL,
  response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournament_players_tournament ON tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_bracket_matches_tournament ON bracket_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_bracket_matches_round ON bracket_matches(tournament_id, round_number);
CREATE INDEX IF NOT EXISTS idx_tournament_chat_log_tournament ON tournament_chat_log(tournament_id);

-- Enable Row Level Security
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE bracket_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_chat_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow public read for tournament display
CREATE POLICY "Allow public read on tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Allow public read on tournament_players" ON tournament_players FOR SELECT USING (true);
CREATE POLICY "Allow public read on bracket_matches" ON bracket_matches FOR SELECT USING (true);

-- Service role policies for API mutations (using service key)
CREATE POLICY "Allow service role full access on tournaments" ON tournaments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access on tournament_players" ON tournament_players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access on bracket_matches" ON bracket_matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access on tournament_admins" ON tournament_admins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access on tournament_chat_log" ON tournament_chat_log FOR ALL USING (true) WITH CHECK (true);

-- Insert default admin
INSERT INTO tournament_admins (kick_username) VALUES ('R2K2') ON CONFLICT (kick_username) DO NOTHING;

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_players;
ALTER PUBLICATION supabase_realtime ADD TABLE bracket_matches;
