"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

export default function DeliveryMap({ route }: { route: any[] }) {
  const routeCoordinates = route.map(stop => [stop.lat, stop.lng] as [number, number]);

  return (
    <MapContainer
      center={[19.0178, 72.8478]}
      zoom={13}
      style={{ height: "100%", width: "100%", zIndex: 1 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {route.map((stop, i) => (
        <Marker key={i} position={[stop.lat, stop.lng]}>
          <Popup>
            <strong>{stop.label || stop.customer_name}</strong><br/>
            {stop.type === "depot" ? "Start / End Depot" : `Order Address: ${stop.address || "N/A"}`}
          </Popup>
        </Marker>
      ))}
      {routeCoordinates.length > 0 && (
        <>
          <Polyline positions={routeCoordinates} color="#006d34" weight={4} dashArray="8, 8" />
          <MapBoundsFitter coordinates={routeCoordinates} />
        </>
      )}
    </MapContainer>
  );
}
