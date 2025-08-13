/*
  # Create Inventory Management Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `avatar_url` (text, optional)
      - `is_admin` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `sku` (text, unique)
      - `category` (text)
      - `current_stock` (integer)
      - `min_stock_level` (integer)
      - `max_stock_level` (integer)
      - `unit_price` (decimal)
      - `supplier_info` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `sales_data`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `quantity_sold` (integer)
      - `sale_price` (decimal)
      - `sale_date` (date)
      - `created_at` (timestamp)
    
    - `demand_forecasts`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `forecast_date` (date)
      - `predicted_demand` (integer)
      - `confidence_score` (decimal)
      - `lower_bound` (integer)
      - `upper_bound` (integer)
      - `model_version` (text)
      - `created_at` (timestamp)
    
    - `inventory_alerts`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `alert_type` (text) -- 'low_stock', 'overstock', 'high_demand'
      - `message` (text)
      - `is_read` (boolean, default false)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add admin-only policies for sensitive operations
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  password_hash text NOT NULL,
  avatar_url text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text UNIQUE NOT NULL,
  category text NOT NULL,
  current_stock integer NOT NULL DEFAULT 0,
  min_stock_level integer DEFAULT 10,
  max_stock_level integer DEFAULT 1000,
  unit_price decimal(10,2) NOT NULL,
  supplier_info jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sales_data table
CREATE TABLE IF NOT EXISTS sales_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity_sold integer NOT NULL,
  sale_price decimal(10,2) NOT NULL,
  sale_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create demand_forecasts table
CREATE TABLE IF NOT EXISTS demand_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  forecast_date date NOT NULL,
  predicted_demand integer NOT NULL,
  confidence_score decimal(3,2) NOT NULL,
  lower_bound integer NOT NULL,
  upper_bound integer NOT NULL,
  model_version text DEFAULT 'v1.0',
  created_at timestamptz DEFAULT now()
);

-- Create inventory_alerts table
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('low_stock', 'overstock', 'high_demand')),
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create policies for products table
CREATE POLICY "Products are readable by authenticated users"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

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

-- Create policies for sales_data table
CREATE POLICY "Sales data readable by authenticated users"
  ON sales_data
  FOR SELECT
  TO authenticated
  USING (true);

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

-- Create policies for demand_forecasts table
CREATE POLICY "Forecasts readable by authenticated users"
  ON demand_forecasts
  FOR SELECT
  TO authenticated
  USING (true);

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

-- Create policies for inventory_alerts table
CREATE POLICY "Users can read alerts"
  ON inventory_alerts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update alert read status"
  ON inventory_alerts
  FOR UPDATE
  TO authenticated
  USING (true);

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_sales_data_product_id ON sales_data(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_data_date ON sales_data(sale_date);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_product_id ON demand_forecasts(product_id);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_date ON demand_forecasts(forecast_date);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_product_id ON inventory_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_type ON inventory_alerts(alert_type);

-- Insert sample data
INSERT INTO products (name, sku, category, current_stock, min_stock_level, max_stock_level, unit_price) VALUES
('Organic Rice 5kg', 'ORG-RICE-5K', 'Grains', 45, 20, 500, 350.00),
('Wheat Flour 10kg', 'WHT-FLR-10K', 'Grains', 78, 15, 300, 420.00),
('Coconut Oil 1L', 'COC-OIL-1L', 'Oils', 156, 25, 400, 180.00),
('Basmati Rice 1kg', 'BAS-RICE-1K', 'Grains', 23, 30, 200, 120.00),
('Turmeric Powder 500g', 'TUR-PWD-500G', 'Spices', 67, 20, 150, 95.00),
('Mustard Oil 1L', 'MUS-OIL-1L', 'Oils', 89, 20, 300, 165.00),
('Red Chili Powder 250g', 'RED-CHI-250G', 'Spices', 134, 25, 200, 85.00),
('Toor Dal 1kg', 'TOOR-DAL-1K', 'Pulses', 56, 15, 250, 145.00);

-- Insert sample sales data for the last 3 months
INSERT INTO sales_data (product_id, quantity_sold, sale_price, sale_date)
SELECT 
  p.id,
  (RANDOM() * 20 + 5)::integer,
  p.unit_price,
  CURRENT_DATE - (RANDOM() * 90)::integer
FROM products p, generate_series(1, 10) s;

-- Insert sample demand forecasts
INSERT INTO demand_forecasts (product_id, forecast_date, predicted_demand, confidence_score, lower_bound, upper_bound)
SELECT 
  p.id,
  CURRENT_DATE + s.day,
  (RANDOM() * 50 + 20)::integer,
  (RANDOM() * 0.3 + 0.7)::decimal(3,2),
  (RANDOM() * 30 + 10)::integer,
  (RANDOM() * 80 + 40)::integer
FROM products p, generate_series(1, 14) s(day);

-- Insert sample alerts
INSERT INTO inventory_alerts (product_id, alert_type, message)
SELECT 
  id,
  CASE 
    WHEN current_stock < min_stock_level THEN 'low_stock'
    WHEN current_stock > max_stock_level THEN 'overstock'
    ELSE 'high_demand'
  END,
  CASE 
    WHEN current_stock < min_stock_level THEN 'Low stock alert: ' || name || ' is running low'
    WHEN current_stock > max_stock_level THEN 'Overstock alert: ' || name || ' has excess inventory'
    ELSE 'High demand predicted for ' || name
  END
FROM products
WHERE current_stock < min_stock_level OR current_stock > max_stock_level;