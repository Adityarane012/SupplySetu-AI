from dotenv import load_dotenv
load_dotenv()  # Loads variables from .env

from contextlib import asynccontextmanager
import asyncio
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import orders, customers, route, transcribe, simulator, analytics, whatsapp
from services.whisper_service import preload_model

from scripts.seed_db import seed

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed demo data only when the database is still empty. seed() is
    # destructive, and the API restarts often on free-tier hosting — seeding
    # unconditionally would wipe real orders and their change history on every
    # cold start. Set SEED_ON_STARTUP=false to disable this entirely.
    if os.getenv("SEED_ON_STARTUP", "true").lower() == "true":
        asyncio.create_task(asyncio.to_thread(seed))

    # Fire off model pre-load in a background thread so it doesn't block startup
    asyncio.create_task(asyncio.to_thread(preload_model))
    yield
    # No explicit shutdown tasks required right now

app = FastAPI(title="SupplySetu AI API", version="1.0", lifespan=lifespan)

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(orders.router,     prefix="/api/orders",     tags=["Orders"])
app.include_router(customers.router,  prefix="/api/customers",  tags=["Customers"])
app.include_router(route.router,      prefix="/api/route",      tags=["Route"])
app.include_router(transcribe.router, prefix="/api/transcribe", tags=["Transcribe"])
app.include_router(simulator.router,  prefix="/api/simulator",  tags=["Simulator"])
app.include_router(analytics.router,  prefix="/api/analytics",  tags=["Analytics"])
app.include_router(whatsapp.router,   prefix="/api/whatsapp",   tags=["WhatsApp"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "SupplySetu AI"}
