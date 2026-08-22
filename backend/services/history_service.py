"""
Intent capture / change-history service.

Every meaningful change to an order (creation, status change, notes edit)
is written to `order_history` alongside the *intent* behind it — the
customer's or vendor's underlying goal/purpose/reason — so the full
lifecycle of "what changed and why" can be inspected later.
"""

from typing import Optional
from db.supabase_client import supabase


def log_history(
    order_id: str,
    change_type: str,
    summary: str,
    intent: Optional[str] = None,
    source: str = "system",
    actor: Optional[str] = None,
    before: Optional[dict] = None,
    after: Optional[dict] = None,
) -> None:
    """Record one change-history entry. Never raises — history is best-effort
    and must not break the primary order flow if logging fails."""
    try:
        supabase.table("order_history").insert({
            "order_id": order_id,
            "change_type": change_type,
            "summary": summary,
            "intent": intent,
            "source": source,
            "actor": actor,
            "before_data": before,
            "after_data": after,
        }).execute()
    except Exception as e:
        print(f"[History] Failed to log '{change_type}' for order {order_id}: {e}")


def default_creation_intent(items: list) -> str:
    """Fallback intent when the LLM didn't provide one (or for manual orders)."""
    if not items:
        return "Order placed."
    names = ", ".join(
        i.get("product_name", "item") if isinstance(i, dict) else getattr(i, "product_name", "item")
        for i in items[:3]
    )
    return f"Order placed for {names}."


def default_status_intent(new_status: str) -> str:
    """Fallback intent when no reason was supplied for a status change."""
    return {
        "in_transit": "Order picked up and heading out for delivery.",
        "delivered": "Delivery completed successfully.",
        "cancelled": "Order cancelled.",
        "pending": "Order reset to pending.",
    }.get(new_status, f"Status changed to {new_status}.")


def log_order_created(
    order_id: str,
    items: list,
    intent: Optional[str],
    source: str,
    actor: Optional[str] = None,
) -> None:
    """Convenience wrapper used by every order-creation entry point
    (manual dashboard, WhatsApp webhook, simulator)."""
    item_count = len(items)
    summary = f"Order created with {item_count} item{'s' if item_count != 1 else ''}"
    log_history(
        order_id=order_id,
        change_type="created",
        summary=summary,
        intent=intent or default_creation_intent(items),
        source=source,
        actor=actor,
        after={"items": items},
    )

from datetime import datetime, timedelta

def find_amendable_order(customer_phone: str) -> Optional[dict]:
    """
    Returns the most recent order for that phone with status in ('pending','in_transit')
    created within the last 24 hours, else None.
    """
    customer_resp = supabase.table("customers").select("id").eq("phone", customer_phone).limit(1).execute()
    if not customer_resp.data:
        return None
    customer_id = customer_resp.data[0]["id"]
    
    cutoff = (datetime.utcnow() - timedelta(hours=24)).isoformat()
    
    orders_resp = (
        supabase.table("orders")
        .select("*, order_items(*)")
        .eq("customer_id", customer_id)
        .in_("status", ["pending", "in_transit"])
        .gte("created_at", cutoff)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if orders_resp.data:
        return orders_resp.data[0]
    return None

def apply_amendment(order: dict, extracted: dict) -> dict:
    """
    Merge extracted["items"] into the order's existing order_items:
      - same product_name (case-insensitive) -> UPDATE quantity/unit
      - new product_name -> INSERT
    Returns {"before": [...], "after": [...], "summary": str}
    """
    existing_items = order.get("order_items", [])
    new_items_extracted = extracted.get("items", [])
    
    existing_lookup = {item["product_name"].lower(): item for item in existing_items}
    
    before = [{"product_name": item["product_name"], "quantity": item["quantity"], "unit": item["unit"]} for item in existing_items]
    
    order_id = order["id"]
    summary_parts = []
    
    for new_item in new_items_extracted:
        name = new_item.get("product_name", "Unknown")
        name_lower = name.lower()
        quantity = max(float(new_item.get("quantity", 1)), 0.01)
        unit = new_item.get("unit", "kg")
        
        if name_lower in existing_lookup:
            item_id = existing_lookup[name_lower]["id"]
            old_quantity = existing_lookup[name_lower]["quantity"]
            old_unit = existing_lookup[name_lower]["unit"]
            
            if float(old_quantity) != float(quantity) or old_unit != unit:
                supabase.table("order_items").update({
                    "quantity": quantity,
                    "unit": unit
                }).eq("id", item_id).execute()
                summary_parts.append(f"{name}: {old_quantity}{old_unit} → {quantity}{unit}")
            
            existing_lookup[name_lower]["quantity"] = quantity
            existing_lookup[name_lower]["unit"] = unit
        else:
            inserted = supabase.table("order_items").insert({
                "order_id": order_id,
                "product_name": name,
                "quantity": quantity,
                "unit": unit
            }).execute()
            if inserted.data:
                existing_lookup[name_lower] = inserted.data[0]
                summary_parts.append(f"added {name} {quantity}{unit}")

    after = [{"product_name": item["product_name"], "quantity": item["quantity"], "unit": item["unit"]} for item in existing_lookup.values()]
    summary = "; ".join(summary_parts) if summary_parts else "No items changed"
    
    return {"before": before, "after": after, "summary": summary}
