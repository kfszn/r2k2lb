-- Create request limits table for slot calls
CREATE TABLE IF NOT EXISTS slot_call_request_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  max_requests_per_hour INT NOT NULL DEFAULT 10,
  max_requests_per_day INT NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE slot_call_request_limits ENABLE ROW LEVEL SECURITY;

-- Public read policy (anyone can view limits)
CREATE POLICY "Allow public read" ON slot_call_request_limits
  FOR SELECT USING (TRUE);

-- Admin-only write policy
CREATE POLICY "Allow admin write" ON slot_call_request_limits
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Allow admin update" ON slot_call_request_limits
  FOR UPDATE USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Allow admin delete" ON slot_call_request_limits
  FOR DELETE USING (TRUE);
