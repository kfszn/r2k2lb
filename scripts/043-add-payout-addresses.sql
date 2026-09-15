-- Player-managed crypto payout addresses, surfaced to admins when paying out rewards.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS usdt_address TEXT,
  ADD COLUMN IF NOT EXISTS sol_address TEXT;
