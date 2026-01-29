-- Update wager_bonus_claims table to simplified schema
ALTER TABLE wager_bonus_claims DROP COLUMN IF EXISTS platform CASCADE;
ALTER TABLE wager_bonus_claims DROP COLUMN IF EXISTS tier_name CASCADE;
ALTER TABLE wager_bonus_claims DROP COLUMN IF EXISTS wager_amount CASCADE;
ALTER TABLE wager_bonus_claims DROP COLUMN IF EXISTS reward_amount CASCADE;
ALTER TABLE wager_bonus_claims DROP COLUMN IF EXISTS period_start CASCADE;
ALTER TABLE wager_bonus_claims DROP COLUMN IF EXISTS period_end CASCADE;
ALTER TABLE wager_bonus_claims DROP COLUMN IF EXISTS claim_date CASCADE;

-- Add new simplified columns if they don't exist
ALTER TABLE wager_bonus_claims ADD COLUMN IF NOT EXISTS claim_amount DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE wager_bonus_claims ADD COLUMN IF NOT EXISTS date_claimed DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE wager_bonus_claims ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE wager_bonus_claims ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
