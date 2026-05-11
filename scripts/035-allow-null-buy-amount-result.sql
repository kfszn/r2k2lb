-- Allow NULL values for buy_amount and buy_result in slot_calls table
-- These fields are filled in manually after bot-submitted calls come in

ALTER TABLE slot_calls ALTER COLUMN buy_amount DROP NOT NULL;
ALTER TABLE slot_calls ALTER COLUMN buy_result DROP NOT NULL;
