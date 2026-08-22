from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from db.supabase_client import supabase
from models.schemas import OrderCreate, OrderUpdate, OrderDelete
from datetime import date, datetime
from services.time_service import today_ist, now_ist
from services.history_service import log_history, log_order_created, default_status_intent
from services.outcome_service import evaluate_intent_outcome
from services.snapshot_service import reconstruct_snapshots

router = APIRouter()


@router.get("/")
def list_orders(
    status: Optional[str] = Query(None),
    scheduled_date: Optional[str] = Query(None),
    limit: int = Query(50),
):
    query = supabase.table("orders").select("*, order_items(*)").is_("deleted_at", "null")

    if status:
        query = query.eq("status", status)
    if scheduled_date:
        query = query.eq("scheduled_date", scheduled_date)

    result = query.order("created_at", desc=True).limit(limit).execute()
    return result.data


@router.get("/activity")
def get_activity(
    change_type: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    limit: int = Query(50),
):
    query = supabase.table("order_history").select("*, orders(customer_name, status)")

    if change_type:
        query = query.eq("change_type", change_type)
    if source:
        query = query.eq("source", source)

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
        .is_("deleted_at", "null")
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
        "scheduled_date": str(body.scheduled_date or today_ist()),
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
        intent=body.intent or body.notes,  # prefer LLM-inferred intent; fall back to vendor notes
        source="manual",
        actor="vendor",
    )

    return {"order_id": order["id"], "status": "created"}


@router.put("/{order_id}")
def update_order(order_id: str, body: OrderUpdate):
    existing = supabase.table("orders").select("*").eq("id", order_id).is_("deleted_at", "null").limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Order not found")
    old = existing.data[0]

    update_data = body.model_dump(exclude={"reason", "outcome_reason", "items"}, exclude_unset=True)
    if not update_data and body.items is None:
        raise HTTPException(400, "No fields to update")

    # Evaluate intent outcome if marked delivered
    if "status" in update_data and update_data["status"] == "delivered" and old.get("status") != "delivered":
        scheduled_date_str = old.get("scheduled_date")
        scheduled_date = date.fromisoformat(scheduled_date_str) if scheduled_date_str else None
        delivered_at = now_ist()
        
        outcome = evaluate_intent_outcome(scheduled_date, delivered_at)
        
        if outcome == "missed" and not body.outcome_reason:
            raise HTTPException(400, "Missed intent outcome requires a reason.")
            
        update_data["delivered_at"] = delivered_at.isoformat()
        update_data["intent_outcome"] = outcome
        if body.outcome_reason:
            update_data["intent_outcome_reason"] = body.outcome_reason.strip()

    if update_data:
        result = supabase.table("orders").update(update_data).eq("id", order_id).execute()

    if body.items is not None:
        old_items_result = supabase.table("order_items").select("*").eq("order_id", order_id).execute()
        old_items = old_items_result.data or []
        
        # Format for DB insertion (dropping id and created_at if they exist)
        new_items = []
        for it in body.items:
            new_items.append({
                "order_id": order_id,
                "product_name": it.product_name,
                "quantity": it.quantity,
                "unit": it.unit,
            })
            
        # Delete old and insert new
        supabase.table("order_items").delete().eq("order_id", order_id).execute()
        if new_items:
            supabase.table("order_items").insert(new_items).execute()
            
        log_history(
            order_id=order_id,
            change_type="items_changed",
            summary="Order items updated",
            intent=body.reason,
            source="manual",
            actor="vendor",
            before=old_items,
            after=new_items,
        )

    if "status" in update_data and update_data["status"] != old.get("status"):
        after_data = {"status": update_data["status"]}
        if update_data["status"] == "delivered":
            after_data["delivered_at"] = update_data["delivered_at"]
            after_data["intent_outcome"] = update_data["intent_outcome"]
            if "intent_outcome_reason" in update_data:
                after_data["intent_outcome_reason"] = update_data["intent_outcome_reason"]

        log_history(
            order_id=order_id,
            change_type="status_changed",
            summary=f"Status changed from '{old.get('status')}' to '{update_data['status']}'",
            intent=body.reason or default_status_intent(update_data["status"]),
            source="manual",
            actor="vendor",
            before={"status": old.get("status")},
            after=after_data,
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
        .limit(100)
        .execute()
    )
    return result.data


@router.get("/{order_id}/snapshots")
def get_order_snapshots(order_id: str):
    # Fetch history in ascending order to reconstruct forward
    result = (
        supabase.table("order_history")
        .select("*")
        .eq("order_id", order_id)
        .order("created_at", desc=False)
        .limit(1000)
        .execute()
    )
    return reconstruct_snapshots(result.data or [])


@router.delete("/{order_id}")
def delete_order(order_id: str, body: OrderDelete):
    existing = supabase.table("orders").select("*").eq("id", order_id).is_("deleted_at", "null").limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Order not found or already deleted")
    
    old_status = existing.data[0].get("status")
    now_ts = datetime.utcnow().isoformat()
    
    log_history(
        order_id=order_id,
        change_type="deleted",
        summary="Order deleted",
        intent=body.reason,
        source="manual",
        actor="vendor",
        before={"status": old_status},
        after={"deleted_at": now_ts},
    )
    
    supabase.table("orders").update({"deleted_at": now_ts}).eq("id", order_id).execute()
    return {"deleted": True, "deleted_at": now_ts}
