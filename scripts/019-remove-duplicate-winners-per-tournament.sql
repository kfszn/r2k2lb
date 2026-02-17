-- Remove duplicate winners WITHIN the same tournament
-- Keep only the earliest entry per tournament_id + acebet_username combination

WITH ranked_winners AS (
  SELECT 
    id,
    tournament_id,
    acebet_username,
    ROW_NUMBER() OVER (
      PARTITION BY tournament_id, acebet_username 
      ORDER BY won_at ASC
    ) as rn
  FROM tournament_winners
)
DELETE FROM tournament_winners
WHERE id IN (
  SELECT id 
  FROM ranked_winners 
  WHERE rn > 1
);

-- This query:
-- 1. Groups winners by tournament_id + acebet_username
-- 2. Ranks them by won_at (earliest first)
-- 3. Deletes all except the first one (rn > 1)
-- 
-- Result: Each player can appear multiple times in the winners table,
-- but only ONCE per tournament_id
