-- Settings table for configurable bot/reward values
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO settings (key, value) VALUES
  ('points_per_message', '1'),
  ('points_per_10min_watch', '1')
ON CONFLICT (key) DO NOTHING;

-- Shop items
CREATE TABLE IF NOT EXISTS shop_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO shop_items (name, description, points_cost) VALUES
  ('$100 Tip', 'R2K2 will tip you $100 on stream', 60000)
ON CONFLICT DO NOTHING;

-- Redemptions
CREATE TABLE IF NOT EXISTS redemptions (
  id SERIAL PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  shop_item_id INTEGER REFERENCES shop_items(id),
  order_id VARCHAR(20) UNIQUE NOT NULL,
  points_spent INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Point transactions log
CREATE TABLE IF NOT EXISTS point_transactions (
  id SERIAL PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  amount INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- Settings: public read, service role write
CREATE POLICY "Public can read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Service role can manage settings" ON settings FOR ALL USING (auth.role() = 'service_role');

-- Shop items: public read, service role write
CREATE POLICY "Public can read shop items" ON shop_items FOR SELECT USING (true);
CREATE POLICY "Service role can manage shop items" ON shop_items FOR ALL USING (auth.role() = 'service_role');

-- Redemptions: user can view their own, service role full access
CREATE POLICY "Users can view own redemptions" ON redemptions FOR SELECT USING (
  profile_id = auth.uid()
);
CREATE POLICY "Service role full access on redemptions" ON redemptions FOR ALL USING (auth.role() = 'service_role');

-- Point transactions: user can view their own, service role full access
CREATE POLICY "Users can view own transactions" ON point_transactions FOR SELECT USING (
  profile_id = auth.uid()
);
CREATE POLICY "Service role full access on point_transactions" ON point_transactions FOR ALL USING (auth.role() = 'service_role');
