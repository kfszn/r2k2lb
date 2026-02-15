-- Add new columns to slot_calls table if they don't exist
ALTER TABLE slot_calls 
ADD COLUMN IF NOT EXISTS slot_name TEXT,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'call',
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS multiplier NUMERIC;

-- Create index on slot_name and type for faster queries
CREATE INDEX IF NOT EXISTS idx_slot_calls_slot_name ON slot_calls(slot_name);
CREATE INDEX IF NOT EXISTS idx_slot_calls_type ON slot_calls(type);
CREATE INDEX IF NOT EXISTS idx_slot_calls_timestamp ON slot_calls(timestamp DESC);
