-- Create raffle_entries table
CREATE TABLE IF NOT EXISTS raffle_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('acebet', 'packdraw')),
  username TEXT NOT NULL,
  entry_date TIMESTAMP DEFAULT NOW(),
  week_start DATE NOT NULL,
  wager_amount NUMERIC NOT NULL,
  entered BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create raffle_winners table
CREATE TABLE IF NOT EXISTS raffle_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('acebet', 'packdraw')),
  username TEXT NOT NULL,
  prize_amount NUMERIC NOT NULL,
  won_date TIMESTAMP DEFAULT NOW(),
  raffle_type TEXT DEFAULT 'Weekly',
  week_start DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_raffle_entries_platform_week ON raffle_entries(platform, week_start);
CREATE INDEX IF NOT EXISTS idx_raffle_winners_platform ON raffle_winners(platform);
