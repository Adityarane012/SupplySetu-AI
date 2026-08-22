<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# SupplySetu AI — frontend

Next.js 16 (App Router) + React 19 + Tailwind. See the root `AGENTS.md` for the full
project guide, the graphify knowledge graph, and backend conventions.

## Routes

Real React pages: `/` (redirects to dashboard), `/dashboard`, `/orders`, `/orders/[id]`,
`/orders/new`, `/route-map`, `/analytics`, `/simulator`.

`/orders/[id]` is the order detail page — it renders the Intent Capture change-history
timeline and is the primary Round 2 demo surface.

## Gotchas

**Type errors are suppressed.** `next.config.ts` sets `typescript.ignoreBuildErrors: true`,
so `next build` skips type validation — a green build proves nothing about types. Run
`npx tsc --noEmit` to check them. Next 16 removed the `eslint` config key and no longer
lints during `next build`; run `npm run lint` separately.

**Rewrites vs. pages.** `next.config.ts` rewrites map some paths to static Stitch mockups
in `public/screens/`. Array-form rewrites apply *after* the filesystem check, so any path
with a real page file wins — the rewrites for `/`, `/orders/new` and `/analytics` are
therefore dead. Live ones: `/login`, `/orders/detail`, `/customers`, `/customers/profile`,
`/settings`.

**Leaflet is client-only** — it touches `window` on import. Always go through
`components/MapWrapper.tsx`, which dynamically imports `DeliveryMap` with `ssr: false`.

**Data comes from two places.** REST calls to `NEXT_PUBLIC_BACKEND_URL` (FastAPI) for
reads and writes, plus Supabase realtime subscriptions for live refresh. Pages that show
changing data subscribe to the `orders` table; `/orders/[id]` also subscribes to
`order_history`.

**Env:** `frontend/.env.local` (gitignored) — `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_BACKEND_URL`.
