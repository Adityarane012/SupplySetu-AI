-- ============================================================
-- SupplySetu AI — Quick DB Verification Queries
-- Run these after schema.sql + seed.sql to confirm setup
-- ============================================================

-- 1. Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('customers', 'orders', 'order_items', 'deliveries', 'messages')
ORDER BY table_name;

-- 2. Check row counts
SELECT 'customers'   AS tbl, COUNT(*) AS rows FROM customers
UNION ALL
SELECT 'orders',              COUNT(*)         FROM orders
UNION ALL
SELECT 'order_items',         COUNT(*)         FROM order_items;

-- 3. Check today's order summary (simulates dashboard KPI)
SELECT
  COUNT(*) FILTER (WHERE status = 'pending')    AS pending,
  COUNT(*) FILTER (WHERE status = 'in_transit') AS in_transit,
  COUNT(*) FILTER (WHERE status = 'delivered')  AS delivered,
  COUNT(*)                                       AS total
FROM orders
WHERE scheduled_date = CURRENT_DATE;

-- 4. Check order items join
SELECT
  o.customer_name,
  o.status,
  oi.product_name,
  oi.quantity,
  oi.unit
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
ORDER BY o.customer_name, oi.product_name;

-- 5. Check realtime publication (should show 'orders')
SELECT pubname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
