from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime, timedelta, date
from db.supabase_client import supabase

router = APIRouter()


@router.get("/summary")
def get_summary():
    """KPI summary across all orders (all-time)."""
    orders = (
        supabase.table("orders")
        .select("*, order_items(*)")
        .execute()
        .data
    ) or []

    total = len(orders)
    pending = sum(1 for o in orders if o["status"] == "pending")
    in_transit = sum(1 for o in orders if o["status"] == "in_transit")
    delivered = sum(1 for o in orders if o["status"] == "delivered")

    # Top products by quantity (all-time)
    product_totals: dict[str, float] = {}
    product_units: dict[str, str] = {}
    for order in orders:
        for item in order.get("order_items") or []:
            p = item["product_name"]
            product_totals[p] = product_totals.get(p, 0) + float(item["quantity"])
            if p not in product_units:
                product_units[p] = item.get("unit", "kg")

    top_products = sorted(product_totals.items(), key=lambda x: -x[1])[:5]

    return {
        "total_orders": total,
        "pending": pending,
        "in_transit": in_transit,
        "delivered": delivered,
        "completion_rate": round(delivered / total * 100, 1) if total else 0,
        "top_products": [{"name": p, "quantity": q, "unit": product_units.get(p, "kg")} for p, q in top_products],
    }


@router.get("/forecast")
def get_forecast():
    """Simple 7-day rolling average demand forecast per product."""
    seven_days_ago = str((datetime.today() - timedelta(days=7)).date())

    # Fetch orders from the last 7 days first, then get their items
    recent_orders = (
        supabase.table("orders")
        .select("id")
        .gte("scheduled_date", seven_days_ago)
        .execute()
        .data
    ) or []

    if not recent_orders:
        return {"forecast_daily_avg": {}, "based_on_days": 7}

    order_ids = [o["id"] for o in recent_orders]

    # Fetch items for those orders (simple query, no join issues)
    items = (
        supabase.table("order_items")
        .select("product_name, quantity")
        .in_("order_id", order_ids)
        .execute()
        .data
    ) or []

    totals: dict[str, float] = {}
    for item in items:
        p = item["product_name"]
        totals[p] = totals.get(p, 0) + float(item["quantity"])

    forecast = {p: round(q / 7, 1) for p, q in totals.items()}
    sorted_forecast = dict(sorted(forecast.items(), key=lambda x: -x[1])[:10])

    return {"forecast_daily_avg": sorted_forecast, "based_on_days": 7}



@router.get("/weekly")
def get_weekly_stats():
    """Daily order counts for the last 7 days for charts."""
    seven_days_ago = str((datetime.today() - timedelta(days=6)).date())
    
    # Do 1 single query for the last 7 days
    result = (
        supabase.table("orders")
        .select("id, scheduled_date")
        .gte("scheduled_date", seven_days_ago)
        .execute()
    )
    
    orders = result.data or []
    
    # Aggregate counts by date
    counts_by_date = {}
    for o in orders:
        d = o.get("scheduled_date")
        if d:
            counts_by_date[d] = counts_by_date.get(d, 0) + 1
            
    rows = []
    for i in range(6, -1, -1):
        d = str((datetime.today() - timedelta(days=i)).date())
        rows.append({"date": d, "count": counts_by_date.get(d, 0)})
        
    return rows
