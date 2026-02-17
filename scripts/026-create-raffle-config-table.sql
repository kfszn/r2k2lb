CREATE TABLE IF NOT EXISTS raffle_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL UNIQUE,
  min_wager DECIMAL NOT NULL DEFAULT 50,
  prize_amount DECIMAL NOT NULL DEFAULT 1000,
  max_entries INT NOT NULL DEFAULT 10000,
  start_date DATE NOT NULL DEFAULT '2026-02-14',
  end_date DATE NOT NULL DEFAULT '2026-02-21',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO raffle_config (platform, min_wager, prize_amount, max_entries, start_date, end_date)
VALUES 
  ('acebet', 50, 1000, 10000, '2026-02-14', '2026-02-21'),
  ('packdraw', 50, 1000, 10000, '2026-02-14', '2026-02-21')
ON CONFLICT (platform) DO NOTHING;
