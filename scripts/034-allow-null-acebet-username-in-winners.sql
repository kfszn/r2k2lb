-- Allow null acebet_username in tournament_winners so Kick-only winners can be recorded
ALTER TABLE tournament_winners ALTER COLUMN acebet_username DROP NOT NULL;
