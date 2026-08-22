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
