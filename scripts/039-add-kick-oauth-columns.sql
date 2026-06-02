-- Ensure kick OAuth columns exist on profiles table
-- Safe to run multiple times (uses IF NOT EXISTS pattern)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS kick_id            text,
  ADD COLUMN IF NOT EXISTS kick_username      text,
  ADD COLUMN IF NOT EXISTS kick_avatar        text,
  ADD COLUMN IF NOT EXISTS kick_linked_at     timestamptz;

-- Ensure account_connection_logs table exists for admin audit trail
CREATE TABLE IF NOT EXISTS account_connection_logs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  target_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  admin_profile_id  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action            text NOT NULL,
  provider          text NOT NULL,
  old_value         text,
  new_value         text
);

ALTER TABLE account_connection_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'account_connection_logs'
      AND policyname = 'Service role all account_connection_logs'
  ) THEN
    CREATE POLICY "Service role all account_connection_logs"
      ON account_connection_logs FOR ALL
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
