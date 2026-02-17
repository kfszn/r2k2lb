-- Enable public insert on slot_calls table
CREATE POLICY "Allow public insert on slot_calls"
  ON slot_calls
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Enable public update on slot_calls table
CREATE POLICY "Allow public update on slot_calls"
  ON slot_calls
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Enable public delete on slot_calls table
CREATE POLICY "Allow public delete on slot_calls"
  ON slot_calls
  FOR DELETE
  TO anon
  USING (true);
