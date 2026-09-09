-- Unified reward tracking for Roobet/LuxDrop players, replacing the outdated
-- AceBet-era claim tables (user_claims, lossback_claims, wager_bonus_claims,
-- tournament_winners, wager_race_*, raffle_*), which are left untouched.
-- This is a visibility/tracking layer only — payouts still happen manually
-- via the existing Discord bot + spreadsheet.

CREATE TABLE IF NOT EXISTS reward_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('roobet', 'luxdrop')),
  username TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('wager_milestone', 'lossback', 'tournament', 'deposit_bonus', 'giveaway', 'raffle')),
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  period_label TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_claims_platform_username ON reward_claims (platform, lower(username));
CREATE INDEX IF NOT EXISTS idx_reward_claims_category ON reward_claims (category);

-- Admin-editable wager milestone tiers per platform. Placeholder thresholds —
-- adjust exact numbers from the admin panel.
CREATE TABLE IF NOT EXISTS wager_milestone_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('roobet', 'luxdrop')),
  tier_name TEXT NOT NULL,
  wager_threshold NUMERIC NOT NULL,
  reward_amount NUMERIC NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wager_milestone_tiers_platform ON wager_milestone_tiers (platform, sort_order);

INSERT INTO wager_milestone_tiers (platform, tier_name, wager_threshold, reward_amount, sort_order) VALUES
  ('roobet', 'Bronze', 5000, 25, 1),
  ('roobet', 'Silver', 15000, 75, 2),
  ('roobet', 'Gold', 25000, 125, 3),
  ('roobet', 'Platinum', 50000, 250, 4),
  ('luxdrop', 'Bronze', 5000, 25, 1),
  ('luxdrop', 'Silver', 15000, 75, 2),
  ('luxdrop', 'Gold', 25000, 125, 3),
  ('luxdrop', 'Platinum', 50000, 250, 4)
ON CONFLICT DO NOTHING;

ALTER TABLE reward_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE wager_milestone_tiers ENABLE ROW LEVEL SECURITY;

-- reward_claims: a user can view claims that match a platform username
-- currently linked to their own profile; service role has full access for
-- the admin panel and API routes.
CREATE POLICY "Users can view own reward claims" ON reward_claims FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      (reward_claims.platform = 'roobet' AND lower(profiles.roobet_username) = lower(reward_claims.username))
      OR (reward_claims.platform = 'luxdrop' AND lower(profiles.luxdrop_username) = lower(reward_claims.username))
    )
  )
);
CREATE POLICY "Service role full access on reward_claims" ON reward_claims FOR ALL USING (auth.role() = 'service_role');

-- wager_milestone_tiers: public read (needed to render progress on the
-- account page), service role write for the admin panel.
CREATE POLICY "Public can read wager milestone tiers" ON wager_milestone_tiers FOR SELECT USING (true);
CREATE POLICY "Service role can manage wager milestone tiers" ON wager_milestone_tiers FOR ALL USING (auth.role() = 'service_role');
