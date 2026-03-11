-- Add inventory column to shop_items
-- NULL means unlimited stock; a number means limited quantity available
ALTER TABLE shop_items
  ADD COLUMN IF NOT EXISTS inventory INTEGER DEFAULT NULL;

-- Comment for clarity
COMMENT ON COLUMN shop_items.inventory IS 'NULL = unlimited stock. A positive integer limits how many times this item can be redeemed.';
