-- ============================================================
-- FIX SUPABASE AUTHENTICATION INTEGRATION
-- Run this in your Supabase SQL Editor to fix authentication
-- ============================================================

-- 1. First, let's backup any existing user data (if any)
CREATE TABLE IF NOT EXISTS users_backup AS 
SELECT * FROM users WHERE 1=0; -- Empty backup table structure

-- 2. Drop the problematic users table
DROP TABLE IF EXISTS users CASCADE;

-- 3. Create proper users table that integrates with auth.users
CREATE TABLE users (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  role text DEFAULT 'user',
  avatar_url text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 5. Create proper RLS policies
CREATE POLICY "Users can view own profile" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" 
  ON users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 6. Create function to handle new user creation automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger for automatic user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. Create function to make user admin (you'll need this)
CREATE OR REPLACE FUNCTION make_user_admin(user_email text)
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET is_admin = true, role = 'admin'
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Update existing product policies to work with new users table
DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- 10. Update sales_data policies
DROP POLICY IF EXISTS "Admins can manage sales data" ON sales_data;
CREATE POLICY "Admins can manage sales data"
  ON sales_data
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- 11. Update demand_forecasts policies
DROP POLICY IF EXISTS "Admins can manage forecasts" ON demand_forecasts;
CREATE POLICY "Admins can manage forecasts"
  ON demand_forecasts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- 12. Update inventory_alerts policies
DROP POLICY IF EXISTS "Admins can manage alerts" ON inventory_alerts;
CREATE POLICY "Admins can manage alerts"
  ON inventory_alerts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- 13. Create profiles for any existing auth users (if any exist)
INSERT INTO users (id, email, full_name, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  'user'
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM users WHERE users.id = au.id)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- VERIFICATION QUERIES - Run these to check if everything works
-- ============================================================

-- Check if users table is properly created
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check existing users (if any)
SELECT id, email, full_name, role, is_admin, created_at FROM users;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';
