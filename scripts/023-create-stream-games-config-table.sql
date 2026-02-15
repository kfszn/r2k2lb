-- Create stream_games_config table to track open/close status for stream games
CREATE TABLE IF NOT EXISTS public.stream_games_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_name TEXT UNIQUE NOT NULL,
  is_open BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert initial game configurations
INSERT INTO stream_games_config (game_name, is_open) VALUES
  ('slot_calls', false),
  ('bonus_hunts', false),
  ('control_the_balance', false)
ON CONFLICT (game_name) DO NOTHING;

-- Enable RLS
ALTER TABLE stream_games_config ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to read
CREATE POLICY "Allow public read on stream_games_config"
  ON stream_games_config FOR SELECT
  USING (true);

-- Policy: Allow public to update (for toggle functionality)
CREATE POLICY "Allow public update on stream_games_config"
  ON stream_games_config FOR UPDATE
  USING (true)
  WITH CHECK (true);
