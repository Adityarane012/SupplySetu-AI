# SupplySetu AI — Agent Guide

WhatsApp-native, voice-first logistics assistant for India's informal vendors.
A customer sends a voice note ("kal subah 20 kilo tamatar bhejna"), and the system
transcribes it, extracts a structured order, optimises the delivery route, and
tracks it to delivery — with the *intent* behind every change recorded along the way.

Monorepo: **FastAPI** backend + **Next.js 16** frontend + **Supabase** (Postgres).

---

## Start here: the knowledge graph (graphify)

This project ships a pre-built [graphify](https://pypi.org/project/graphifyy/) knowledge
graph in `graphify-out/` — 498 nodes, 483 edges, community structure and cross-file
relationships across all 64 files.

**Query it before grepping or reading files wholesale.** It returns a scoped subgraph,
usually far smaller (and cheaper) than `GRAPH_REPORT.md` or raw search output:

```bash
graphify query "how does the voice transcription pipeline work?"
graphify path "WhatsApp webhook" "Supabase orders table"   # relationship between two things
graphify explain "route_optimizer"                          # focused concept
```

Guidelines:

- Use `query` / `path` / `explain` for codebase and architecture questions.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review, or when the
  targeted commands don't surface enough context.
- If `graphify-out/wiki/index.md` ever exists, navigate that instead of raw source.
- **After changing code, run `graphify update .`** to keep the graph current. This is
  AST-only — no API calls, no cost.

Graph freshness: `GRAPH_REPORT.md` records the commit it was built from. Compare against
`git rev-parse HEAD`; if they differ, the graph is stale — run `graphify update .`.

> Note: `graphify-out/manifest.json` contains absolute Windows paths from the machine
> where the graph was first built. That's cosmetic — the graph data itself is fine — but
> it means `graphify update .` on a different machine may rebuild more than it strictly
> needs to.

Editor integrations already wired up: `.agents/rules/graphify.md` +
`.agents/workflows/graphify.md` (Antigravity), `.gemini/settings.json` (Gemini CLI hook),
and `GEMINI.md`.

---

## Layout

```
backend/            FastAPI service
  main.py           app + lifespan (background model preload, conditional seeding)
  routers/          orders · customers · route · transcribe · simulator · whatsapp · analytics
  services/         whisper_service · llm_service · route_optimizer · geocoder · history_service
  models/schemas.py Pydantic request models (validation lives here)
  db/               schema.sql · rls.sql · seed.sql · verify.sql · supabase_client.py
  scripts/seed_db.py  destructive demo seeder — see warning below
frontend/           Next.js 16 App Router
  src/app/          dashboard · orders · orders/[id] · orders/new · route-map · analytics · simulator
  src/components/   DeliveryMap · MapWrapper (Leaflet, client-only)
  public/screens/   23 static Stitch HTML mockups (design reference, mostly unrouted)
docs/               Architecture · PS · Frontend_Design_Doc · SA_Implementation ·
                    implementation_plan · improve · deliverables
graphify-out/       knowledge graph (see above)
```

## Running it

```bash
# Backend  → http://localhost:8000  (docs at /docs)
cd backend && uvicorn main:app --reload

# Frontend → http://localhost:3000
cd frontend && npm run dev
```

Env files (all gitignored; templates are the matching `.env.example`):
`backend/.env`, `frontend/.env.local`, and a root `.env` mirror for tooling.

The AI stack has a **cloud toggle**: set `GROQ_API_KEY` to use Groq for both STT and LLM
extraction (instant, no downloads — this is the path judges should use). Leave it unset to
run fully local via `faster-whisper` + Ollama.

---

## Conventions and gotchas

These are the things that have actually bitten. Read before editing.

**Never use PostgREST `.single()`.** It returns HTTP 406 when zero rows match, which
surfaces as a 500 instead of a clean 404. Use `.limit(1)` and index `result.data[0]`
after an emptiness check. All four prior occurrences were fixed for this reason.

**`scripts/seed_db.py::seed()` is destructive.** It wipes `customers`, `orders`,
`order_items` — and `order_history` with them via `ON DELETE CASCADE`. It now refuses to
run against a non-empty database unless called with `force=True`, because `main.py` runs
it at startup and free-tier hosts cold-start constantly. Don't reintroduce an
unconditional seed. Set `SEED_ON_STARTUP=false` to disable entirely.

**Importing a module must never call `sys.exit()`.** `main.py` imports the seeder at
startup, so a module-level exit on a missing credential would take down the whole API.
Credential checks belong under `if __name__ == "__main__":` or behind a lazy getter.

**App Router pages take precedence over `next.config.ts` rewrites.** Rewrites returned as
an array apply after the filesystem check, so the rewrites for `/`, `/orders/new` and
`/analytics` never fire — real React pages exist at those paths. The live ones are
`/login`, `/orders/detail`, `/customers`, `/customers/profile`, `/settings`, which map to
static Stitch mockups with no data binding. Don't assume a rewrite is active without
checking whether a page file shadows it.

**`next.config.ts` sets `typescript.ignoreBuildErrors: true`**, so `next build` skips type
validation entirely — a green build does not mean the types are sound. Run
`npx tsc --noEmit` to actually check. (Next 16 removed the `eslint` config key and no
longer runs ESLint during `next build`; use `npm run lint`.)

**Leaflet must stay client-only.** It touches `window` at import. `MapWrapper` exists to
wrap `DeliveryMap` in a dynamic import with `ssr: false` — keep map code behind it.

**History logging is best-effort by design.** `history_service.log_history` swallows its
own exceptions so a logging failure can never break the order flow it's recording.
Preserve that; don't let it raise into a request handler.

**The LLM must always return an `intent` field.** `llm_service.EXTRACT_PROMPT` asks for a
one-line "why" alongside the items. If you edit that prompt, keep `intent` in the schema,
in the examples, and in both fallback dicts — the change-history timeline depends on it.

---

## Intent Capture: Change History (Round 2)

Every meaningful order change is recorded in `order_history` together with the reason
behind it — see `docs/deliverables.md` for the full write-up and demo script.

- **Where intent comes from:** the LLM infers the customer's goal from the transcript on
  voice/text orders; the vendor is prompted for a reason on manual status changes
  (required for cancellations).
- **Write path:** `services/history_service.py`, called from `routers/orders.py`
  (create + update), `routers/whatsapp.py`, and `routers/simulator.py`.
- **Read path:** `GET /api/orders/{id}/history` → rendered as a live timeline on
  `/orders/[id]`, subscribed to Supabase realtime on both `orders` and `order_history`.

- **History is append-only**: The `anon` role has `SELECT` only (so the browser can subscribe to the timeline). All writes go through the backend using the `service_role` key, bypassing RLS. A database trigger (`order_history_immutable`) enforces immutability against `UPDATE`.

Schema changes live in `backend/db/schema.sql` and must be applied manually in the
Supabase SQL editor — there is no migration runner in this project.

## Testing

The project uses `pytest` for automated testing of backend services, schema validators, and business logic without requiring a live database or network.

Run tests:
```bash
cd backend
python -m pytest -q
```
Test files are located in `backend/tests/`. We mock dependencies like the Supabase client and the LLM service to keep the suite fast and independent.

---

## Docs map

| File | What's in it |
|---|---|
| `docs/deliverables.md` | Round 2 feature, setup steps, demo script, limitations |
| `docs/PS.md` | Problem statement, personas, KPIs, MVP success criteria |
| `docs/Architecture.md` | System architecture, API tables, sequence diagrams |
| `docs/Frontend_Design_Doc.md` | Design tokens, 11 screen specs, component specs |
| `docs/implementation_plan.md` | Phase-by-phase build plan with code snippets |
| `docs/SA_Implementation.md` | Overlaps Architecture.md; adds demo script + risks |
| `docs/improve.md` | Whisper service improvement log (all items done) |

`Architecture.md` and `SA_Implementation.md` contain overlapping and partly duplicated
drafts. Where they disagree with the code, **the code is the source of truth** — these are
hackathon planning documents, not maintained specs.
