-- Drop the unique constraint that prevents multiple milestones with the same wager amount
ALTER TABLE wager_race_milestones
DROP CONSTRAINT IF EXISTS wager_race_milestones_race_id_wager_amount_key;
