-- ============================================================
-- 033-fix-rls-security.sql
-- Fixes misconfigured RLS policies across all tables.
-- ============================================================

-- ============================================================
-- 1. raffle_config: Enable RLS, add policies
-- ============================================================
ALTER TABLE raffle_config ENABLE ROW LEVEL SECURITY;

-- Public can read raffle config
CREATE POLICY "raffle_config_public_read"
  ON raffle_config FOR SELECT
  TO public
  USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "raffle_config_service_role_all"
  ON raffle_config FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 2. raffle_entries: Enable RLS, add policies
-- ============================================================
ALTER TABLE raffle_entries ENABLE ROW LEVEL SECURITY;

-- Public can read raffle entries
CREATE POLICY "raffle_entries_public_read"
  ON raffle_entries FOR SELECT
  TO public
  USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "raffle_entries_service_role_all"
  ON raffle_entries FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 3. raffle_winners: Enable RLS, add policies
-- ============================================================
ALTER TABLE raffle_winners ENABLE ROW LEVEL SECURITY;

-- Public can read raffle winners
CREATE POLICY "raffle_winners_public_read"
  ON raffle_winners FOR SELECT
  TO public
  USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "raffle_winners_service_role_all"
  ON raffle_winners FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 4. slot_calls: Remove overly permissive public write policies
-- ============================================================
DROP POLICY IF EXISTS "Allow public insert on slot_calls" ON slot_calls;
DROP POLICY IF EXISTS "Allow public update on slot_calls" ON slot_calls;
DROP POLICY IF EXISTS "Allow public delete on slot_calls" ON slot_calls;

-- Service role retains full access (already exists, recreate safely)
DROP POLICY IF EXISTS "Allow service role full access on slot_calls" ON slot_calls;
CREATE POLICY "Allow service role full access on slot_calls"
  ON slot_calls FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 5. stream_games_config: Remove public UPDATE
-- ============================================================
DROP POLICY IF EXISTS "Allow public update on stream_games_config" ON stream_games_config;

-- Ensure service role can still manage it
CREATE POLICY "Allow service role full access on stream_games_config"
  ON stream_games_config FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 6. wager_races: Lock down the catch-all ALL policy
-- ============================================================
DROP POLICY IF EXISTS "enable_all_wager_races" ON wager_races;

-- Only service role can mutate
CREATE POLICY "wager_races_service_role_all"
  ON wager_races FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 7. wager_race_milestones: Lock down the catch-all ALL policy
-- ============================================================
DROP POLICY IF EXISTS "enable_all_wager_milestones" ON wager_race_milestones;

-- Only service role can mutate
CREATE POLICY "wager_race_milestones_service_role_all"
  ON wager_race_milestones FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 8. wager_race_winners: Restrict insert to service role only
-- ============================================================
DROP POLICY IF EXISTS "winners_insert_authenticated" ON wager_race_winners;

-- Only service role can insert winners
CREATE POLICY "wager_race_winners_service_role_all"
  ON wager_race_winners FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
