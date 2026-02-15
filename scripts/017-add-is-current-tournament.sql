-- Add is_current field to tournaments table to track the current live tournament
ALTER TABLE tournaments ADD COLUMN is_current BOOLEAN DEFAULT false;

-- Create an index for efficient querying
CREATE INDEX idx_tournaments_is_current ON tournaments(is_current) WHERE is_current = true;

-- Add a constraint to ensure only one tournament can be current
CREATE UNIQUE INDEX unique_current_tournament ON tournaments(is_current) WHERE is_current = true;
