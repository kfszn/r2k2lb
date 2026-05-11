-- Add public write/delete access to slot_calls table
-- This allows admin users to insert, update, and delete slot calls
CREATE POLICY "Allow public insert on slot_calls" ON slot_calls
  FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Allow public update on slot_calls" ON slot_calls
  FOR UPDATE
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Allow public delete on slot_calls" ON slot_calls
  FOR DELETE
  USING (TRUE);
