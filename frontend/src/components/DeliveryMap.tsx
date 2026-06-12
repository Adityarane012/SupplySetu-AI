"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";

// Fix for default Leaflet icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapBoundsFitter({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coordinates, map]);
  return null;
}

export default function DeliveryMap() {
  const [route, setRoute] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    async function fetchRoute() {
      try {
        const ordersRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders?status=pending`);
        const ordersData = await ordersRes.json();
        let orderIds = ordersData.map((o: any) => o.id);
        
        if (orderIds.length === 0) {
          setRoute([]);
          setLoading(false);
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/route/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_ids: orderIds,
            depot: { lat: 19.0178, lng: 72.8478, name: "Dadar Market Depot" }
          })
        });
        const data = await response.json();
        if (data.route) {
          setRoute(data.route);
        }
      } catch (err) {
        console.error("Error fetching route:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRoute();
  }, []);

  const routeCoordinates = route.map(stop => [stop.lat, stop.lng] as [number, number]);

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>AI Optimized Route (OR-Tools)</h1>
        <Link href="/dashboard" style={{ padding: "8px 16px", backgroundColor: "#2563eb", color: "white", borderRadius: "6px", textDecoration: "none", fontWeight: "500" }}>
          &larr; Back to Dashboard
        </Link>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "600px", backgroundColor: "#f3f4f6", borderRadius: "10px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
          <div style={{ fontSize: "18px", color: "#4b5563", fontWeight: "500" }}>Calculating AI Optimized Route... 🚚</div>
        </div>
      ) : (
        <MapContainer
          center={[19.0178, 72.8478]}
          zoom={13}
          style={{ height: "600px", width: "100%", borderRadius: "10px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {route.map((stop, i) => (
            <Marker key={i} position={[stop.lat, stop.lng]}>
              <Popup>
                <strong>{stop.label || stop.customer_name}</strong><br/>
                {stop.type === "depot" ? "Start / End Depot" : `Order Address: ${stop.address}`}
              </Popup>
            </Marker>
          ))}
          {routeCoordinates.length > 0 && (
            <>
              <Polyline positions={routeCoordinates} color="#2563eb" weight={5} opacity={0.7} />
              <MapBoundsFitter coordinates={routeCoordinates} />
            </>
          )}
        </MapContainer>
      )}
    </div>
  );
}
