from fastapi import APIRouter, HTTPException
import asyncio
from db.supabase_client import supabase
from models.schemas import RouteRequest
from services.geocoder import build_distance_matrix, geocode_address
from services.route_optimizer import solve_tsp

router = APIRouter()

# Default depot: Dadar Market, Mumbai
DEFAULT_DEPOT = {"lat": 19.0178, "lng": 72.8478, "name": "Your Depot (Dadar Market)"}


@router.post("/")
async def compute_route(req: RouteRequest):
    depot = req.depot or DEFAULT_DEPOT
    locations = [depot]  # index 0 = depot
    order_meta = []
    skipped = []
    addr_cache = {}

    for oid in req.order_ids:
        # .limit(1) rather than .single(): `single` raises on a missing row, which
        # would abort the whole route computation instead of skipping one bad ID.
        order_resp = (
            supabase.table("orders")
            .select("id, customer_name, customer_id, customers(lat, lng, name, address)")
            .eq("id", oid)
            .is_("deleted_at", "null")
            .limit(1)
            .execute()
        )
        if not order_resp.data:
            skipped.append({"order_id": oid, "reason": "Order not found"})
            continue

        data = order_resp.data[0]
        customer = data.get("customers") or {}
        lat = customer.get("lat")
        lng = customer.get("lng")
        address = customer.get("address", "")
        customer_id = data.get("customer_id")

        if lat is None or lng is None:
            if not address:
                skipped.append({"order_id": oid, "reason": "No address or coordinates"})
                continue
            
            if address in addr_cache:
                lat, lng = addr_cache[address]
            else:
                loc = await asyncio.to_thread(geocode_address, address)
                await asyncio.sleep(1.1)  # rate limit 1 req/sec
                if loc:
                    lat, lng = loc["lat"], loc["lng"]
                    addr_cache[address] = (lat, lng)
                    if customer_id:
                        supabase.table("customers").update({"lat": lat, "lng": lng}).eq("id", customer_id).execute()
                else:
                    skipped.append({"order_id": oid, "reason": f"Geocoding failed for address: {address}"})
                    continue

        locations.append({"lat": lat, "lng": lng})
        order_meta.append({
            "order_id": oid,
            "customer_name": data["customer_name"],
            "address": address,
            "lat": lat,
            "lng": lng,
        })

    if len(locations) < 2:
        raise HTTPException(400, "Need at least 1 order with valid coordinates to compute route")

    matrix = build_distance_matrix(locations)
    result = solve_tsp(matrix)

    route_stops = []
    for idx in result["route_indices"]:
        if idx == 0:
            route_stops.append({"type": "depot", "label": depot.get("name", "Depot"), **depot})
        else:
            stop = order_meta[idx - 1]
            route_stops.append({"type": "stop", **stop})

    distance_km = result["total_distance_m"] / 1000
    est_minutes = int(distance_km / 25 * 60)  # 25 km/h avg city speed
    fuel_cost = round(distance_km * 8, 0)  # ~₹8/km for a two-wheeler

    return {
        "route": route_stops,
        "distance_km": round(distance_km, 2),
        "est_minutes": est_minutes,
        "total_stops": len(order_meta),
        "fuel_cost_inr": fuel_cost,
        "skipped": skipped,
    }
