from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from db.supabase_client import supabase
from models.schemas import OrderCreate, OrderUpdate
from datetime import date
from services.history_service import log_history, log_order_created, default_status_intent

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
    # .limit(1) rather than .single(): PostgREST's `single` returns a 406 for a
    # missing row, which surfaces as a 500 instead of the 404 we want.
    result = (
        supabase.table("orders")
        .select("*, order_items(*), customers(*)")
        .eq("id", order_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Order not found")
    return result.data[0]


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
    items_payload = []
    if body.items:
        items_payload = [
            {
                "order_id": order["id"],
                "product_name": item.product_name,
                "quantity": item.quantity,
                "unit": item.unit,
            }
            for item in body.items
        ]
        supabase.table("order_items").insert(items_payload).execute()

    log_order_created(
        order_id=order["id"],
        items=items_payload,
        intent=body.notes,  # manual entry has no LLM intent; use notes if the vendor gave any
        source="manual",
        actor="vendor",
    )

    return {"order_id": order["id"], "status": "created"}


@router.put("/{order_id}")
def update_order(order_id: str, body: OrderUpdate):
    existing = supabase.table("orders").select("*").eq("id", order_id).limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Order not found")
    old = existing.data[0]

    update_data = body.model_dump(exclude={"reason"}, exclude_none=True)
    if not update_data:
        raise HTTPException(400, "No fields to update")

    result = supabase.table("orders").update(update_data).eq("id", order_id).execute()

    if "status" in update_data and update_data["status"] != old.get("status"):
        log_history(
            order_id=order_id,
            change_type="status_changed",
            summary=f"Status changed from '{old.get('status')}' to '{update_data['status']}'",
            intent=body.reason or default_status_intent(update_data["status"]),
            source="manual",
            actor="vendor",
            before={"status": old.get("status")},
            after={"status": update_data["status"]},
        )

    if "notes" in update_data and update_data["notes"] != old.get("notes"):
        log_history(
            order_id=order_id,
            change_type="notes_changed",
            summary="Order notes updated",
            intent=body.reason,
            source="manual",
            actor="vendor",
            before={"notes": old.get("notes")},
            after={"notes": update_data["notes"]},
        )

    return {"updated": True, "data": result.data}


@router.get("/{order_id}/history")
def get_order_history(order_id: str):
    result = (
        supabase.table("order_history")
        .select("*")
        .eq("order_id", order_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.delete("/{order_id}")
def delete_order(order_id: str):
    supabase.table("orders").delete().eq("id", order_id).execute()
    return {"deleted": True}
