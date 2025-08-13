/*
  # Fix Supabase Authentication Integration
  
  This migration fixes the authentication system to properly work with Supabase auth.users
  
  1. Updates users table to match Supabase auth pattern
  2. Creates proper relationship with auth.users
  3. Sets up automatic user profile creation
  4. Fixes RLS policies
*/

-- First, let's drop the existing users table and recreate it properly
DROP TABLE IF EXISTS users CASCADE;

-- Create users table that works with Supabase auth
CREATE TABLE users (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  role text DEFAULT 'user',
  avatar_url text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users
CREATE POLICY "Users can view own profile" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" 
  ON users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update other table policies to work with the new users structure
-- Update products policies
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

-- Update sales_data policies
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

-- Update demand_forecasts policies
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

-- Update inventory_alerts policies
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

-- Create an admin user function (call this manually after first user registers)
CREATE OR REPLACE FUNCTION make_user_admin(user_email text)
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET is_admin = true, role = 'admin'
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
