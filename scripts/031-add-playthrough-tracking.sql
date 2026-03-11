-- Add play-through tracking columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS manual_award_balance INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS manual_award_wagered INT DEFAULT 0;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_manual_award_balance 
ON profiles(id) WHERE manual_award_balance > 0;
