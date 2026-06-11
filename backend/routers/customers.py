from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from db.supabase_client import supabase
from models.schemas import CustomerCreate

router = APIRouter()


@router.get("/")
def list_customers(search: Optional[str] = Query(None), limit: int = Query(100)):
    query = supabase.table("customers").select("*")
    if search:
        query = query.ilike("name", f"%{search}%")
    result = query.order("name").limit(limit).execute()
    return result.data


@router.get("/{customer_id}")
def get_customer(customer_id: str):
    result = supabase.table("customers").select("*, orders(*, order_items(*))").eq("id", customer_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Customer not found")
    return result.data


@router.post("/")
def create_customer(body: CustomerCreate):
    result = supabase.table("customers").insert(body.model_dump(exclude_none=True)).execute()
    return result.data[0]


@router.put("/{customer_id}")
def update_customer(customer_id: str, body: CustomerCreate):
    result = supabase.table("customers").update(body.model_dump(exclude_none=True)).eq("id", customer_id).execute()
    return result.data[0]
