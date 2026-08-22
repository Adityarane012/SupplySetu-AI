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

1. Open your Supabase project → **SQL Editor**.
2. Run the full contents of `backend/db/schema.sql` (safe to re-run — everything uses
   `IF NOT EXISTS`). This creates `order_history` and enables realtime on it.
3. Run the full contents of `backend/db/rls.sql` (also safe to re-run — policies are
   `CREATE POLICY`, so drop-and-recreate only if you already ran an older version and hit
   a "policy already exists" error; in that case just run:
   ```sql
   DROP POLICY IF EXISTS "allow_all_order_history" ON order_history;
   ```
   then re-run `rls.sql`).
4. Optionally run `backend/db/verify.sql` to confirm `order_history` now appears in the
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
