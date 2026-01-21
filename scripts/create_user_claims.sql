-- Create user_claims table to track Acebet username claims
CREATE TABLE IF NOT EXISTS public.user_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  acebet_username TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT
);

-- Enable RLS
ALTER TABLE public.user_claims ENABLE ROW LEVEL SECURITY;

-- Users can view their own claims
CREATE POLICY "users_view_own_claims"
  ON public.user_claims FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own claims
CREATE POLICY "users_insert_own_claims"
  ON public.user_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Only admins can update claims (approve/reject)
CREATE POLICY "admins_update_claims"
  ON public.user_claims FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tournament_admins
      WHERE tournament_admins.kick_username = (
        SELECT raw_user_meta_data->>'kick_username' FROM auth.users WHERE id = auth.uid()
      )
      AND tournament_admins.is_active = true
    )
  );

-- Service role has full access
CREATE POLICY "service_role_all_access"
  ON public.user_claims FOR ALL
  USING (auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_claims_user_id ON public.user_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_user_claims_acebet_username ON public.user_claims(acebet_username);
CREATE INDEX IF NOT EXISTS idx_user_claims_status ON public.user_claims(status);

COMMIT;
