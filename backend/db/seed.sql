-- ============================================================
-- SupplySetu AI — Seed Data
-- Run AFTER schema.sql
-- This populates the DB with realistic Mumbai vendor data
-- for immediate demo use without waiting for real orders.
-- ============================================================

-- ============================================================
-- 1. CUSTOMERS (5 Mumbai-area stores)
-- ============================================================
INSERT INTO customers (id, name, phone, address, lat, lng, tags) VALUES
  (
    'c1000000-0000-0000-0000-000000000001',
    'ABC Stores',
    '+919876543210',
    'Dadar West Market, Mumbai',
    19.0178, 72.8478,
    ARRAY['regular', 'tomato', 'high-volume']
  ),
  (
    'c1000000-0000-0000-0000-000000000002',
    'Sharma Kirana',
    '+919876543211',
    'Worli Village, Mumbai',
    19.0148, 72.8184,
    ARRAY['regular', 'potato', 'onion']
  ),
  (
    'c1000000-0000-0000-0000-000000000003',
    'Hotel Sai Ram',
    '+919876543212',
    'Dharavi Main Road, Mumbai',
    19.0432, 72.8556,
    ARRAY['restaurant', 'bulk', 'tomato']
  ),
  (
    'c1000000-0000-0000-0000-000000000004',
    'Mehta Grocers',
    '+919876543213',
    'Mahim Causeway, Mumbai',
    19.0396, 72.8419,
    ARRAY['regular', 'seasonal']
  ),
  (
    'c1000000-0000-0000-0000-000000000005',
    'Green Leaf Deli',
    '+919876543214',
    'Bandra West, Mumbai',
    19.0596, 72.8295,
    ARRAY['premium', 'organic', 'leafy-greens']
  )
ON CONFLICT (phone) DO NOTHING;

-- ============================================================
-- 2. ORDERS for today (mix of statuses)
-- ============================================================
INSERT INTO orders (id, customer_id, customer_name, status, source, scheduled_date, raw_transcript) VALUES
  (
    'a1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'ABC Stores', 'pending', 'simulator_voice', CURRENT_DATE,
    'Kal subah 20 kilo tamatar aur 15 kilo pyaz bhejna'
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000002',
    'Sharma Kirana', 'in_transit', 'simulator_text', CURRENT_DATE,
    '20 kg potato and 5 kg garlic please'
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000003',
    'Hotel Sai Ram', 'delivered', 'simulator_voice', CURRENT_DATE,
    '50 kilo tamatar chahiye aaj'
  ),
  (
    'a1000000-0000-0000-0000-000000000004',
    'c1000000-0000-0000-0000-000000000004',
    'Mehta Grocers', 'pending', 'manual', CURRENT_DATE,
    NULL
  ),
  (
    'a1000000-0000-0000-0000-000000000005',
    'c1000000-0000-0000-0000-000000000005',
    'Green Leaf Deli', 'pending', 'simulator_voice', CURRENT_DATE,
    'Bhaiya 2 dozen palak aur 3 kg methi chahiye kal tak'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. ORDER ITEMS
-- ============================================================
INSERT INTO order_items (order_id, product_name, quantity, unit) VALUES
  -- ABC Stores order
  ('a1000000-0000-0000-0000-000000000001', 'Tomato',  20, 'kg'),
  ('a1000000-0000-0000-0000-000000000001', 'Onion',   15, 'kg'),

  -- Sharma Kirana order
  ('a1000000-0000-0000-0000-000000000002', 'Potato',   20, 'kg'),
  ('a1000000-0000-0000-0000-000000000002', 'Garlic',    5, 'kg'),

  -- Hotel Sai Ram order (delivered)
  ('a1000000-0000-0000-0000-000000000003', 'Tomato',   50, 'kg'),

  -- Mehta Grocers order (manual)
  ('a1000000-0000-0000-0000-000000000004', 'Potato',   30, 'kg'),
  ('a1000000-0000-0000-0000-000000000004', 'Onion',    20, 'kg'),
  ('a1000000-0000-0000-0000-000000000004', 'Tomato',   10, 'kg'),

  -- Green Leaf Deli order
  ('a1000000-0000-0000-0000-000000000005', 'Spinach',   2, 'dozen'),
  ('a1000000-0000-0000-0000-000000000005', 'Fenugreek', 3, 'kg');

-- ============================================================
-- 4. Historical ORDERS (yesterday) for analytics/charts
-- ============================================================
INSERT INTO orders (id, customer_id, customer_name, status, source, scheduled_date) VALUES
  ('a2000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001',
   'ABC Stores', 'delivered', 'simulator_voice', CURRENT_DATE - 1),
  ('a2000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003',
   'Hotel Sai Ram', 'delivered', 'simulator_text', CURRENT_DATE - 1),
  ('a2000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002',
   'Sharma Kirana', 'delivered', 'manual', CURRENT_DATE - 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (order_id, product_name, quantity, unit) VALUES
  ('a2000000-0000-0000-0000-000000000001', 'Tomato', 25, 'kg'),
  ('a2000000-0000-0000-0000-000000000001', 'Onion',  10, 'kg'),
  ('a2000000-0000-0000-0000-000000000002', 'Tomato', 40, 'kg'),
  ('a2000000-0000-0000-0000-000000000002', 'Potato', 15, 'kg'),
  ('a2000000-0000-0000-0000-000000000003', 'Potato', 30, 'kg'),
  ('a2000000-0000-0000-0000-000000000003', 'Garlic',  8, 'kg');

-- ============================================================
-- 5. Verify (check counts)
-- ============================================================
SELECT 'customers' AS table_name, COUNT(*) AS rows FROM customers
UNION ALL
SELECT 'orders',    COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items;
