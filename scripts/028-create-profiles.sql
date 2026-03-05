-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  account_id VARCHAR(10) UNIQUE NOT NULL,
  email TEXT NOT NULL,
  kick_username TEXT,
  acebet_username TEXT,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Service role full access (for the kick/verify bot route)
CREATE POLICY "Service role full access on profiles" ON profiles FOR ALL USING (auth.role() = 'service_role');

-- Account ID generator
CREATE OR REPLACE FUNCTION generate_account_id()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := 'R2K2-';
  i INTEGER;
  new_id TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    new_id := 'R2K2-';
    FOR i IN 1..5 LOOP
      new_id := new_id || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    SELECT COUNT(*) INTO exists_check FROM profiles WHERE account_id = new_id;
    EXIT WHEN exists_check = 0;
  END LOOP;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function: auto-create profile on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, account_id)
  VALUES (
    NEW.id,
    NEW.email,
    generate_account_id()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
