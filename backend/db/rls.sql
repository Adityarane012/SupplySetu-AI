-- ============================================================
-- SupplySetu AI — Row Level Security (RLS)
-- Run AFTER schema.sql and seed.sql
--
-- For a hackathon MVP, we use a simple open policy.
-- In production, restrict by vendor/user ID.
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE customers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history  ENABLE ROW LEVEL SECURITY;

-- DROP existing overly permissive policies
DROP POLICY IF EXISTS "allow_all_customers" ON customers;
DROP POLICY IF EXISTS "allow_all_orders" ON orders;
DROP POLICY IF EXISTS "allow_all_order_items" ON order_items;
DROP POLICY IF EXISTS "allow_all_deliveries" ON deliveries;
DROP POLICY IF EXISTS "allow_all_messages" ON messages;
DROP POLICY IF EXISTS "allow_all_order_history" ON order_history;

-- ============================================================
-- STRICT POLICY: Allow SELECT only for anonymous and authenticated
-- users. All inserts/updates are handled securely via the backend 
-- using the service_role key.
-- ============================================================

CREATE POLICY "anon_select_customers"     ON customers     FOR SELECT USING (true);
CREATE POLICY "anon_select_orders"        ON orders        FOR SELECT USING (true);
CREATE POLICY "anon_select_order_items"   ON order_items   FOR SELECT USING (true);
CREATE POLICY "anon_select_deliveries"    ON deliveries    FOR SELECT USING (true);
CREATE POLICY "anon_select_messages"      ON messages      FOR SELECT USING (true);

-- Browser (anon) may read history so the live timeline works. Nothing more.
DROP POLICY IF EXISTS "anon_select_order_history" ON order_history;
CREATE POLICY "order_history_read_only"
  ON order_history FOR SELECT USING (true);

-- Deliberately NO insert/update/delete policies for anon.
-- All writes go through the backend using the service_role key.

-- ============================================================
-- Defence in depth: block edits at the database level.
-- ============================================================
CREATE OR REPLACE FUNCTION prevent_order_history_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'order_history is append-only and cannot be modified';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_history_immutable ON order_history;
CREATE TRIGGER order_history_immutable
  BEFORE UPDATE ON order_history
  FOR EACH ROW EXECUTE FUNCTION prevent_order_history_mutation();
