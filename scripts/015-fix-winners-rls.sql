-- Check and fix wager_race_winners RLS if needed
ALTER TABLE wager_race_winners ENABLE ROW LEVEL SECURITY;

-- Drop any conflicting policies
DROP POLICY IF EXISTS "admin_winners_insert" ON wager_race_winners;
DROP POLICY IF EXISTS "enable_all_wager_winners" ON wager_race_winners;
DROP POLICY IF EXISTS "winners_are_public" ON wager_race_winners;

-- Create comprehensive policies
CREATE POLICY "winners_select_all" ON wager_race_winners
  FOR SELECT USING (true);

CREATE POLICY "winners_insert_authenticated" ON wager_race_winners
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
