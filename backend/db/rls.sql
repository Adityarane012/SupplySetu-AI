-- ============================================================
-- SupplySetu AI — Row Level Security (RLS)
-- Run AFTER schema.sql and seed.sql
--
-- For a hackathon MVP, we use a simple open policy.
-- In production, restrict by vendor/user ID.
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE customers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages     ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- MVP POLICY: Allow all operations for authenticated AND
-- anonymous users (anon key).
-- This is fine for a hackathon — tighten before production.
-- ============================================================

CREATE POLICY "allow_all_customers"   ON customers   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_orders"      ON orders      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_deliveries"  ON deliveries  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_messages"    ON messages    FOR ALL USING (true) WITH CHECK (true);
