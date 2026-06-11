from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from db.supabase_client import supabase
from models.schemas import OrderCreate, OrderUpdate
from datetime import date

router = APIRouter()


@router.get("/")
def list_orders(
    status: Optional[str] = Query(None),
    scheduled_date: Optional[str] = Query(None),
    limit: int = Query(50),
):
    query = supabase.table("orders").select("*, order_items(*)")

    if status:
        query = query.eq("status", status)
    if scheduled_date:
        query = query.eq("scheduled_date", scheduled_date)

    result = query.order("created_at", desc=True).limit(limit).execute()
    return result.data


@router.get("/{order_id}")
def get_order(order_id: str):
    result = supabase.table("orders").select("*, order_items(*), customers(*)").eq("id", order_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Order not found")
    return result.data


@router.post("/")
def create_order(body: OrderCreate):
    # Insert order
    order_data = {
        "customer_name": body.customer_name,
        "status": "pending",
        "source": body.source,
        "scheduled_date": str(body.scheduled_date or date.today()),
        "notes": body.notes,
    }
    if body.customer_id:
        order_data["customer_id"] = str(body.customer_id)

    order = supabase.table("orders").insert(order_data).execute().data[0]

    # Insert items
    if body.items:
        items = [
            {
                "order_id": order["id"],
                "product_name": item.product_name,
                "quantity": item.quantity,
                "unit": item.unit,
            }
            for item in body.items
        ]
        supabase.table("order_items").insert(items).execute()

    return {"order_id": order["id"], "status": "created"}


@router.put("/{order_id}")
def update_order(order_id: str, body: OrderUpdate):
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(400, "No fields to update")
    result = supabase.table("orders").update(update_data).eq("id", order_id).execute()
    return {"updated": True, "data": result.data}


@router.delete("/{order_id}")
def delete_order(order_id: str):
    supabase.table("orders").delete().eq("id", order_id).execute()
    return {"deleted": True}
