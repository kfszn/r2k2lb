CREATE TABLE IF NOT EXISTS raffle_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL UNIQUE,
  min_wager DECIMAL NOT NULL DEFAULT 50,
  prize_amount DECIMAL NOT NULL DEFAULT 1000,
  max_entries INT NOT NULL DEFAULT 10000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO raffle_config (platform, min_wager, prize_amount, max_entries)
VALUES 
  ('acebet', 50, 1000, 10000),
  ('packdraw', 50, 1000, 10000)
ON CONFLICT (platform) DO NOTHING;
