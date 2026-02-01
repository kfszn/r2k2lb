-- Drop existing restrictive policies
DROP POLICY IF EXISTS "admin_races_all" ON wager_races;
DROP POLICY IF EXISTS "admin_milestones_all" ON wager_race_milestones;
DROP POLICY IF EXISTS "admin_winners_insert" ON wager_race_winners;

-- Create new policies that allow all operations for now
-- In production, you'd want to restrict to admin users only
CREATE POLICY "enable_all_wager_races" ON wager_races
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "enable_all_wager_milestones" ON wager_race_milestones
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "enable_all_wager_winners" ON wager_race_winners
  FOR ALL USING (true) WITH CHECK (true);
