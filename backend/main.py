from dotenv import load_dotenv
load_dotenv()  # Loads variables from .env

from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import orders, customers, route, transcribe, simulator, analytics, whatsapp
from services.whisper_service import preload_model

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Fire off model pre-load in a background thread so it doesn't block startup
    asyncio.create_task(asyncio.to_thread(preload_model))
    yield
    # No explicit shutdown tasks required right now

app = FastAPI(title="SupplySetu AI API", version="1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
