-- Fix RLS policy for lossback_claims to allow anon inserts for admin panel
-- Drop the restrictive service_role policy
DROP POLICY IF EXISTS "service_role_all_access_lossback" ON public.lossback_claims;

-- Add new policy to allow inserts from authenticated users or anon
CREATE POLICY "allow_insert_lossback_claims"
  ON public.lossback_claims FOR INSERT
  WITH CHECK (true);

-- Add update policy for status changes
CREATE POLICY "allow_update_lossback_claims"
  ON public.lossback_claims FOR UPDATE
  WITH CHECK (true);

-- Keep the read policy
-- READ policy already exists: allow_read_lossback_claims

COMMIT;
