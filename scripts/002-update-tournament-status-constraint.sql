-- Migration: Update tournament status constraint to support 'live' and 'closed' statuses
-- This removes the old constraint and adds a new one with the updated status values

-- Drop the old constraint (this allows any value temporarily)
ALTER TABLE tournaments DROP CONSTRAINT tournaments_status_check;

-- Now update any existing 'active' status values to 'live'
UPDATE tournaments SET status = 'live' WHERE status = 'active';

-- Add the new constraint with updated status values
ALTER TABLE tournaments ADD CONSTRAINT tournaments_status_check 
  CHECK (status IN ('pending', 'registration', 'live', 'paused', 'completed', 'cancelled'));
