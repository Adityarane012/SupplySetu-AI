from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime, timedelta, date
from db.supabase_client import supabase

router = APIRouter()


@router.get("/summary")
def get_summary(target_date: Optional[str] = Query(None)):
    """KPI summary for a specific date (defaults to today)."""
    d = target_date or str(date.today())

    orders = (
        supabase.table("orders")
        .select("*, order_items(*)")
        .eq("scheduled_date", d)
        .execute()
        .data
    ) or []

    total = len(orders)
    pending = sum(1 for o in orders if o["status"] == "pending")
    in_transit = sum(1 for o in orders if o["status"] == "in_transit")
    delivered = sum(1 for o in orders if o["status"] == "delivered")

    # Top products by quantity
    product_totals: dict[str, float] = {}
    for order in orders:
        for item in order.get("order_items") or []:
            p = item["product_name"]
            product_totals[p] = product_totals.get(p, 0) + float(item["quantity"])

    top_products = sorted(product_totals.items(), key=lambda x: -x[1])[:5]

    return {
        "date": d,
        "total_orders": total,
        "pending": pending,
        "in_transit": in_transit,
        "delivered": delivered,
        "completion_rate": round(delivered / total * 100, 1) if total else 0,
        "top_products": [{"name": p, "quantity": q} for p, q in top_products],
    }


@router.get("/forecast")
def get_forecast():
    """Simple 7-day rolling average demand forecast per product."""
    seven_days_ago = str((datetime.today() - timedelta(days=7)).date())

    items = (
        supabase.table("order_items")
        .select("product_name, quantity, orders!inner(scheduled_date)")
        .gte("orders.scheduled_date", seven_days_ago)
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
    rows = []
    for i in range(6, -1, -1):
        d = str((datetime.today() - timedelta(days=i)).date())
        result = (
            supabase.table("orders")
            .select("id", count="exact")
            .eq("scheduled_date", d)
            .execute()
        )
        rows.append({"date": d, "count": result.count or 0})
    return rows
