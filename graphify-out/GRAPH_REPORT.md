# Graph Report - FarAway Hackathon  (2026-06-13)

## Corpus Check
- 64 files · ~156,626 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 498 nodes · 483 edges · 57 communities (48 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f1853a9b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]

## God Nodes (most connected - your core abstractions)
1. `SupplySetu AI — Comprehensive Phase-wise Implementation Plan` - 17 edges
2. `compilerOptions` - 16 edges
3. `Architecture of *SupplySetu AI* – Autonomous Order-to-Delivery Agent` - 14 edges
4. `SupplySetu AI — Frontend Design Document` - 14 edges
5. `4. Screen-by-Screen Design Specifications` - 12 edges
6. `Implementation Plan` - 11 edges
7. `twilio_whatsapp_webhook()` - 9 edges
8. `transcribe_audio()` - 9 edges
9. `Component Descriptions` - 9 edges
10. `extract_order()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `run()` --calls--> `_groq_extract()`  [INFERRED]
  debug_llm.py → backend/services/llm_service.py
- `transcribe()` --calls--> `transcribe_audio()`  [INFERRED]
  backend/routers/transcribe.py → backend/services/whisper_service.py
- `receive_simulator_message()` --calls--> `transcribe_audio()`  [INFERRED]
  backend/routers/simulator.py → backend/services/whisper_service.py
- `receive_simulator_message()` --calls--> `extract_order()`  [INFERRED]
  backend/routers/simulator.py → backend/services/llm_service.py
- `extract()` --calls--> `extract_order()`  [INFERRED]
  backend/routers/transcribe.py → backend/services/llm_service.py

## Communities (57 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (40): 2.1 — Core Schema (run in Supabase SQL Editor), 2.2 — Seed Mock Data, 📅 3-Day Sprint Calendar, 4.1 — Whisper Transcription Service (`backend/services/whisper_service.py`), 4.2 — LLM Order Extraction (`backend/services/llm_service.py`), 4.3 — Transcribe Router (`backend/routers/transcribe.py`), 4.4 — Full Pipeline Test, 6.1 — WhatsApp Router (`backend/routers/whatsapp.py`) (+32 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (29): API Endpoints, Architecture, Architecture of *SupplySetu AI* – Autonomous Order-to-Delivery Agent, Backend (FastAPI), code:mermaid (flowchart LR), code:mermaid (sequenceDiagram), code:mermaid (sequenceDiagram), code:mermaid (flowchart LR) (+21 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (29): 4. Screen-by-Screen Design Specifications, code:block2 (🏠 START — Your Depot (Dadar Market)), Empty State, Layout, Layout, Layout, Layout, Layout (+21 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (27): dependencies, leaflet, lucide-react, next, react, react-dom, react-leaflet, recharts (+19 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (33): 10. Screen Priority for Stitch Generation, 11. Dark Mode Specification, 12. Tech Integration Notes for Frontend, 13. Sample Component Descriptions for Stitch Prompts, 1. Product Vision & Design Philosophy, 2.1 Color Palette, 2.2 Typography, 2.3 Spacing & Layout (+25 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 6 - "Community 6"
Cohesion: 0.13
Nodes (15): 5.1 `<StatusBadge>`, 5.2 `<OrderCard>` (Mobile), 5.3 `<VoiceUploadZone>`, 5.4 `<TranscriptionCard>`, 5.5 `<RouteStopCard>`, 5.6 `<KPICard>`, 5.7 `<MapMarker>` (Leaflet custom), 5. Reusable Components Specification (+7 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (15): 7.1 — Stitch HTML Integration Strategy, 7.2 — Supabase Client Setup, 7.3 — Dashboard Page with Live Data, 7.4 — Voice Upload Page with Pipeline, 7.5 — Route Map Page (Leaflet), 7.6 — Dark Mode Support, 7.7 — Google Fonts Setup, code:typescript (// frontend/src/lib/supabase.ts) (+7 more)

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (14): Assumptions, code:json ({), code:sql (INSERT INTO orders (id, customer_name, delivery_date, status), Constraints and Assumptions, Current Workflows, Example Scenario (Minimal Reproducible Example), Executive Summary, Key Performance Indicators (KPIs) (+6 more)

### Community 9 - "Community 9"
Cohesion: 0.14
Nodes (13): API Endpoints, code:mermaid (gantt), Data Models (Database Schema), Deliverables by Phase, Demo Script (3–5 minutes), Development & Deployment Workflow, Executive Summary, Implementation Plan (+5 more)

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (12): run(), extract(), transcribe(), _async_sleep(), extract_order(), _groq_extract(), _ollama_extract(), _parse_json_safe() (+4 more)

### Community 11 - "Community 11"
Cohesion: 0.17
Nodes (12): 1.1 — Monorepo Layout, 1.2 — Frontend Dependencies, 1.3 — Backend Setup, 1.4 — Copy Stitch Screens to Public, 1.5 — Environment Variables, code:bash (# Copy all Stitch HTMLs to Next.js public/screens), code:block11 (Animated_SVG.html                                → public/sc), code:env (# Supabase) (+4 more)

### Community 12 - "Community 12"
Cohesion: 0.15
Nodes (9): BaseModel, CustomerCreate, ExtractResponse, OrderCreate, OrderItem, OrderUpdate, RouteRequest, SimulatorMessageRequest (+1 more)

### Community 13 - "Community 13"
Cohesion: 0.20
Nodes (10): 0.1 — Complete Graph Generation, 0.2 — Install Graphify into Antigravity, 0.3 — Install into Gemini CLI (bonus), 0.4 — Verify Graph Quality, 0.5 — Watch Mode (ongoing), code:bash (graphify antigravity install), code:bash (graphify gemini install), code:bash (# Check the report) (+2 more)

### Community 14 - "Community 14"
Cohesion: 0.17
Nodes (15): _get_local_model(), get_model(), _groq_transcribe(), _local_transcribe(), preload_model(), Fallback: transcribe locally with faster-whisper., Transcribe audio file to text.     Strategy:       1. If GROQ_API_KEY is set → u, Preloads the local model into memory if local inference is enabled.     This pre (+7 more)

### Community 15 - "Community 15"
Cohesion: 0.16
Nodes (16): _build_reply(), get_chat_history(), Return recent orders for a customer phone number to show in chat., Get or create customer record, updating name if it changed., Return recent orders for a customer phone number., Parse and validate delivery_date from LLM output.     - Must be a valid ISO date, Build a natural, WhatsApp-style reply., receive_simulator_message() (+8 more)

### Community 16 - "Community 16"
Cohesion: 0.22
Nodes (5): compute_route(), build_distance_matrix(), locations = [{"lat": float, "lng": float}, ...]     Returns: N x N matrix of dis, Solves the Travelling Salesman Problem using OR-Tools.     Node 0 is always the, solve_tsp()

### Community 17 - "Community 17"
Cohesion: 0.25
Nodes (8): 3.1 — `backend/main.py`, 3.2 — All API Endpoints, 3.3 — Pydantic Schemas (`backend/models/schemas.py`), 3.4 — Supabase Client (`backend/db/supabase_client.py`), code:python (from fastapi import FastAPI), code:python (from pydantic import BaseModel), code:python (import os), Phase 3 — FastAPI Backend 🐍

### Community 18 - "Community 18"
Cohesion: 0.11
Nodes (18): 1. Backend Setup, 2. Frontend Setup, 3. Environment Configuration, Backend & AI Pipeline, code:bash (cd backend), code:bash (cd frontend), code:env (# Judging Toggle (Set to false and provide Groq key for inst), code:env (NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co) (+10 more)

### Community 19 - "Community 19"
Cohesion: 0.18
Nodes (10): get_forecast(), get_summary(), get_weekly_stats(), KPI summary across all orders (all-time)., Simple 7-day rolling average demand forecast per product., Simple 7-day rolling average demand forecast per product., Simple 7-day rolling average demand forecast per product., Daily order counts for the last 7 days for charts. (+2 more)

### Community 22 - "Community 22"
Cohesion: 0.40
Nodes (4): code:bash (npm run dev), Deploy on Vercel, Getting Started, Learn More

### Community 23 - "Community 23"
Cohesion: 0.29
Nodes (5): geistMono, geistSans, inter, metadata, notoSans

### Community 42 - "Community 42"
Cohesion: 0.67
Nodes (3): main(), SupplySetu AI — Type Tab Edge Case Test Suite ==================================, run_test()

### Community 43 - "Community 43"
Cohesion: 0.20
Nodes (10): 9.1 — Frontend Deployment (Vercel), 9.2 — Backend Deployment (Render), 9.3 — Supabase Production Migration, 9.4 — Twilio Production Webhook Update, 9.5 — Final Health Check, code:bash (cd frontend), code:yaml (services:), code:bash (# Use Supabase CLI) (+2 more)

### Community 44 - "Community 44"
Cohesion: 0.40
Nodes (4): CONTACTS, formatDuration(), Message, SimulatorPage()

### Community 51 - "Community 51"
Cohesion: 0.33
Nodes (3): EXAMPLE_ORDERS, InputMode, Step

### Community 54 - "Community 54"
Cohesion: 0.29
Nodes (7): 5.1 — Geocoding Service (`backend/services/geocoder.py`), 5.2 — OR-Tools Route Optimizer (`backend/services/route_optimizer.py`), 5.3 — Route Router (`backend/routers/route.py`), code:python (from geopy.geocoders import Nominatim), code:python (from ortools.constraint_solver import routing_enums_pb2, pyw), code:python (from fastapi import APIRouter), Phase 5 — Route Optimization Engine 🗺️

### Community 55 - "Community 55"
Cohesion: 0.33
Nodes (5): ✅ [COMPLETED] 1. Enable GPU Acceleration for `faster-whisper`, ✅ [COMPLETED] 2. Make Transcription Asynchronous (Non-Blocking), ✅ [COMPLETED] 3. Replace `print()` with Structured Logging and Metrics, ✅ [COMPLETED] 4. Application Startup Pre-loading, Whisper Service Improvements

## Knowledge Gaps
- **220 isolated node(s):** `BeforeTool`, `eslintConfig`, `nextConfig`, `name`, `version` (+215 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SupplySetu AI — Comprehensive Phase-wise Implementation Plan` connect `Community 0` to `Community 7`, `Community 11`, `Community 43`, `Community 13`, `Community 17`, `Community 54`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `SupplySetu AI — Frontend Design Document` connect `Community 4` to `Community 2`, `Community 6`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `4. Screen-by-Screen Design Specifications` connect `Community 2` to `Community 4`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `SupplySetu AI — Type Tab Edge Case Test Suite ==================================`, `BeforeTool`, `KPI summary across all orders (all-time).` to the rest of the system?**
  _251 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._