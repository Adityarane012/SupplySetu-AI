from pydantic import BaseModel, field_validator, model_validator
from typing import List, Optional, Literal
from datetime import date
import uuid


VALID_STATUSES = {"pending", "in_transit", "delivered", "cancelled"}
VALID_UNITS = {"kg", "gram", "piece", "dozen", "litre", "bundle", "box", "bag"}


class OrderItem(BaseModel):
    product_name: str
    quantity: float
    unit: str = "kg"

    @field_validator("quantity")
    @classmethod
    def quantity_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("quantity must be greater than 0")
        return round(v, 3)

    @field_validator("product_name")
    @classmethod
    def product_name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("product_name cannot be empty")
        return v.title()  # normalise capitalisation

    @field_validator("unit")
    @classmethod
    def unit_must_be_valid(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in VALID_UNITS:
            return "kg"  # safe default instead of rejecting
        return v


class OrderCreate(BaseModel):
    customer_id: Optional[uuid.UUID] = None
    customer_name: str
    items: List[OrderItem]
    scheduled_date: Optional[date] = None
    source: str = "manual"
    notes: Optional[str] = None

    @field_validator("customer_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("customer_name cannot be empty")
        return v

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, v: List[OrderItem]) -> List[OrderItem]:
        if not v:
            raise ValueError("order must have at least one item")
        return v


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("status")
    @classmethod
    def status_must_be_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_STATUSES:
            raise ValueError(f"status must be one of: {', '.join(sorted(VALID_STATUSES))}")
        return v


class CustomerCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    notes: Optional[str] = None

    @field_validator("lat")
    @classmethod
    def lat_in_range(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (-90 <= v <= 90):
            raise ValueError("lat must be between -90 and 90")
        return v

    @field_validator("lng")
    @classmethod
    def lng_in_range(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (-180 <= v <= 180):
            raise ValueError("lng must be between -180 and 180")
        return v


class RouteRequest(BaseModel):
    order_ids: List[str]
    depot: dict  # {lat: float, lng: float}

    @field_validator("order_ids")
    @classmethod
    def order_ids_not_empty(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("order_ids cannot be empty")
        return v


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
