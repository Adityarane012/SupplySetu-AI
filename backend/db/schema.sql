-- ============================================================
-- SupplySetu AI — Supabase Database Migration
-- Run this ENTIRE file in the Supabase SQL Editor
-- https://app.supabase.com → SQL Editor → New Query → Paste → Run
-- ============================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. CUSTOMERS table
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  phone       TEXT UNIQUE,
  address     TEXT,
  lat         FLOAT,
  lng         FLOAT,
  tags        TEXT[],
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. ORDERS table
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name   TEXT NOT NULL DEFAULT 'Unknown',
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'in_transit', 'delivered', 'cancelled')),
  source          TEXT NOT NULL DEFAULT 'manual'
                    CHECK (source IN (
                      'manual',
                      'simulator_text',
                      'simulator_voice',
                      'whatsapp_voice',
                      'whatsapp_text'
                    )),
  scheduled_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  raw_transcript  TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. ORDER ITEMS table
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity     NUMERIC NOT NULL CHECK (quantity > 0),
  unit         TEXT NOT NULL DEFAULT 'kg'
                 CHECK (unit IN ('kg', 'piece', 'dozen', 'litre', 'bundle', 'gram', 'box')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. DELIVERIES table (batched route results)
-- ============================================================
CREATE TABLE IF NOT EXISTS deliveries (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_ids    UUID[],
  route        JSONB,        -- [{lat, lng, customer_name, order_id, type}]
  distance_km  FLOAT,
  est_minutes  INT,
  fuel_cost_inr FLOAT,
  status       TEXT NOT NULL DEFAULT 'assigned'
                 CHECK (status IN ('assigned', 'en_route', 'completed')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. MESSAGES table (Simulator chat log)
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  direction    TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  customer_phone TEXT,
  customer_name  TEXT,
  body         TEXT,
  transcript   TEXT,
  order_id     UUID REFERENCES orders(id) ON DELETE SET NULL,
  source       TEXT DEFAULT 'simulator',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date          ON orders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_orders_customer      ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order    ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone      ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name       ON customers(name);
CREATE INDEX IF NOT EXISTS idx_messages_phone       ON messages(customer_phone);

-- ============================================================
-- 8. Auto-update `updated_at` on orders
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 9. Enable Realtime on orders table
--    (Supabase real-time subscriptions for the dashboard)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ============================================================
-- DONE! Run the seed.sql file next to populate mock data.
-- ============================================================
