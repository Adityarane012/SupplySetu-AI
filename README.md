# 🏆 SupplySetu AI - Winner of the FarAway Hackathon! 🎉

*Turning chaotic WhatsApp voice notes into AI-optimized delivery logistics.*

**SupplySetu AI** is an autonomous, WhatsApp-native logistics assistant designed specifically for informal and semi-formal vendors in India. It bridges the gap between unstructured voice orders—the reality of the Indian wholesale market—and organized, cost-efficient delivery operations.

We are incredibly proud to have built this for the **FarAway Hackathon** and to have taken home the win! 🚀

---

## 🌟 The Problem & Our Winning Solution

In emerging markets, commerce runs on WhatsApp. Wholesalers and vendors receive hundreds of voice notes a day: *"Kal subah 20 kilo tamatar aur 15 kilo pyaz bhejna."* Processing these manually leads to missed orders, inefficient routing, and chaotic operations.

SupplySetu AI completely automates this. A vendor drops a voice note, and our system seamlessly transcribes the audio, extracts structured JSON data using a local LLM, plans the optimal delivery route using the Traveling Salesperson Problem (TSP) algorithm, and displays everything on a real-time command center. We've even built a meticulous, append-only history trail to capture the intent behind every change!

## 🚀 Key Features

- **Multi-lingual Voice Order Extraction**: Using `faster-whisper` and local LLMs (`Ollama` + `Llama3`), the system perfectly transcribes and extracts structured order data from natural, multi-lingual audio.
- **AI Route Optimization**: We solve the Traveling Salesperson Problem using Google's **OR-Tools**. The AI calculates the absolute most efficient delivery route across all pending orders and maps it out visually.
- **Twilio WhatsApp Integration**: A built-in webhook automatically processes incoming WhatsApp text messages and voice notes via the Twilio Sandbox.
- **Real-time Observability & Audit Trail**: A Next.js frontend connected to a Supabase backend provides a live dashboard, a high-density order manager, and an append-only, secure history timeline showing field-level changes.
- **₹0 Operational Cost Architecture**: The core AI stack runs entirely locally using open-weights models. There are zero variable API costs—a critical requirement for low-margin logistics businesses.

---

## 💻 Technical Architecture

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind v4 + Custom Stitch Design Tokens
- **Maps & Data**: React-Leaflet for routing, Recharts for analytics

### Backend & AI Pipeline
- **API**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL + Realtime + Strict RLS)
- **Speech-to-Text**: `faster-whisper`
- **LLM Extraction**: `Ollama` (or Groq for instant cloud speed)
- **Routing Engine**: `ortools` (Google OR-Tools) & `geopy`
- **Messaging**: `twilio` SDK

---

## 🛠️ Ultimate Localhost Setup Guide (How to run our winning code)

We built this to be robust and run locally with ₹0 operational cost. Follow these detailed steps to get the full SupplySetu AI experience running on your machine.

### Prerequisites (The Essentials)
1. **Node.js** (v18+) - For the frontend.
2. **Python** (3.10+) - For the backend.
3. **Ollama** installed locally (e.g., run `ollama pull llama3.2`) - For local LLM extraction.
4. **Supabase** account (Free tier is sufficient) - For DB and Realtime.
5. **Twilio** account (Sandbox for WhatsApp) - For the WhatsApp integration.
6. **FFmpeg** installed and added to your system's PATH - Required for Whisper speech-to-text.

### 1. Database Setup (Supabase)
1. Go to your Supabase project's SQL Editor.
2. Run the schema creation script located at `backend/db/schema.sql` to create the tables (`customers`, `orders`, `order_items`, `order_history`).
3. Next, apply the Row Level Security (RLS) policies and triggers by running `backend/db/rls.sql` in the SQL Editor. (This secures the append-only history trail!).
4. To populate the database with mock data, run our seeder script:
   ```bash
   cd backend
   python scripts/seed_db.py
   # Or use `--force` if the database is not completely empty
   ```

### 2. Backend Setup (FastAPI + AI Pipeline)
Open a terminal and set up the Python environment:
```bash
cd backend
python -m venv venv

# Activate the virtual environment
# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install the required dependencies
pip install -r requirements.txt

# Start the development server
fastapi dev main.py
```
*The backend will now be running on `http://localhost:8000`.*

### 3. Frontend Setup (Next.js 14)
Open a new terminal window and set up the Next.js app:
```bash
cd frontend
npm install
npm run dev
```
*The frontend will now be running on `http://localhost:3000`.*

### 4. Environment Configuration
Create a `.env` file in the `backend/` directory based on the `.env.example`:
```env
# Judging Toggle (Set to false and provide Groq key for instant testing without local models)
USE_LOCAL_MODEL=true
GROQ_API_KEY=

# Local Models (if USE_LOCAL_MODEL=true)
OLLAMA_BASE_URL=http://localhost:11434

# Supabase (Get these from Project Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-secret-service-key>

# Twilio Sandbox (Get these from the Twilio Console)
TWILIO_ACCOUNT_SID=<your-twilio-sid>
TWILIO_AUTH_TOKEN=<your-twilio-auth-token>
TWILIO_VALIDATE_SIGNATURE=false # Set to true in production
```

Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 5. WhatsApp Webhook (Optional but Recommended)
To test sending live WhatsApp voice notes:
1. Run `ngrok http 8000` to expose your local FastAPI backend to the internet.
2. Go to your Twilio Sandbox settings.
3. Set the **"When a message comes in"** Webhook URL to:  
   `https://<your-ngrok>.ngrok.app/api/whatsapp/webhook`

---

## 🎮 Try the Simulator!

Don't have a Twilio WhatsApp sandbox setup? We've got you covered.
Navigate to `http://localhost:3000/simulator` to test the complete end-to-end flow. You can use your browser's microphone to send a voice note directly into our AI pipeline, and watch the delivery routes, dashboards, and detailed history timeline update in real-time. 

## License
Open-sourced under the MIT License.
