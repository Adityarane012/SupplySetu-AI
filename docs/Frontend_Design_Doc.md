# SupplySetu AI — Frontend Design Document
> **Product:** SupplySetu AI · **Stack:** Next.js (React) · **Target:** Stitch UI Generation
> **Version:** 1.0 · **Date:** June 2026

---

## 1. Product Vision & Design Philosophy

SupplySetu AI is a **WhatsApp-native autonomous logistics assistant** built for India's informal supply-chain vendors — vegetable vendors, dairy distributors, flower suppliers, and kirana operators. The frontend must:

- Feel **instantly familiar** to semi-literate, Hindi/Marathi-speaking operators on a mobile browser
- Be **data-dense but calm** — show critical information without overwhelming
- Work beautifully on **mobile-first**, gracefully on desktop (vendor dashboard)
- Reflect a brand that is **trustworthy, warm, and Indian** — not sterile SaaS

### Brand Personality
> *"A smart assistant that speaks the vendor's language."*

Think of it as the intersection of Google Maps' clarity, Zepto's energy, and a WhatsApp green warmth. The UI should feel like a smart friend helping a small business owner — not like enterprise software.

---

## 2. Design Tokens & Brand System

### 2.1 Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#1A6B3C` | Primary actions, nav active, CTA buttons |
| `--color-primary-light` | `#22A355` | Hover states, success indicators |
| `--color-primary-subtle` | `#E8F5EE` | Card backgrounds, highlights |
| `--color-accent` | `#F5A623` | Warnings, pending badges, attention |
| `--color-accent-dark` | `#D4891A` | Accent hover, icon tints |
| `--color-danger` | `#E53E3E` | Errors, cancelled orders |
| `--color-danger-light` | `#FEF2F2` | Error backgrounds |
| `--color-surface` | `#FFFFFF` | Cards, modals |
| `--color-bg` | `#F4F6F8` | App background |
| `--color-bg-dark` | `#0F1923` | Sidebar, dark nav |
| `--color-text-primary` | `#1A202C` | Headings, primary text |
| `--color-text-secondary` | `#4A5568` | Labels, sublabels |
| `--color-text-muted` | `#A0AEC0` | Placeholders, inactive |
| `--color-border` | `#E2E8F0` | Dividers, input borders |
| `--color-delivered` | `#22A355` | Delivered status |
| `--color-pending` | `#F5A623` | Pending status |
| `--color-transit` | `#3182CE` | In-transit status |

### 2.2 Typography

**Primary Font:** `Noto Sans` (Google Fonts) — supports Devanagari for Hindi/Marathi
**Secondary Font:** `Inter` — for numbers, data tables, stats
**Monospace:** `JetBrains Mono` — for JSON output, transcription preview

| Scale | Size | Weight | Usage |
|---|---|---|---|
| `--text-xs` | 11px | 400 | Timestamps, badges |
| `--text-sm` | 13px | 400 | Labels, table cells |
| `--text-base` | 15px | 400 | Body text |
| `--text-md` | 17px | 500 | Subheadings |
| `--text-lg` | 20px | 600 | Section titles |
| `--text-xl` | 24px | 700 | Page headings |
| `--text-2xl` | 30px | 800 | Hero stats, KPI numbers |
| `--text-3xl` | 40px | 900 | Landing headline |

### 2.3 Spacing & Layout

- **Border Radius:** `--radius-sm: 6px`, `--radius-md: 12px`, `--radius-lg: 20px`, `--radius-pill: 999px`
- **Shadows:** `--shadow-sm: 0 1px 3px rgba(0,0,0,0.08)`, `--shadow-md: 0 4px 16px rgba(0,0,0,0.1)`, `--shadow-lg: 0 8px 32px rgba(0,0,0,0.14)`
- **Grid:** 12-column fluid grid, `--container-max: 1280px`, gutter `24px`
- **Sidebar width (desktop):** `240px` (collapsed: `64px`)

### 2.4 Iconography

Use **Lucide React** icons throughout. Key icons to use:
- `Mic` — voice input
- `Package` — orders
- `MapPin` — delivery location
- `Route` — route optimization
- `BarChart3` — analytics
- `Users` — customers
- `CheckCircle2` — delivered
- `Clock` — pending
- `Truck` — in transit
- `Zap` — AI processing
- `PhoneCall` — WhatsApp channel

---

## 3. Application Structure & Pages

### 3.1 Page Map

```
/                    → Landing Page (public)
/login               → Vendor Login / OTP
/dashboard           → Main Dashboard (KPIs + Today's Summary)
/orders              → Orders List View
/orders/[id]         → Order Detail
/orders/new          → New Order (manual + voice upload)
/customers           → Customer Directory
/customers/[id]      → Customer Profile
/route               → Route Optimization + Map View
/analytics           → Analytics & Forecasting
/settings            → WhatsApp, profile, integrations
```

### 3.2 Navigation Structure

**Desktop:** Persistent left sidebar (240px) with icon + label nav links.
**Mobile:** Bottom tab bar with 5 primary tabs + overflow drawer.

**Primary Nav Items:**
1. 🏠 Dashboard
2. 📦 Orders
3. 🗺️ Route Map
4. 👥 Customers
5. 📊 Analytics
6. ⚙️ Settings (secondary)

---

## 4. Screen-by-Screen Design Specifications

---

### Screen 1: Landing Page (`/`)

**Purpose:** Convert vendor visitors into sign-ups. Explain the product in simple, relatable terms. Hindi/Marathi headline supported.

#### Layout
- **Full-screen hero** with gradient background (`#0F1923` → `#1A6B3C`)
- **Navbar:** Logo (left) + "Login" + "Get Started" CTA (right), glass-morphic on scroll
- **Hero Section:**
  - Badge chip: `🤖 AI-Powered Logistics`
  - Headline (large, bold, white): `"आपके Orders, अब Smart तरीके से"` *(Your Orders, Now the Smart Way)*
  - Sub-headline (english): `WhatsApp voice orders → Auto-transcribed → Route optimized. Zero app install.`
  - Two CTAs: `[Get Started for Free]` (primary green) + `[Watch Demo]` (ghost)
  - Hero illustration: Animated SVG of a vendor's phone showing WhatsApp → dashboard flow
- **How It Works (3 steps):**
  - Step 1: Customer sends voice note on WhatsApp → `Mic icon`
  - Step 2: AI transcribes + extracts order → `Zap icon`
  - Step 3: Route optimized on map → `Route icon`
- **Stats Bar:** `100K+ Vendors Served · 3M+ Orders Processed · 40% Route Savings`
- **Testimonial Card:** Vendor photo (avatar), Hindi quote, name + city
- **Footer:** Logo, links, copyright

#### Visual Style
- Dark hero with floating glowing card previews of the dashboard
- Particle or wave animation in hero background
- Scroll-triggered fade-in animations for each section

---

### Screen 2: Login / OTP (`/login`)

**Purpose:** Simple phone-based login for vendors. No email/password complexity.

#### Layout
- Centered card (max-width 420px) on subtle gradient bg
- Logo at top
- **Phone number input** with `+91` flag prefix selector
- `[Send OTP]` primary button (full-width)
- OTP 6-digit input boxes (after send)
- `[Verify & Login]` button
- "New here? Watch how it works" link below
- Language toggle: `EN | हिंदी | मराठी`

#### Visual Style
- Clean white card with `--shadow-lg`
- Green accent border on active inputs
- Animated check on OTP success

---

### Screen 3: Main Dashboard (`/dashboard`)

**Purpose:** Give the vendor an at-a-glance view of today's business. This is the most critical screen.

#### Layout — Desktop (3-column)

**Top Header Bar:**
- `Good morning, Ramesh 🌅` — personalized greeting
- Date: `Tuesday, 11 June 2026`
- Quick actions: `[+ New Order]` `[🔔 3 alerts]` `[Profile avatar]`

**Row 1 — KPI Stat Cards (4 across):**
Each card has: icon (colored), metric label, large number, delta vs yesterday.

| Card | Icon | Metric | Color |
|---|---|---|---|
| Today's Orders | `Package` | `28` | Green |
| Pending Deliveries | `Clock` | `12` | Amber |
| Delivered Today | `CheckCircle2` | `16` | Green |
| Revenue (Est.) | `₹` | `₹14,200` | Blue |

**Row 2 — Left Panel (60%) + Right Panel (40%):**

**Left: Today's Order List (condensed)**
- Scrollable list of today's orders
- Each row: Customer name, items summary, quantity, status badge, `[View]` action
- Filter tabs: `All | Pending | In Transit | Delivered`
- Empty state: illustrated card with "No orders yet. Upload a voice note!"

**Right: Recent Voice Transcription Panel**
- Latest transcription result with waveform animation
- JSON extraction preview (monospace, syntax-highlighted)
- Status steps: `Received → Transcribed → Extracted → Saved ✓`
- `[Upload Voice Note]` trigger button

**Row 3 — Route Summary Card (full width)**
- Mini-map thumbnail (Leaflet static render) showing today's optimized route
- Route stats: `12 stops · 34.2 km · Est. 2h 45m`
- `[Open Full Map]` button → routes to `/route`
- "Route not yet generated" empty state with `[Generate Route]` CTA

#### Layout — Mobile

- **Top:** Greeting + date + notification bell
- **Scrollable cards:** KPI cards as horizontal scroll strip
- **Pending orders list:** Full-width cards with swipe-to-deliver gesture
- **Voice upload FAB:** Floating action button (green, mic icon) bottom-right corner, pulsing animation
- **Bottom nav:** 5 tab icons

#### Visual Style
- Light mode default, dark mode available
- KPI cards: white with colored icon accent + subtle left border
- Status badges: pill-shaped with color + icon
- Smooth skeleton loaders while data fetches

---

### Screen 4: Orders List (`/orders`)

**Purpose:** Full management of all orders — browse, filter, search, create.

#### Layout
- **Header:** `Orders` title + `[+ New Order]` button (right)
- **Filter Bar:** Date picker | Status dropdown | Customer search | `[Export CSV]`
- **Order Table (desktop):**

| # | Customer | Items Summary | Qty | Date | Status | Actions |
|---|---|---|---|---|---|---|
| #101 | ABC Stores | Tomato, Onion | 35 kg | Jun 11 | 🟡 Pending | View · Mark Delivered |
| #102 | Sharma Kirana | Potato, Garlic | 20 kg | Jun 11 | 🔵 In Transit | View · Track |
| #103 | Hotel Sai | Tomato | 50 kg | Jun 10 | 🟢 Delivered | View |

- **Order Cards (mobile):** Each order as a card with status color strip on left edge
- **Pagination / Infinite scroll** at bottom
- **Bulk actions:** Checkbox select → `[Mark as Delivered]` `[Delete]`

#### Empty State
- Illustrated vegetable vendor graphic
- Text: "No orders yet. Start by uploading a voice note or adding manually."
- `[+ Add First Order]` button

---

### Screen 5: New Order (`/orders/new`)

**Purpose:** Two modes — Voice Upload (primary) and Manual Form (secondary).

#### Layout
- **Mode Toggle:** `[🎤 Voice Upload]` ← default · `[✏️ Manual Entry]`

**Voice Upload Mode:**
- Large drag-and-drop zone: `Drop your WhatsApp voice note here (.ogg, .mp3, .wav)`
- Animated waveform illustration in drop zone
- Or: `[Click to Browse Files]` button
- Progress stepper below upload:
  1. `Upload` → 2. `Transcribing...` → 3. `Extracting Order` → 4. `Review & Save`

**Transcription Preview Panel** (after step 2):
- Waveform player with playback controls
- Transcribed text in a card: `"Kal subah 20 kilo tamatar aur 15 kilo pyaz bhejna"`
- Language detected chip: `🇮🇳 Hindi / Hinglish`

**Extracted Order Preview Panel** (after step 3):
- Customer name field (auto-filled or dropdown)
- Items table (editable):
  | Product | Qty | Unit | Remove |
  |---|---|---|---|
  | Tomato | 20 | kg | ✕ |
  | Onion | 15 | kg | ✕ |
- `[+ Add Item]` row
- Delivery date picker
- Notes textarea
- `[Save Order]` primary button · `[Re-transcribe]` secondary

**Manual Entry Mode:**
- Customer dropdown (search-as-you-type) + `[+ New Customer]`
- Items section: dynamic rows with product name, qty, unit
- Delivery date picker
- Special instructions textarea
- `[Save Order]` CTA

---

### Screen 6: Order Detail (`/orders/[id]`)

**Purpose:** Full detail of a single order with timeline and actions.

#### Layout
- **Breadcrumb:** `Orders > Order #101`
- **Header:** Customer name (large), order ID, date badge
- **Status Timeline:**
  `Order Received → Voice Transcribed → Extracted → Assigned → In Transit → Delivered`
  Visual horizontal progress bar with timestamps at each step

- **Two-column body:**

  **Left (60%):**
  - Items table: Product | Qty | Unit | Price (if applicable)
  - Total weight, estimated value
  - Notes field
  - Order Source chip: `WhatsApp Voice` / `Manual`
  - Raw transcription (collapsible): monospace text in muted card

  **Right (40%):**
  - Customer info card: name, phone (click-to-call), address with map pin
  - Mini inline map: single marker at delivery location
  - Delivery stop #: `Stop 3 of 12` in today's route
  - `[Mark as Delivered]` large primary button
  - `[Call Customer]` outline button
  - `[Edit Order]` text link

- **Activity Log** (bottom): timestamped changelog of status updates

---

### Screen 7: Route Map (`/route`)

**Purpose:** Show today's optimized delivery route on an interactive map. The most visual screen.

#### Layout — Split View

**Left Panel (35%) — Stops List:**
- Header: `Today's Route · 12 Stops · 34.2 km`
- `[Generate / Re-optimize Route]` button (green, with loading spinner + `Zap` icon)
- Route stats row: `🕐 Est. 2h 45m · ⛽ ~₹280 fuel · 📍 12 stops`
- Ordered list of stops:
  ```
  🏠 START — Your Depot (Dadar Market)
  1. ABC Stores — 15 kg Tomato, 10 kg Onion    [Pending] [✓ Delivered]
  2. Sharma Kirana — 20 kg Potato               [In Transit]
  3. Hotel Sai Ram — 50 kg Tomato               [Pending]
  ...
  🏠 RETURN — Depot
  ```
- Each stop card: expandable on click to show full order details
- Status chips on each stop
- `[Mark Delivered]` button per stop
- Drag to reorder stops (manual override)

**Right Panel (65%) — Interactive Leaflet Map:**
- Full-height map with OpenStreetMap tiles
- **Markers:**
  - 🏠 Depot: Dark green house marker
  - 🛵 Numbered stop markers (1, 2, 3...) — color coded by status
    - 🟡 Pending = amber
    - 🔵 In Transit = blue
    - 🟢 Delivered = green
- **Route Polyline:** Dashed green line connecting stops in order
- **Popup on marker click:** Customer name, items, quantity, `[Mark Delivered]` button
- **Map Controls:** Zoom in/out, "Fit all markers" button, toggle satellite/street view
- **Live Driver Position** (optional): pulsing blue dot

**Mobile Layout:**
- Full-screen map, stops list as a bottom sheet drawer
- Drawer handle to slide up/down
- Current stop highlighted at top of list

---

### Screen 8: Customer Directory (`/customers`)

**Purpose:** Manage all vendor's customers — view, add, profile.

#### Layout
- **Header:** `Customers (42)` + `[+ Add Customer]`
- **Search bar:** real-time filter by name or phone
- **Customer Grid (desktop):** 3-column cards
- **Customer List (mobile):** single-column cards

**Customer Card:**
- Avatar (initials-based, colored circle)
- Name (bold) + Phone
- Address (truncated)
- Stats: `Last Order: Jun 10` · `Total Orders: 28` · `Lifetime Value: ₹42,000`
- Tags: `Regular · Tomato · High Volume`
- `[View Profile]` CTA

---

### Screen 9: Customer Profile (`/customers/[id]`)

**Purpose:** Full profile with order history and location.

#### Layout
- **Header:** Avatar + Name + Phone + `[Call]` `[WhatsApp]` action buttons
- **Address card** with embedded mini-map and lat/lng coordinates
- **Stats Row:** Total Orders | Total Items | Total Value | Avg Order Size
- **Order History Table:** Paginated list of all past orders
- **Preferred Items** (derived): Tag cloud of most-ordered products
- **Notes field** (editable): vendor's private notes about customer

---

### Screen 10: Analytics (`/analytics`)

**Purpose:** Business insights for the vendor — demand trends, top customers, product velocity.

#### Layout
- **Date Range Selector:** Last 7 days / 30 days / Custom
- **Row 1 — KPI Summary Cards:** (same as dashboard but historical)
- **Row 2 — Charts (2 across):**

  **Chart A: Daily Order Volume (Bar Chart)**
  - X-axis: Days of week / dates
  - Y-axis: Number of orders
  - Color: Green bars with amber overlay for pending

  **Chart B: Top Products by Volume (Horizontal Bar)**
  - Products listed (Tomato, Onion, Potato...)
  - Bar width = quantity delivered

- **Row 3 — Charts (2 across):**

  **Chart C: Revenue Trend (Line Chart)**
  - Smooth line, green fill below

  **Chart D: Top Customers (Ranked List)**
  - Rank | Customer | Total Orders | Total Value

- **Row 4 — Demand Forecast Card (stretch feature)**
  - "Tomorrow's predicted demand:" with product-wise estimates
  - Based on 7-day rolling average
  - `🔮 AI Forecast` badge

**Chart Library:** Use `Recharts` (Next.js compatible, clean design)

---

### Screen 11: Settings (`/settings`)

**Purpose:** Configure vendor profile, WhatsApp integration, and preferences.

#### Layout (tabbed)
- **Tab 1: Profile** — Business name, owner name, phone, depot address (map picker), upload logo
- **Tab 2: WhatsApp Integration** — Twilio sandbox QR code display, status indicator (Connected / Disconnected), test message button
- **Tab 3: Preferences** — Language (EN / हिंदी / मराठी), notification preferences, dark mode toggle
- **Tab 4: Team** (future) — Add driver accounts

---

## 5. Reusable Components Specification

### 5.1 `<StatusBadge>`
```
Props: status = "pending" | "in_transit" | "delivered" | "cancelled"
Variants:
  pending     → amber background, clock icon, "Pending"
  in_transit  → blue background, truck icon, "In Transit"
  delivered   → green background, checkmark icon, "Delivered"
  cancelled   → red background, X icon, "Cancelled"
Shape: pill (border-radius: 999px), padding: 4px 12px, text: 12px semibold
```

### 5.2 `<OrderCard>` (Mobile)
```
Layout: Left color strip (status color) | Content (name, items, qty) | Right (badge + action)
Interaction: Tap to expand, long-press for quick actions, swipe-right = mark delivered
```

### 5.3 `<VoiceUploadZone>`
```
States:
  idle      → dashed border, mic icon, upload text
  dragging  → solid green border, animated icon
  uploading → progress bar, "Uploading..."
  processing → animated waveform + "Transcribing with AI..."
  done      → green checkmark, transcription preview appears
```

### 5.4 `<TranscriptionCard>`
```
Shows: Audio player + waveform | Transcribed text | Language tag | Edit transcript option
Style: Monospace font for transcript, subtle code-block feel
```

### 5.5 `<RouteStopCard>`
```
Props: stop_number, customer_name, items, status, is_current
States:
  upcoming → grey number, white card
  current  → blue number, highlighted card with pulsing border
  done     → green number, strikethrough items, muted
```

### 5.6 `<KPICard>`
```
Props: icon, label, value, delta (+ or -), trend ("up" | "down" | "neutral")
Layout: Icon (top-left, colored) | Label | Large number | Delta chip
Size: min-width 180px, responsive in grid
```

### 5.7 `<MapMarker>` (Leaflet custom)
```
Depot:    Dark green house icon
Pending:  Numbered amber circle with drop shadow
Transit:  Numbered blue circle, pulsing ring animation
Delivered: Numbered green circle with checkmark
```

---

## 6. Interaction & Animation Patterns

### 6.1 Micro-interactions
- **Button press:** Scale 0.97 on click, spring back
- **Card hover:** Translate Y -2px, shadow deepen
- **Status badge:** Subtle pulse for "pending" status
- **Map marker:** Bounce animation on new marker add
- **Voice upload:** Waveform animates on upload; spinner transitions to checkmark

### 6.2 Loading States
- **Skeleton screens** (not spinners) for all data-dependent content
- **Transcription:** Typing cursor blink while text streams in
- **Route calculation:** Map shows loading polyline (dashed grey) → transitions to green on solve

### 6.3 Transitions
- **Page transitions:** Fade-in (200ms) on route change
- **Modal/drawer:** Slide-up from bottom (mobile), fade+scale (desktop)
- **Sidebar:** Smooth collapse/expand with icon label fade

### 6.4 Toast Notifications
- Position: Top-right (desktop), top-center (mobile)
- Types: `success (green)`, `error (red)`, `info (blue)`, `warning (amber)`
- Duration: 4 seconds, dismiss on click
- Examples:
  - ✅ `"Order #101 saved successfully"`
  - 🎤 `"Transcription complete — 3 items extracted"`
  - 🗺️ `"Route optimized — 12 stops, 34.2 km"`
  - ❌ `"Upload failed — please try again"`

---

## 7. Responsive Breakpoints

| Breakpoint | Min-width | Layout |
|---|---|---|
| Mobile | 0px | Single column, bottom nav, FAB |
| Tablet | 768px | 2-column cards, side drawer nav |
| Desktop | 1024px | Full sidebar, multi-column layout |
| Wide | 1440px | Max container, extra whitespace |

---

## 8. Accessibility (a11y) Requirements

- All interactive elements must have `aria-label`
- Color is never the only indicator of status (always paired with icon + text)
- Font size minimum 14px for all readable content
- `prefers-color-scheme` respected for dark mode
- All images have `alt` text
- Keyboard navigation supported for all actions
- Focus ring visible (green outline, 2px)

---

## 9. Key User Flows (Stitch Screen Sequences)

### Flow A: Voice Order Capture
```
Screen 1: Dashboard → Click "Upload Voice Note" FAB
Screen 2: New Order - Voice Mode (drag & drop zone)
Screen 3: Uploading → Transcribing animation
Screen 4: Review extracted order (editable table)
Screen 5: Success toast → Returns to Dashboard with new order in list
```

### Flow B: Route Optimization & Delivery
```
Screen 1: Dashboard → Click "Open Full Map" on route card
Screen 2: Route Map (list + map, no route yet)
Screen 3: Click "Generate Route" → Loading state
Screen 4: Route Map (polyline drawn, all stops numbered)
Screen 5: Driver taps stop → Popup with "Mark Delivered"
Screen 6: Stop turns green, counter updates, toast shows
```

### Flow C: New Customer + Manual Order
```
Screen 1: Orders → "+ New Order" → Manual Mode
Screen 2: Customer dropdown → "+ New Customer" → Customer modal
Screen 3: Fill name, phone, address → Save customer
Screen 4: Back to order form, customer pre-filled
Screen 5: Add items, date, save → Order detail screen
```

---

## 10. Screen Priority for Stitch Generation

Generate screens in this priority order:

| Priority | Screen | Route | Notes |
|---|---|---|---|
| 🔴 P0 | Dashboard | `/dashboard` | Most-used, must be perfect |
| 🔴 P0 | Route Map | `/route` | Core value prop visualization |
| 🔴 P0 | New Order - Voice | `/orders/new` | Primary input flow |
| 🟠 P1 | Orders List | `/orders` | Data management |
| 🟠 P1 | Order Detail | `/orders/[id]` | Status + delivery action |
| 🟠 P1 | Landing Page | `/` | Demo / investor impression |
| 🟡 P2 | Customer Directory | `/customers` | Secondary workflow |
| 🟡 P2 | Customer Profile | `/customers/[id]` | Detailed view |
| 🟡 P2 | Analytics | `/analytics` | Business insights |
| 🟢 P3 | Login / OTP | `/login` | Simple, auth |
| 🟢 P3 | Settings | `/settings` | Configuration |

---

## 11. Dark Mode Specification

The app should support a dark mode toggle:

| Token | Light | Dark |
|---|---|---|
| `--color-bg` | `#F4F6F8` | `#0D1117` |
| `--color-surface` | `#FFFFFF` | `#161B22` |
| `--color-border` | `#E2E8F0` | `#30363D` |
| `--color-text-primary` | `#1A202C` | `#E6EDF3` |
| `--color-text-secondary` | `#4A5568` | `#8B949E` |
| Sidebar bg | `#0F1923` | `#010409` |

Dark mode is toggled via Settings or system preference. Map tiles switch to dark Carto tiles in dark mode.

---

## 12. Tech Integration Notes for Frontend

| Feature | Frontend Tech | Backend API |
|---|---|---|
| Voice Upload | HTML5 File input / Drag-drop | `POST /transcribe` (multipart) |
| Transcription display | Server-Sent Events or polling | `GET /transcribe/{job_id}` |
| Order extraction preview | JSON render from API response | `POST /extract` |
| Map rendering | Leaflet + React-Leaflet | `GET /route` · `GET /customers` |
| Route polyline | Leaflet Polyline from lat/lng array | `POST /route` returns ordered coords |
| Real-time status | Supabase real-time subscription | WebSocket on `orders` table |
| Auth | Supabase Auth (phone OTP) | Supabase GoTrue |
| Analytics charts | Recharts | `GET /analytics/summary` |

---

## 13. Sample Component Descriptions for Stitch Prompts

Use these descriptions verbatim when prompting Stitch for individual screens:

### Dashboard Prompt
> "A dark-sidebar web app dashboard for SupplySetu AI, an Indian logistics platform for vegetable vendors. Left sidebar (240px, dark green #0F1923) with nav items: Dashboard, Orders, Route Map, Customers, Analytics. Main content area has a top header with greeting 'Good morning, Ramesh 🌅' and date. Below: 4 KPI stat cards in a row (Today's Orders: 28, Pending: 12, Delivered: 16, Revenue: ₹14,200) with colored icons. Below that: left panel with a filterable order list with status badges (Pending=amber pill, Delivered=green pill, In Transit=blue pill), and right panel showing a voice transcription result with waveform and JSON preview. Bottom row: a full-width route summary card with a mini map thumbnail and '12 stops · 34.2 km' stats. Clean, modern, mobile-responsive. Color scheme: primary green #1A6B3C, accent amber #F5A623, neutral white cards on #F4F6F8 background."

### Route Map Prompt
> "A split-screen delivery route optimization page. Left panel (35% width): vertical list of delivery stops numbered 1–12. Each stop card shows customer name, items ordered, quantity, and a status badge. Stops have colored left border (amber=pending, green=delivered, blue=in transit). 'Generate Route' button at top with a lightning bolt icon. Route stats bar: 12 stops, 34.2 km, Est. 2h 45min. Right panel (65%): full-height interactive Leaflet map with OpenStreetMap tiles. Map shows numbered circular markers for each delivery stop, color-coded by status. A dashed green polyline connects all markers in sequence. A popup appears on marker click showing customer name and 'Mark Delivered' button. Dark mode map tiles available."

### New Order - Voice Upload Prompt
> "A new order creation page with two tabs at top: 'Voice Upload' (selected) and 'Manual Entry'. The voice upload tab shows a large dashed-border drop zone in the center with a microphone icon and text 'Drop your WhatsApp voice note here'. Below the drop zone, a 4-step progress indicator: Upload → Transcribing → Extracting → Review. After upload, a waveform audio player card appears with the transcribed Hindi text displayed in monospace font. Below that, an extracted order preview card showing an editable table with columns: Product, Quantity, Unit, Delete. Products auto-filled: Tomato 20 kg, Onion 15 kg. A 'Save Order' green button at bottom. Clean white background, green accents, modern Indian supply chain aesthetic."

---

*End of Frontend Design Document — SupplySetu AI v1.0*
