# Round 2 Deliverables — Intent Capture: Change History

> **Challenge #504:** Extend the MVP with a capability related to goals, purpose, and user
> intent. Record meaningful changes over time and make them easy to inspect.

This document explains what was built, and the steps **you** need to complete before it
works end-to-end and can be demoed to judges.

---

## What was built

A change-history / intent-capture system layered on top of the existing order pipeline:

- **New `order_history` table** — records every meaningful change to an order (creation,
  status change, notes edit), each entry paired with the *intent* (why it happened), not
  just the diff (what happened).
- **Intent inference from voice/text orders** — the LLM extraction prompt now returns an
  `intent` field summarizing the customer's underlying goal (e.g. *"Extra tomatoes needed
  for a family function"* vs *"Weekly restock for the store"*), captured automatically
  when an order is created via WhatsApp or the Simulator.
- **Manual intent capture** — when a vendor changes an order's status (in-transit,
  delivered, cancelled) from the dashboard, they're prompted for a reason. Cancellation
  requires one; other transitions fall back to a sensible default if skipped.
- **New `/orders/[id]` page** — an order detail view with a live-updating (Supabase
  realtime) timeline showing every change and its captured intent.
- **New API:** `GET /api/orders/{id}/history`.

Code is committed and pushed to branch `claude/project-docs-review-75xxw8`.

---

## What you need to do

### 1. Run the database migration (required)

The `order_history` table doesn't exist in your Supabase project yet — I don't have your
credentials, so this step can't be automated from here.

The other five tables (`customers`, `orders`, `order_items`, `deliveries`, `messages`)
already exist in the project — only `order_history` is missing.

**Do NOT run the whole of `backend/db/schema.sql`.** That file ends with
`ALTER PUBLICATION supabase_realtime ADD TABLE orders;`, and because `orders` is already a
member of that publication, the statement fails with *"relation orders is already member of
publication"*. Run this targeted snippet in the Supabase **SQL Editor** instead:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS order_history (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  change_type  TEXT NOT NULL
                 CHECK (change_type IN ('created', 'status_changed', 'notes_changed')),
  summary      TEXT NOT NULL,
  intent       TEXT,
  source       TEXT NOT NULL DEFAULT 'system'
                 CHECK (source IN ('voice', 'text', 'manual', 'system')),
  actor        TEXT,
  before_data  JSONB,
  after_data   JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_history_order
  ON order_history(order_id, created_at DESC);

ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_order_history" ON order_history;
CREATE POLICY "allow_all_order_history"
  ON order_history FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE order_history;
```

Then optionally run `backend/db/verify.sql` to confirm `order_history` appears in the
table list.

### 2. Restart the backend

Pull the latest branch and restart FastAPI so the updated routers/services load:

```bash
git pull origin claude/project-docs-review-75xxw8
cd backend
uvicorn main:app --reload
```

No new environment variables or dependencies were added — your existing `.env` works
as-is.

### 3. Restart the frontend

```bash
git pull origin claude/project-docs-review-75xxw8
cd frontend
npm run dev
```

### 4. Demo the complete flow

1. Go to `/simulator` and send a voice or text order, e.g.
   *"20 kg tomato, ghar mein function hai"* (mentioning a reason makes the inferred
   intent more interesting to show off).
2. Go to `/orders`, find the new order, click the customer name (or the **View** button)
   to open `/orders/[id]`.
3. You'll see the **Change History** panel with a "Order created" entry and the
   AI-inferred intent shown as a quote.
4. Click **Mark In Transit** → a modal asks "Why?" → enter a reason (or leave blank for
   the default) → confirm. A new timeline entry appears immediately (realtime).
5. Try **Cancel Order** on a different order to show that a reason is *required* for
   cancellations.

### 5. (Optional) Open a pull request

I did not open a PR since you didn't ask for one. If you want this merged, either ask me
to open one, or run:

```bash
gh pr create --base main --head claude/project-docs-review-75xxw8
```

### 6. (Optional) Re-seed demo data

`backend/scripts/seed_db.py` and `backend/db/seed.sql` still seed only `customers`,
`orders`, and `order_items` — seeded orders will have **no** history entries (they
predate this feature). That's expected and fine for a demo: create a fresh order via
the Simulator or WhatsApp to show the full intent-capture flow, and use the seeded data
just for the dashboard/route/analytics screens as before.

---

## Known limitations (be ready to answer if judges ask)

- History is currently tracked at the **order** level only (creation, status, notes).
  Item-level edits (e.g. changing quantities on an existing order) aren't captured yet —
  there's no edit-items endpoint in this MVP.
- Intent inference quality depends on the LLM (Groq cloud or local Ollama) correctly
  reading context from the transcript; short/ambiguous messages fall back to a generic
  "Routine grocery order" intent.
- History logging is best-effort (wrapped in try/except) so a logging failure never
  blocks the primary order flow — but it does mean a transient Supabase error could
  silently produce a gap in the timeline.
