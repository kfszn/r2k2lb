-- Create stream_games table
CREATE TABLE IF NOT EXISTS stream_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  game_type TEXT NOT NULL, -- 'control_the_balance', 'flip_the_coin', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create stream_game_entries table
CREATE TABLE IF NOT EXISTS stream_game_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_game_id UUID NOT NULL REFERENCES stream_games(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  starting_balance DECIMAL(10, 2) NOT NULL,
  ending_balance DECIMAL(10, 2) NOT NULL,
  amount_earned DECIMAL(10, 2) GENERATED ALWAYS AS (ending_balance * 0.05) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE stream_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_game_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow admins to manage stream games" ON stream_games
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to manage stream game entries" ON stream_game_entries
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX idx_stream_games_created_by ON stream_games(created_by);
CREATE INDEX idx_stream_game_entries_game_id ON stream_game_entries(stream_game_id);
