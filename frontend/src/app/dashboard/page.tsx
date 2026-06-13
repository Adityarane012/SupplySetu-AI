"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function DashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    delivered: 0,
    total: 0,
    revenue: 0,
  });

  const fetchOrders = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/health`).catch(() => {});
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders`);
      const data = await res.json();
      setOrders(data);
      
      const pending = data.filter((o: any) => o.status === "pending").length;
      const delivered = data.filter((o: any) => o.status === "delivered").length;
      const total = data.length;
      
      // Calculate Est. Value (Mock logic matching the HTML script)
      let estVal = 0;
      data.forEach((o: any) => {
        if (o.order_items) {
          o.order_items.forEach((item: any) => {
            let rate = 40;
            const name = (item.product_name || "").toLowerCase();
            if (name.includes('tomato')) rate = 60;
            else if (name.includes('potato')) rate = 30;
            else if (name.includes('onion')) rate = 45;
            else if (name.includes('garlic')) rate = 180;
            else if (name.includes('spinach')) rate = 25;
            estVal += (item.quantity || 0) * rate;
          });
        }
      });
      
      setStats({ pending, delivered, total, revenue: estVal });
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          console.log("Realtime event received:", payload);
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="bg-background text-on-background font-body-md selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col md:flex-row">
      {/* TopAppBar (Mobile) */}
      <header className="bg-surface flex justify-between items-center w-full px-grid-gutter py-2 max-w-[1440px] mx-auto border-b-2 border-on-background docked full-width top-0 sticky z-50 md:hidden">
        <div className="flex items-center gap-item-gap">
          <span className="font-headline-lg text-headline-lg font-bold text-primary">SupplySetu AI</span>
        </div>
        <div className="flex items-center gap-grid-gutter">
          <button className="text-on-surface-variant hover:bg-surface-container-high transition-colors p-unit rounded-full active:scale-95 duration-75">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
          </button>
          <button className="text-on-surface-variant hover:bg-surface-container-high transition-colors p-unit rounded-full active:scale-95 duration-75">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
          </button>
          <button className="text-on-surface-variant hover:bg-surface-container-high transition-colors p-unit rounded-full active:scale-95 duration-75">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
          </button>
        </div>
      </header>

      {/* SideNavBar (Desktop) */}
      <nav className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface-container border-r-2 border-on-background z-40 py-section-margin px-unit justify-between">
        <div>
          <div className="px-container-padding mb-section-margin">
            <h1 className="font-headline-md text-headline-md font-bold text-primary mb-item-gap">SupplySetu Vendor</h1>
            <div className="flex items-center gap-item-gap">
              <img alt="Vendor Profile" className="w-10 h-10 rounded-full border-2 border-on-background object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBW6BvZ-28Wf7rHoTOcg4IUs3h9pK_EvoiewgaB37bdrtweXx6nPxRtZ5ZGAnggSPUDs9kOwXnad-neA19dFUzbbSZcMUmCXp-qSjzvZ-426oQrOJZt-5fzJBUkkW8cACW6IgOe9ZWgd2uaY7P8XlGRyEpCAYaye2NY321NP4TCSRFBoCVYNouWBlKVUpf7o1HGIgP48LwbRknYBDNlvgs1fiJy6iJoesEHUZXFpdLJkyzsL2c3pSEn1Fa9KoSQXqaeXRnX0-35a36F" />
              <div>
                <p className="font-vernacular-md text-vernacular-md text-on-surface">ID: 99283-IN</p>
              </div>
            </div>
          </div>
          <ul className="flex flex-col gap-unit">
            <li>
              <Link href="/dashboard" className="flex items-center gap-grid-gutter px-container-padding py-2 bg-secondary-container text-on-secondary-container border-b-4 border-secondary-fixed-dim font-bold active:translate-x-1 duration-150">
                <span className="material-symbols-outlined">dashboard</span>
                <span className="font-vernacular-md text-vernacular-md">Dashboard / डैशबोर्ड</span>
              </Link>
            </li>
            <li>
              <Link href="/orders" className="flex items-center gap-grid-gutter px-container-padding py-2 text-on-surface hover:bg-surface-variant transition-all active:translate-x-1 duration-150">
                <span className="material-symbols-outlined">package_2</span>
                <span className="font-vernacular-md text-vernacular-md">Orders / ऑर्डर</span>
              </Link>
            </li>
            <li>
              <Link href="/route-map" className="flex items-center gap-grid-gutter px-container-padding py-2 text-on-surface hover:bg-surface-variant transition-all active:translate-x-1 duration-150">
                <span className="material-symbols-outlined">map</span>
                <span className="font-vernacular-md text-vernacular-md">Route Map / मार्ग</span>
              </Link>
            </li>
            <li>
              <Link href="/analytics" className="flex items-center gap-grid-gutter px-container-padding py-2 text-on-surface hover:bg-surface-variant transition-all active:translate-x-1 duration-150">
                <span className="material-symbols-outlined">leaderboard</span>
                <span className="font-vernacular-md text-vernacular-md">Analytics / विश्लेषण</span>
              </Link>
            </li>
            <li>
              <Link href="/simulator" className="flex items-center gap-grid-gutter px-container-padding py-2 text-on-surface hover:bg-surface-variant transition-all active:translate-x-1 duration-150">
                <span className="material-symbols-outlined">forum</span>
                <span className="font-vernacular-md text-vernacular-md">Simulator / सिम्युलेटर</span>
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <button className="w-full mb-grid-gutter py-2 px-container-padding bg-primary text-on-primary font-label-lg text-label-lg font-bold border-2 border-on-background hover:bg-primary-container transition-colors flex items-center justify-center gap-item-gap">
            <span className="material-symbols-outlined">add</span>
            New Request / नया अनुरोध
          </button>
          <ul className="flex flex-col gap-unit border-t-2 border-on-surface-variant pt-grid-gutter">
            <li>
              <a className="flex items-center gap-grid-gutter px-container-padding py-2 text-on-surface hover:bg-surface-variant transition-all active:translate-x-1 duration-150" href="#">
                <span className="material-symbols-outlined">settings</span>
                <span className="font-vernacular-md text-vernacular-md">Settings / सेटिंग्स</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="flex-1 md:ml-64 p-grid-gutter md:p-section-margin max-w-[1440px] mx-auto w-full flex flex-col gap-section-margin relative pb-24 md:pb-section-margin">
        {/* Command Center (Voice Hero) */}
        <section className="bg-[#121212] border-2 border-on-background rounded-xl p-section-margin flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden border-b-4 border-b-secondary-container">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at center, #69ff87 0%, transparent 70%)" }}></div>
          <Link href="/simulator" className="relative w-20 h-20 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center border-2 border-on-background animate-[ripple_2s_infinite_linear] hover:scale-110 transition-transform z-10 focus:outline-none focus:ring-4 focus:ring-primary-fixed-dim">
            <span className="material-symbols-outlined text-4xl">mic</span>
          </Link>
          <div className="mt-grid-gutter text-center z-10">
            <h2 className="font-display-lg text-display-lg text-on-error mb-unit">बोलो (Speak)</h2>
            <p className="font-body-lg text-body-lg text-surface-dim">"Show today's pending orders" / "आज के पेंडिंग ऑर्डर दिखाएं"</p>
          </div>
        </section>

        {/* KPI Strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-grid-gutter">
          <div className="bg-surface-container-highest border-2 border-on-background p-container-padding rounded border-b-4 border-b-secondary-container flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-item-gap">
              <span className="font-label-lg text-label-lg text-on-surface-variant uppercase">Pending / पेंडिंग</span>
              <span className="material-symbols-outlined text-on-surface-variant">hourglass_empty</span>
            </div>
            <div>
              <span className="font-headline-lg text-headline-lg font-bold text-on-surface block">{stats.pending}</span>
              <span className="font-body-sm text-body-sm text-error flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[16px]">arrow_upward</span> today
              </span>
            </div>
          </div>

          <div className="bg-surface-container-highest border-2 border-on-background p-container-padding rounded border-b-4 border-b-primary-container flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-item-gap">
              <span className="font-label-lg text-label-lg text-on-surface-variant uppercase">Delivered / डिलीवर</span>
              <span className="material-symbols-outlined text-on-surface-variant">check_circle</span>
            </div>
            <div>
              <span className="font-headline-lg text-headline-lg font-bold text-on-surface block">{stats.delivered}</span>
              <span className="font-body-sm text-body-sm text-primary flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[16px]">arrow_upward</span> today
              </span>
            </div>
          </div>

          <div className="bg-surface-container-highest border-2 border-on-background p-container-padding rounded border-b-4 border-b-tertiary-container flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-item-gap">
              <span className="font-label-lg text-label-lg text-on-surface-variant uppercase">Est. Value / मूल्य</span>
              <span className="material-symbols-outlined text-on-surface-variant">payments</span>
            </div>
            <div>
              <span className="font-headline-lg text-headline-lg font-bold text-on-surface block">₹{stats.revenue.toLocaleString('en-IN')}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                Expected today
              </span>
            </div>
          </div>

          <div className="bg-surface-container-highest border-2 border-on-background p-container-padding rounded border-b-4 border-b-secondary flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-item-gap">
              <span className="font-label-lg text-label-lg text-on-surface-variant uppercase">Total Orders / कुल</span>
              <span className="material-symbols-outlined text-on-surface-variant">list_alt</span>
            </div>
            <div>
              <span className="font-headline-lg text-headline-lg font-bold text-on-surface block">{stats.total}</span>
              <span className="font-body-sm text-body-sm text-secondary flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[16px]">info</span> all today
              </span>
            </div>
          </div>
        </section>

        {/* High Density Data Table: Today's Orders */}
        <section className="bg-surface border-2 border-on-background rounded-lg overflow-hidden flex flex-col">
          <div className="p-container-padding border-b-2 border-on-background bg-surface-container flex justify-between items-center">
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-item-gap">
              <span className="material-symbols-outlined text-secondary">list_alt</span>
              आज के ऑर्डर / Today's Orders
            </h3>
            <Link href="/orders" className="text-label-lg font-label-lg font-bold text-primary hover:underline uppercase">View All / सभी देखें</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-surface-variant font-label-lg text-label-lg text-on-surface-variant uppercase border-b-2 border-on-background">
                <tr>
                  <th className="py-2 px-container-padding w-16">ID</th>
                  <th className="py-2 px-container-padding">Status / स्थिति</th>
                  <th className="py-2 px-container-padding">Origin / मूल</th>
                  <th className="py-2 px-container-padding">Dest. / गंतव्य</th>
                  <th className="py-2 px-container-padding">Items / सामग्री</th>
                  <th className="py-2 px-container-padding w-24 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm">
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-on-surface-variant font-bold">No orders scheduled for today.</td>
                  </tr>
                )}
                {orders.slice(0, 5).map((order: any, idx: number) => {
                  const itemsText = (order.order_items || []).map((i: any) => `${i.quantity} ${i.unit} ${i.product_name}`).join(', ') || 'No items';
                  const isEven = idx % 2 === 0;
                  
                  return (
                    <tr key={order.id} className={`border-b-2 border-on-background hover:bg-surface-container-high transition-colors ${isEven ? 'bg-surface-container' : 'bg-surface-container-lowest'}`}>
                      <td className="py-2 px-container-padding font-bold">#{order.id.slice(0,4).toUpperCase()}</td>
                      <td className="py-2 px-container-padding">
                        {order.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed rounded-sm font-bold text-[11px] uppercase whitespace-nowrap border-2 border-on-background">
                            <span className="material-symbols-outlined text-[14px]">pending_actions</span> पेंडिंग / Pending
                          </span>
                        )}
                        {order.status === 'in_transit' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed rounded-sm font-bold text-[11px] uppercase whitespace-nowrap border-2 border-on-background">
                            <span className="material-symbols-outlined text-[14px]">local_shipping</span> मार्ग में / In Transit
                          </span>
                        )}
                        {order.status === 'delivered' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-fixed text-on-primary-fixed rounded-sm font-bold text-[11px] uppercase whitespace-nowrap border-2 border-on-background">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span> डिलीवर / Delivered
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-container-padding">
                        <div className="font-bold text-on-surface text-[14px]">Mumbai Central</div>
                        <div className="text-on-surface-variant text-[11px]">Vendor Depot</div>
                      </td>
                      <td className="py-2 px-container-padding">
                        <div className="font-bold text-on-surface text-[14px]">{order.customer_name}</div>
                        <div className="text-on-surface-variant text-[11px] capitalize">{order.source.replace('_', ' ')}</div>
                      </td>
                      <td className="py-2 px-container-padding">
                        <div className="font-bold text-on-surface text-[14px] truncate max-w-[200px]" title={itemsText}>{itemsText}</div>
                        <div className="text-on-surface-variant text-[11px]">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td className="py-2 px-container-padding text-right">
                        <button className="p-1 text-on-surface hover:bg-surface-variant rounded border-2 border-on-background bg-surface-container-lowest">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-unit bg-surface-container-lowest flex justify-center items-center border-t-2 border-on-background">
            <div className="flex gap-1">
              <button className="w-8 h-8 flex items-center justify-center border-2 border-on-background bg-surface-variant text-on-surface-variant"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
              <button className="w-8 h-8 flex items-center justify-center border-2 border-on-background bg-primary text-on-primary font-bold">1</button>
              <button className="w-8 h-8 flex items-center justify-center border-2 border-on-background bg-surface text-on-surface font-bold hover:bg-surface-variant"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
            </div>
          </div>
        </section>
      </main>

      {/* BottomNavBar (Mobile) */}
      <nav className="md:hidden bg-surface flex justify-around items-center w-full py-2 fixed bottom-0 z-50 border-t border-surface-variant shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <Link className="flex flex-col items-center justify-center w-full py-1 text-primary font-bold" href="/dashboard">
          <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
          <span className="font-label-lg text-label-lg">Dashboard</span>
        </Link>
        <Link className="flex flex-col items-center justify-center w-full py-1 text-on-surface-variant" href="/orders">
          <span className="material-symbols-outlined mb-1">package_2</span>
          <span className="font-label-lg text-label-lg">Orders</span>
        </Link>
        <Link className="flex flex-col items-center justify-center w-full py-1 text-on-surface-variant" href="/route-map">
          <span className="material-symbols-outlined mb-1">map</span>
          <span className="font-label-lg text-label-lg">Map</span>
        </Link>
        <Link className="flex flex-col items-center justify-center w-full py-1 text-on-surface-variant" href="/simulator">
          <span className="material-symbols-outlined mb-1">forum</span>
          <span className="font-label-lg text-label-lg">Chat</span>
        </Link>
      </nav>
    </div>
  );
}
