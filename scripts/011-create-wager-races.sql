-- Create wager_races table
CREATE TABLE IF NOT EXISTS wager_races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('acebet', 'packdraw')),
  period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Prevent duplicate race configs
  UNIQUE(platform, period, start_date)
);

-- Create wager_race_milestones table
CREATE TABLE IF NOT EXISTS wager_race_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID NOT NULL REFERENCES wager_races(id) ON DELETE CASCADE,
  wager_amount NUMERIC NOT NULL,
  reward_amount NUMERIC NOT NULL,
  milestone_order INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(race_id, wager_amount)
);

-- Create wager_race_winners table (stores milestone winners)
CREATE TABLE IF NOT EXISTS wager_race_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES wager_race_milestones(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  platform TEXT NOT NULL,
  race_id UUID NOT NULL REFERENCES wager_races(id) ON DELETE CASCADE,
  won_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure each milestone only has one winner
  UNIQUE(milestone_id)
);

-- Create indexes for performance
CREATE INDEX idx_wager_races_platform_period ON wager_races(platform, period);
CREATE INDEX idx_wager_races_active ON wager_races(is_active);
CREATE INDEX idx_wager_race_milestones_race_id ON wager_race_milestones(race_id);
CREATE INDEX idx_wager_race_winners_race_id ON wager_race_winners(race_id);
CREATE INDEX idx_wager_race_winners_milestone_id ON wager_race_winners(milestone_id);

-- Enable Row Level Security
ALTER TABLE wager_races ENABLE ROW LEVEL SECURITY;
ALTER TABLE wager_race_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE wager_race_winners ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Everyone can view races
CREATE POLICY "races_are_public" ON wager_races
  FOR SELECT USING (true);

CREATE POLICY "milestones_are_public" ON wager_race_milestones
  FOR SELECT USING (true);

CREATE POLICY "winners_are_public" ON wager_race_winners
  FOR SELECT USING (true);

-- RLS Policies: Only authenticated users (via API) can insert/update
CREATE POLICY "admin_races_all" ON wager_races
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "admin_milestones_all" ON wager_race_milestones
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "admin_winners_insert" ON wager_race_winners
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
