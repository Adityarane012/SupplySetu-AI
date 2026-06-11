from pydantic import BaseModel
from typing import List, Optional
from datetime import date
import uuid


class OrderItem(BaseModel):
    product_name: str
    quantity: float
    unit: str = "kg"


class OrderCreate(BaseModel):
    customer_id: Optional[uuid.UUID] = None
    customer_name: str
    items: List[OrderItem]
    scheduled_date: Optional[date] = None
    source: str = "manual"
    notes: Optional[str] = None


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class CustomerCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    notes: Optional[str] = None


class RouteRequest(BaseModel):
    order_ids: List[str]
    depot: dict  # {lat: float, lng: float}


class TranscribeResponse(BaseModel):
    transcript: str
    language: str
    duration_seconds: float


class ExtractResponse(BaseModel):
    customer: str
    items: List[OrderItem]
    delivery_date: Optional[str] = None
    confidence: float = 0.9


class SimulatorMessageRequest(BaseModel):
    customer_name: str
    customer_phone: str
    body: str = ""
