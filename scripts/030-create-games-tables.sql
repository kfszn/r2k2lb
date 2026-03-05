-- Game bets table
CREATE TABLE IF NOT EXISTS game_bets (
  id SERIAL PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game VARCHAR(50) NOT NULL,
  wager INTEGER NOT NULL,
  payout INTEGER NOT NULL,
  profit INTEGER NOT NULL,
  server_seed TEXT NOT NULL,
  server_seed_hash TEXT NOT NULL,
  client_seed TEXT NOT NULL,
  nonce INTEGER NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User seeds table (provably fair)
CREATE TABLE IF NOT EXISTS user_seeds (
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  client_seed TEXT NOT NULL,
  nonce INTEGER DEFAULT 0,
  active_server_seed TEXT NOT NULL,
  active_server_seed_hash TEXT NOT NULL,
  next_server_seed TEXT NOT NULL,
  next_server_seed_hash TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE game_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_seeds ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access on game_bets"
  ON game_bets FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on user_seeds"
  ON user_seeds FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow users to read their own bets and seeds
CREATE POLICY "Users can read own bets"
  ON game_bets FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can read own seeds"
  ON user_seeds FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS game_bets_profile_id_idx ON game_bets (profile_id);
CREATE INDEX IF NOT EXISTS game_bets_created_at_idx ON game_bets (created_at DESC);
CREATE INDEX IF NOT EXISTS game_bets_game_idx ON game_bets (game);
