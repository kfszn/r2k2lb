-- Create lossback_claims table to track loss-back claims
CREATE TABLE IF NOT EXISTS public.lossback_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acebet_username TEXT NOT NULL,
  monthly_wagers DECIMAL(12, 2) NOT NULL,
  net_loss DECIMAL(12, 2) NOT NULL,
  tier INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  claim_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  claim_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.lossback_claims ENABLE ROW LEVEL SECURITY;

-- Allow public read for admin view
CREATE POLICY "allow_read_lossback_claims"
  ON public.lossback_claims FOR SELECT
  USING (true);

-- Only admins can insert/update (via service role from API)
CREATE POLICY "service_role_all_access_lossback"
  ON public.lossback_claims FOR ALL
  USING (auth.role() = 'service_role');

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_lossback_claims_username ON public.lossback_claims(acebet_username);
CREATE INDEX IF NOT EXISTS idx_lossback_claims_status ON public.lossback_claims(status);
CREATE INDEX IF NOT EXISTS idx_lossback_claims_date ON public.lossback_claims(claim_date DESC);

COMMIT;
