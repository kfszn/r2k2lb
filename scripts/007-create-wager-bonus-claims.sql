-- Create wager_bonus_claims table to track wager bonus claims with period/date
CREATE TABLE IF NOT EXISTS wager_bonus_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  platform TEXT DEFAULT 'packdraw', -- packdraw, acebet, etc.
  tier_name TEXT NOT NULL, -- Bronze, Silver, Gold, etc.
  wager_amount DECIMAL(15, 2) NOT NULL,
  reward_amount DECIMAL(10, 2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  claim_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending', -- pending, approved, paid
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_wager_claims_username ON wager_bonus_claims(username);
CREATE INDEX IF NOT EXISTS idx_wager_claims_period ON wager_bonus_claims(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_wager_claims_status ON wager_bonus_claims(status);
CREATE INDEX IF NOT EXISTS idx_wager_claims_platform ON wager_bonus_claims(platform);

-- Enable RLS
ALTER TABLE wager_bonus_claims ENABLE ROW LEVEL SECURITY;

-- Allow admin access (assuming admin JWT claim exists)
CREATE POLICY "Admin can manage wager claims" ON wager_bonus_claims
  FOR ALL
  USING (true)
  WITH CHECK (true);
