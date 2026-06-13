"use client";
import { useEffect, useState } from "react";
import MapWrapper from "@/components/MapWrapper";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function RouteMapPage() {
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [routeData, setRouteData] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const ordersRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/orders`);
        const ordersData = await ordersRes.json();
        const relevant = ordersData.filter((o: any) => o.status === 'pending' || o.status === 'in_transit');
        setPendingOrders(relevant);
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    }
    fetchOrders();

    // Setup realtime listener for orders
    const channel = supabase
      .channel("map-realtime-page")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          console.log("Realtime event received:", payload);
          fetchOrders(); // Refresh pending orders on change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleOptimize = async () => {
    if (pendingOrders.length === 0) {
      alert("No pending orders available to optimize!");
      return;
    }
    setIsOptimizing(true);
    try {
      const orderIds = pendingOrders.map((o: any) => o.id);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/route/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_ids: orderIds,
          depot: { lat: 19.0178, lng: 72.8478, name: "Dadar West Depot" }
        })
      });
      const data = await response.json();
      if (data.route) {
        setRouteData(data);
      } else {
        alert("Failed to compute optimized route.");
      }
    } catch (e) {
      console.error(e);
      alert("Error connecting to route optimization backend service.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const getHrsMins = (totalMins: number) => {
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md h-screen w-full overflow-hidden flex m-0 p-0">
      <nav className="fixed left-0 top-0 h-full flex flex-col py-6 w-[240px] bg-on-background shadow-md z-50">
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-primary text-[20px] icon-fill">local_shipping</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md font-bold text-on-primary">SupplySetu AI</span>
            <span className="font-data-label text-data-label text-surface-variant opacity-80">Logistics Intelligence</span>
          </div>
        </div>
        <div className="flex flex-col flex-grow gap-2">
          <Link href="/dashboard" className="flex items-center gap-3 w-full text-surface-variant pl-4 py-2 hover:bg-primary/20 hover:text-primary-fixed transition-colors">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-data-label text-data-label">Dashboard</span>
          </Link>
          <Link href="/orders" className="flex items-center gap-3 w-full text-surface-variant pl-4 py-2 hover:bg-primary/20 hover:text-primary-fixed transition-colors">
            <span className="material-symbols-outlined">package_2</span>
            <span className="font-data-label text-data-label">Orders</span>
          </Link>
          <Link href="/route-map" className="flex items-center gap-3 w-full text-primary-fixed font-bold border-l-4 border-primary-fixed pl-3 py-2 bg-primary/10 opacity-90 transition-all duration-200">
            <span className="material-symbols-outlined icon-fill">map</span>
            <span className="font-data-label text-data-label">Route Map</span>
          </Link>
          <Link href="/customers" className="flex items-center gap-3 w-full text-surface-variant pl-4 py-2 hover:bg-primary/20 hover:text-primary-fixed transition-colors">
            <span className="material-symbols-outlined">groups</span>
            <span className="font-data-label text-data-label">Customers</span>
          </Link>
          <Link href="/analytics" className="flex items-center gap-3 w-full text-surface-variant pl-4 py-2 hover:bg-primary/20 hover:text-primary-fixed transition-colors">
            <span className="material-symbols-outlined">analytics</span>
            <span className="font-data-label text-data-label">Analytics</span>
          </Link>
        </div>
        <div className="mt-auto px-4">
          <Link href="/settings" className="flex items-center gap-3 w-full text-surface-variant pl-4 py-2 hover:bg-primary/20 hover:text-primary-fixed transition-colors">
            <span className="material-symbols-outlined">settings</span>
            <span className="font-data-label text-data-label">Settings</span>
          </Link>
        </div>
      </nav>

      <main className="ml-[240px] flex w-[calc(100%-240px)] h-full">
        <section className="w-[35%] h-full bg-surface-container-lowest border-r border-surface-variant flex flex-col z-10 shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
          <div className="p-stack-lg border-b border-surface-variant flex flex-col gap-stack-md shrink-0">
            <div className="flex items-center justify-between">
              <h1 className="font-headline-lg text-headline-lg text-on-surface">Today's Route</h1>
              <button 
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="bg-tertiary-container text-on-tertiary-container hover:bg-tertiary transition-colors h-10 px-4 rounded-xl flex items-center gap-2 shadow-sm active:scale-95 duration-100 disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[18px] ${isOptimizing ? 'animate-spin' : ''}`}>
                  {isOptimizing ? 'autorenew' : 'bolt'}
                </span>
                <span className="font-data-value text-data-value font-semibold">
                  {isOptimizing ? 'Optimizing...' : 'Generate Route'}
                </span>
              </button>
            </div>
            <div className="flex items-center justify-between bg-surface-container-low p-4 rounded-xl border border-surface-container-high">
              <div className="flex flex-col">
                <span className="font-data-label text-data-label text-on-surface-variant mb-1">STOPS</span>
                <span className="font-headline-md text-headline-md text-primary">{routeData ? routeData.total_stops : 0}</span>
              </div>
              <div className="w-px h-8 bg-surface-variant"></div>
              <div className="flex flex-col">
                <span className="font-data-label text-data-label text-on-surface-variant mb-1">DISTANCE</span>
                <span className="font-headline-md text-headline-md text-primary">{routeData ? routeData.distance_km : "0.0"} km</span>
              </div>
              <div className="w-px h-8 bg-surface-variant"></div>
              <div className="flex flex-col">
                <span className="font-data-label text-data-label text-on-surface-variant mb-1">EST. TIME</span>
                <span className="font-headline-md text-headline-md text-primary">{routeData ? getHrsMins(routeData.est_minutes) : "0m"}</span>
              </div>
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto custom-scrollbar p-stack-md flex flex-col gap-stack-sm bg-surface">
            {routeData ? (
              routeData.route.map((stop: any, idx: number) => {
                if (stop.type === 'depot') {
                  return (
                    <div key={idx} className="bg-surface-container-high p-4 rounded-xl border border-surface-variant flex items-start gap-4 shadow-sm opacity-80">
                      <div className="w-8 h-8 rounded-full bg-[#005129] text-white flex items-center justify-center font-data-value text-data-value shrink-0">⌂</div>
                      <div className="flex-grow flex flex-col gap-1">
                          <span className="font-data-value text-data-value text-on-surface font-bold">{stop.label || 'Depot'}</span>
                          <span className="font-body-md text-body-md text-on-surface-variant">Dadar West Market</span>
                      </div>
                    </div>
                  );
                } else {
                  const matchingOrder = pendingOrders.find(o => o.id === stop.order_id);
                  const itemsText = matchingOrder && matchingOrder.order_items 
                      ? matchingOrder.order_items.map((i:any) => `${i.quantity} ${i.unit} ${i.product_name}`).join(', ') 
                      : 'Produce';

                  return (
                    <div key={idx} className="bg-surface-container-lowest p-4 rounded-xl border-l-4 border-l-secondary border-t border-r border-b border-surface-variant flex items-start gap-4 shadow-sm hover:shadow-md cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-data-value text-data-value shrink-0 ring-4 ring-secondary/20">{idx}</div>
                      <div className="flex-grow flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                              <span className="font-data-value text-data-value text-on-surface font-semibold">{stop.customer_name}</span>
                              <span className="px-2 py-1 bg-secondary-container/30 text-on-secondary-container rounded-full font-data-label text-data-label border border-secondary/30">Staged</span>
                          </div>
                          <span className="font-body-md text-body-md text-on-surface-variant">{itemsText}</span>
                          <span className="font-body-sm text-xs text-on-surface-variant flex items-center"><span className="material-symbols-outlined text-[14px] mr-1">location_on</span> {stop.address || ''}</span>
                      </div>
                    </div>
                  );
                }
              })
            ) : (
              pendingOrders.length === 0 ? (
                <div className="p-4 text-center text-on-surface-variant font-bold">No pending delivery requests.</div>
              ) : (
                pendingOrders.map((order: any, idx: number) => {
                  const itemsText = (order.order_items || []).map((i:any) => `${i.quantity} ${i.unit} ${i.product_name}`).join(', ') || 'No items';
                  return (
                    <div key={idx} className="bg-surface-container-lowest p-4 rounded-xl border border-surface-variant flex items-start gap-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-data-value text-data-value shrink-0">?</div>
                      <div className="flex-grow flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                              <span className="font-data-value text-data-value text-on-surface font-semibold">{order.customer_name}</span>
                              <span className="px-2 py-1 bg-tertiary-fixed/40 text-on-tertiary-container rounded-full font-data-label text-data-label border border-tertiary/20">{order.status}</span>
                          </div>
                          <span className="font-body-md text-body-md text-on-surface-variant">{itemsText}</span>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </section>
        
        <section className="w-[65%] h-full relative overflow-hidden bg-surface-container-low">
          <MapWrapper route={routeData ? routeData.route : []} />
          
          <div className="absolute top-6 right-6 bg-surface-container-lowest p-3 rounded-xl shadow-sm border border-surface-variant flex gap-4" style={{zIndex: 1000}}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#005129]"></div>
              <span className="font-data-label text-data-label text-on-surface">Depot</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#006d34]" style={{border: "2px solid #89d89e"}}></div>
              <span className="font-data-label text-data-label text-on-surface">Stops</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
