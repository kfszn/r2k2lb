-- Add wager_timeframe column to tournaments table
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS wager_timeframe TEXT DEFAULT 'all';

-- Update RLS policy to allow reading the new column
-- (Already covered by existing policies)
