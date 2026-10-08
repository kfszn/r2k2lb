-- Monthly welcome bonus: $20 redeemable once per cycle after $1,000 wagered.
ALTER TABLE public.reward_claims DROP CONSTRAINT IF EXISTS reward_claims_category_check;
ALTER TABLE public.reward_claims ADD CONSTRAINT reward_claims_category_check
  CHECK (category IN ('wager_milestone', 'lossback', 'tournament', 'deposit_bonus', 'giveaway', 'raffle', 'leaderboard', 'referral', 'welcome_bonus'));

-- One welcome bonus per player, per platform, per monthly cycle. Enforced in the database so two
-- simultaneous redeem requests can never both succeed.
CREATE UNIQUE INDEX IF NOT EXISTS reward_claims_welcome_bonus_once_per_cycle
  ON public.reward_claims (platform, lower(username), period_label)
  WHERE category = 'welcome_bonus';
