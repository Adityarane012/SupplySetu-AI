# Round 2 Deliverables — Intent Capture: Change History

> **Challenge #504:** Extend the MVP with a capability related to goals, purpose, and user
> intent. Record meaningful changes over time and make them easy to inspect.

This document explains what was built, and the steps **you** need to complete before it
works end-to-end and can be demoed to judges.

---

## What was built

An intent-capture and change-history system layered onto the existing order pipeline.
The design principle throughout: **record not just *what* changed, but *why*.**

### 1. Capturing intent

- **`order_history` table** — an append-only log of every meaningful order change
  (`created`, `status_changed`, `notes_changed`, `items_changed`, `deleted`). Each row
  stores a human-readable `summary` (what), an `intent` (why), the `source`
  (voice / text / manual / system), the `actor`, and `before_data` / `after_data` JSONB.
- **AI-inferred customer intent** — the LLM extraction prompt returns an `intent` field
  summarising the customer's underlying goal (*"Extra tomatoes needed for a family
  function"* vs *"Weekly restock for the store"*), captured automatically on every order
  arriving via WhatsApp, the Simulator, or the manual `/orders/new` page.
- **Vendor-stated intent** — status changes prompt for a reason via a shared
  `ReasonModal`. Required for cancellations and for deliveries that miss their date;
  optional elsewhere, with a sensible default.

### 2. Changes over time

- **Order amendments** — a follow-up message ("actually make it 30 kg, guests aa rahe
  hain") is detected by the LLM (`is_amendment`), matched to the customer's most recent
  open order from the last 24 hours, and **merges into that order** rather than creating a
  new one. The item delta and the customer's stated reason are logged as `items_changed`.
- **Intent vs. outcome** — on delivery, the system compares the actual delivery time
  against the date promised at order time and stamps the order `fulfilled` / `missed` /
  `unknown`. A miss requires a reason. This turns intent from metadata into an
  accountability measure, and yields a new KPI: **intent fulfilment rate**.
- **Soft delete** — deleting an order sets `deleted_at` and requires a reason, rather than
  destroying the row. The full history survives, ending with a `deleted` entry.

### 3. Making it inspectable

- **`/orders/[id]`** — order detail with a live change-history timeline (Supabase realtime
  on both `orders` and `order_history`), each entry showing its captured intent.
- **Before → after diffs** — `HistoryDiff` renders field-level changes per entry:
  scalar fields as *old → new*, item arrays as added / removed / changed, collapsed behind
  a toggle so the intent stays the headline.
- **Time-travel snapshots** — `GET /api/orders/{id}/snapshots` reconstructs the order's
  full state at every point in its history by replaying deltas forward from creation.
  Because history logging is best-effort and can therefore have gaps, snapshots whose
  deltas don't reconcile are flagged **approximate** rather than silently shown as fact.
- **`/activity`** — a global feed of every change across all orders, filterable by change
  type and source, so a vendor can answer *"what changed today, and why?"* without opening
  orders one at a time.
- **Intent analytics** — `GET /api/analytics/intent-fulfilment` powers a fulfilment-rate
  stat and a breakdown of the most common reasons deliveries miss their intent.

### 4. Making the record trustworthy

- **Append-only history** — the `anon` role has `SELECT` only (so the browser can subscribe
  to the timeline). All writes go through the backend using the `service_role` key,
  bypassing RLS. A database trigger (`order_history_immutable`) enforces immutability
  against `UPDATE`.
- **Best-effort logging** — `history_service.log_history` swallows its own exceptions so a
  logging failure can never break the order flow it is recording.

### New API surface

| Endpoint | Purpose |
|---|---|
| `GET /api/orders/{id}/history` | Change timeline for one order |
| `GET /api/orders/{id}/snapshots` | Reconstructed state at each point in time |
| `GET /api/orders/activity` | Global change feed (filter by change_type, source) |
| `GET /api/analytics/intent-fulfilment` | Fulfilment rate + top miss reasons |
| `DELETE /api/orders/{id}` | Soft delete, reason required |

Code is on branch `claude/project-docs-review-75xxw8`.

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

- **Amendment matching is heuristic.** A follow-up is matched to the customer's most
  recent `pending`/`in_transit` order from the last 24 hours. If a customer has several
  open orders at once, the amendment could attach to the wrong one. Explicit order
  references would fix this.
- **Amendments never remove items.** The merge updates quantities and adds new products,
  but deliberately won't delete a line the customer didn't mention — so *"cancel the
  onions"* is not yet understood. Erring toward not destroying data was the safer default.
- **Intent inference quality depends on the LLM.** Short or ambiguous messages fall back
  to a generic *"Routine grocery order"*. Intent is inferred, not confirmed by the
  customer — echoing it back over WhatsApp for correction is the natural next step.
- **History logging is best-effort by design** (wrapped in try/except) so a logging failure
  can never break the order flow it records. The trade-off is that the log can have gaps.
  Time-travel snapshots handle this honestly: any state that can't be reconciled from the
  deltas is flagged **approximate** rather than presented as fact.
- **Vendors still type their reason.** For a voice-first product aimed at semi-literate
  users, reason capture should accept a voice note through the existing Whisper pipeline.
  The plumbing exists (`/api/transcribe`); only the UI wiring is missing.
- **Outcome evaluation is date-granular.** `fulfilled` vs `missed` compares calendar dates
  in IST, not delivery time windows, so "morning delivery" promises aren't yet checked.
