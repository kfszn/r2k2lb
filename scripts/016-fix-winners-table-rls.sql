-- Fix RLS for wager_race_winners table to allow public read access

-- Ensure RLS is enabled
ALTER TABLE wager_race_winners ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (using IF EXISTS to avoid errors)
DROP POLICY IF EXISTS "winners_are_publicly_readable" ON wager_race_winners;
DROP POLICY IF EXISTS "winners_are_readable" ON wager_race_winners;
DROP POLICY IF EXISTS "winners_insert_admin_only" ON wager_race_winners;
DROP POLICY IF EXISTS "winners_insert_authenticated" ON wager_race_winners;

-- Create a simple policy allowing all authenticated and anonymous users to READ winners
CREATE POLICY "winners_are_publicly_readable"
ON wager_race_winners
FOR SELECT
USING (true);

-- Create a policy allowing only authenticated users to INSERT winners
CREATE POLICY "winners_insert_authenticated"
ON wager_race_winners
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT SELECT ON wager_race_winners TO anon;
GRANT SELECT ON wager_race_winners TO authenticated;
GRANT INSERT ON wager_race_winners TO authenticated;
