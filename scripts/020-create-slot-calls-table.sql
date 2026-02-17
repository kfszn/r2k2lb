-- Create slot_calls table
CREATE TABLE slot_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  buy_amount NUMERIC NOT NULL,
  buy_result NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' or 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE slot_calls ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Allow service role full access on slot_calls" ON slot_calls
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow public to read
CREATE POLICY "Allow public read on slot_calls" ON slot_calls
  FOR SELECT
  USING (true);
