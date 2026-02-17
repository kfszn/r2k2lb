-- Add missing columns to raffle_config table
ALTER TABLE raffle_config ADD COLUMN IF NOT EXISTS prize_amount DECIMAL DEFAULT 1000;
ALTER TABLE raffle_config ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT '2026-02-14';
ALTER TABLE raffle_config ADD COLUMN IF NOT EXISTS end_date DATE DEFAULT '2026-02-21';

-- Update existing records with default dates
UPDATE raffle_config SET start_date = '2026-02-14', end_date = '2026-02-21' WHERE start_date IS NULL;
