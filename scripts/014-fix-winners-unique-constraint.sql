-- Drop the unique constraint on milestone_id to allow multiple winners per milestone
ALTER TABLE wager_race_winners
DROP CONSTRAINT IF EXISTS wager_race_winners_milestone_id_key;

-- Add a unique constraint on milestone_id + username instead
-- This prevents the same user from winning the same milestone twice
ALTER TABLE wager_race_winners
ADD CONSTRAINT wager_race_winners_milestone_username_unique 
UNIQUE (milestone_id, username);
