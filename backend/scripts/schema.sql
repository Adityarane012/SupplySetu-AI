-- Drop tables if they already exist (Useful for resetting schema)
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS customers;

-- 1. Customers Table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  source TEXT,
  scheduled_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Order Items Table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity DOUBLE PRECISION,
  unit TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime on the orders table so the Next.js UI updates instantly
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
