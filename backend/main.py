from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import orders, customers, route, transcribe, simulator, analytics

app = FastAPI(title="SupplySetu AI API", version="1.0")

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


@app.get("/health")
def health():
    return {"status": "ok", "service": "SupplySetu AI"}
