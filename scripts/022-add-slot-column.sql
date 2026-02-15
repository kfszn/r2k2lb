-- Add slot column to slot_calls table
ALTER TABLE slot_calls
ADD COLUMN slot TEXT NOT NULL DEFAULT '';
