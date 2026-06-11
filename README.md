# SupplySetu AI 🚚🇮🇳

**SupplySetu AI** is an autonomous, WhatsApp-native logistics assistant designed specifically for informal and semi-formal vendors in India. It bridges the gap between chaotic, unstructured voice orders (the reality of the Indian wholesale market) and organized, optimized delivery operations.

Built for the **FarAway Hackathon**.

## ✨ Features

- **🗣️ Multi-lingual Voice Order Extraction**: Vendors can simply send a WhatsApp voice note (e.g. *"Kal subah 20 kilo tamatar aur 15 kilo pyaz bhejna"*). SupplySetu AI uses `faster-whisper` and local LLMs (`Ollama` + `Llama3`) to perfectly transcribe and extract structured order JSON.
- **🗺️ AI Route Optimization**: Solves the Traveling Salesperson Problem (TSP) using Google's **OR-Tools**. The AI calculates the most efficient delivery route across all pending orders and maps it out using **Leaflet**.
- **📊 Real-time Dashboard**: A Next.js frontend connected to a **Supabase** backend. Features a real-time command center, a kanban-style order manager, and deep analytics powered by **Recharts** (including rolling 7-day demand forecasting).
- **💸 ₹0 Operational Cost Architecture**: The core AI stack runs locally using open-weights models (Ollama/Whisper), meaning there are zero variable API costs—perfect for low-margin logistics businesses.

---

## 🏗️ Architecture Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Custom Design Tokens (Dark Mode supported)
- **Maps**: React-Leaflet
- **Charts**: Recharts

### Backend
- **Framework**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL + Realtime)
- **AI / Extraction Pipeline**:
  - Speech-to-Text: `faster-whisper`
  - LLM extraction: `Ollama` 
- **Routing Engine**: `ortools` (Google OR-Tools) & `geopy`

---

## 🚀 Getting Started

### Prerequisites
1. **Node.js** (v18+)
2. **Python** (3.10+)
3. **Ollama** installed locally (with a model pulled, e.g. `ollama pull llama3`)
4. **Supabase** account (Create a free project and run the schema in `docs/Architecture.md`)
5. **FFmpeg** installed and added to PATH (required for Whisper)

### 1. Backend Setup (FastAPI)
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows: .\venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup (Next.js)
```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 3. Environment Variables
You'll need a `.env` file in the `backend/` directory:
```env
OLLAMA_BASE_URL=http://localhost:11434
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-secret-key>
```
And a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

---

## 📱 Try the Simulator
Don't have a Twilio sandbox setup? No problem! 
Navigate to `http://localhost:3000/simulator` to test the complete end-to-end flow. You can use the browser's microphone to send a voice note directly into the AI pipeline, and watch the routes and dashboard update in real-time.

---

## 📄 License
This project is open-sourced under the MIT License.
