# SupplySetu AI

*Turning chaotic WhatsApp voice notes into AI-optimized delivery logistics.*

**SupplySetu AI** is an autonomous, WhatsApp-native logistics assistant designed specifically for informal and semi-formal vendors in India. It bridges the gap between unstructured voice orders—the reality of the Indian wholesale market—and organized, cost-efficient delivery operations.

Built for the **FarAway Hackathon**.

---

## 🏆 Note for Hackathon Judges

This project is built prioritizing privacy and zero operational costs by running **entirely locally** using open-weight models (`Ollama` + `Llama3.2` and `faster-whisper`). 

However, we understand you have limited time and downloading large model weights is not ideal for judging. We have built in a **Fast Cloud Toggle** specifically for you to evaluate the pipeline instantly.

**To test the app instantly (No downloads required):**
1. In the `backend/.env` file, set `USE_LOCAL_MODEL=false`.
2. Add a `GROQ_API_KEY` (we have provided a temporary one in our Devpost submission, or you can use your own).
3. The app will seamlessly switch to lightning-fast cloud APIs for both Speech-to-Text and LLM extraction!

---

## The Problem & Our Solution

In emerging markets, commerce runs on WhatsApp. Wholesalers and vendors receive hundreds of voice notes a day: *"Kal subah 20 kilo tamatar aur 15 kilo pyaz bhejna."* Processing these manually leads to missed orders, inefficient routing, and chaotic operations.

SupplySetu AI completely automates this. A vendor drops a voice note, and our system seamlessly transcribes the audio, extracts structured JSON data using a local LLM, plans the optimal delivery route using the Traveling Salesperson Problem (TSP) algorithm, and displays everything on a real-time command center.

## Key Features

- **Multi-lingual Voice Order Extraction**: Using `faster-whisper` and local LLMs (`Ollama` + `Llama3`), the system perfectly transcribes and extracts structured order data from natural, multi-lingual audio.
- **AI Route Optimization**: We solve the Traveling Salesperson Problem using Google's **OR-Tools**. The AI calculates the absolute most efficient delivery route across all pending orders and maps it out visually.
- **Twilio WhatsApp Integration**: A built-in webhook automatically processes incoming WhatsApp text messages and voice notes via the Twilio Sandbox.
- **Real-time Observability**: A Next.js frontend connected to a Supabase backend provides a live dashboard, a high-density order manager, and real-time status tracking.
- **₹0 Operational Cost Architecture**: The core AI stack runs entirely locally using open-weights models. There are zero variable API costs—a critical requirement for low-margin logistics businesses.

---

## Technical Architecture

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind v4 + Custom Stitch Design Tokens
- **Maps & Data**: React-Leaflet for routing, Recharts for analytics

### Backend & AI Pipeline
- **API**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL + Realtime)
- **Speech-to-Text**: `faster-whisper`
- **LLM Extraction**: `Ollama`
- **Routing Engine**: `ortools` (Google OR-Tools) & `geopy`
- **Messaging**: `twilio` SDK

---

## Getting Started

### Prerequisites
1. **Node.js** (v18+)
2. **Python** (3.10+)
3. **Ollama** installed locally (e.g., run `ollama pull llama3`)
4. **Supabase** account (Free tier is sufficient)
5. **Twilio** account (Sandbox for WhatsApp)
6. **FFmpeg** installed and added to PATH (required for Whisper)

### 1. Database Setup
Ensure you have created the `customers`, `orders`, and `order_items` tables in your Supabase SQL Editor (see `backend/scripts/schema.sql`). Then run the seeding script to populate mock data:
```bash
cd backend
python scripts/seed_db.py
```

### 2. Backend Setup
Navigate to the `backend` directory and start the FastAPI server:
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # On Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
fastapi dev main.py
```

### 3. Frontend Setup
Navigate to the `frontend` directory and start Next.js:
```bash
cd frontend
npm install
npm run dev
```

### 4. Environment Configuration
Create a `.env` file in the `backend/` directory:
```env
# Judging Toggle (Set to false and provide Groq key for instant testing)
USE_LOCAL_MODEL=true
GROQ_API_KEY=

# Local Models (if USE_LOCAL_MODEL=true)
OLLAMA_BASE_URL=http://localhost:11434

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-secret-key>

# Twilio Sandbox
TWILIO_ACCOUNT_SID=<your-twilio-sid>
TWILIO_AUTH_TOKEN=<your-twilio-auth-token>
```
And a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 5. WhatsApp Webhook (Optional)
To test sending live WhatsApp voice notes:
1. Run `ngrok http 8000` to expose your local FastAPI backend.
2. In your Twilio Sandbox settings, set the **"When a message comes in"** Webhook URL to:  
   `https://<your-ngrok>.ngrok.app/api/whatsapp/webhook`

---

## Try the Simulator!

Don't have a Twilio WhatsApp sandbox setup? We've got you covered.
Navigate to `http://localhost:3000/simulator` to test the complete end-to-end flow. You can use your browser's microphone to send a voice note directly into our AI pipeline, and watch the delivery routes and dashboard update in real-time. 

## License
Open-sourced under the MIT License.
