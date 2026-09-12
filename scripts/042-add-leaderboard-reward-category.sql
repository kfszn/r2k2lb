-- Adds 'leaderboard' as a valid reward_claims category so weekly Roobet
-- leaderboard prizes (and manually-finalized LuxDrop leaderboard prizes)
-- can be posted automatically, alongside the existing manual categories.

ALTER TABLE reward_claims DROP CONSTRAINT IF EXISTS reward_claims_category_check;

ALTER TABLE reward_claims ADD CONSTRAINT reward_claims_category_check
  CHECK (category IN ('wager_milestone', 'lossback', 'tournament', 'deposit_bonus', 'giveaway', 'raffle', 'leaderboard'));
