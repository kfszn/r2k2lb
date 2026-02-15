-- Remove duplicate tournament winners, keeping only the first entry per tournament
-- This fixes the issue where the same winner was inserted multiple times

WITH ranked_winners AS (
  SELECT 
    id,
    tournament_id,
    acebet_username,
    ROW_NUMBER() OVER (PARTITION BY tournament_id ORDER BY won_at ASC) as row_num
  FROM tournament_winners
  WHERE tournament_id IS NOT NULL
)
DELETE FROM tournament_winners
WHERE id IN (
  SELECT id FROM ranked_winners WHERE row_num > 1
);

-- Show remaining winners
SELECT tournament_id, acebet_username, COUNT(*) as count
FROM tournament_winners
WHERE tournament_id IS NOT NULL
GROUP BY tournament_id, acebet_username
ORDER BY count DESC;
