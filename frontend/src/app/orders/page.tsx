"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchOrders();
    } catch (err) {
      console.error("Error updating order:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel("orders-list-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => { fetchOrders(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredOrders = filter === "all" ? orders : orders.filter(o => o.status === filter);

  const nextStatus: Record<string, string> = {
    pending: "in_transit",
    in_transit: "delivered",
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col md:flex-row selection:bg-primary-container selection:text-on-primary-container">
      
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
        </div>
      </header>

      {/* SideNavBar (Desktop - Unified with Dashboard) */}
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
              <Link href="/dashboard" className="flex items-center gap-grid-gutter px-container-padding py-2 text-on-surface hover:bg-surface-variant transition-all active:translate-x-1 duration-150">
                <span className="material-symbols-outlined">dashboard</span>
                <span className="font-vernacular-md text-vernacular-md">Dashboard / डैशबोर्ड</span>
              </Link>
            </li>
            <li>
              <Link href="/orders" className="flex items-center gap-grid-gutter px-container-padding py-2 bg-secondary-container text-on-secondary-container border-b-4 border-secondary-fixed-dim font-bold active:translate-x-1 duration-150">
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
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64 min-w-0">
        <main className="flex-1 p-margin-mobile md:p-margin-desktop overflow-auto">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-stack-lg">
            <div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background">Orders Management</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">Monitor and manage all incoming and outgoing shipments.</p>
            </div>
            <Link href="/simulator" className="bg-primary-container text-on-primary px-4 py-2 rounded-xl font-data-value text-data-value hover:bg-primary-container/90 transition-colors flex items-center gap-2 shadow-[0px_2px_4px_rgba(0,0,0,0.04)] whitespace-nowrap self-start sm:self-auto border-2 border-on-background">
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Order (Simulator)
            </Link>
          </div>

          {/* Filter Bar */}
          <div className="bg-surface-container-lowest rounded-xl border-2 border-on-background p-4 mb-stack-md shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center">
              <div className="w-full lg:w-auto flex-1 flex flex-col sm:flex-row gap-4">
                {/* Status Filter */}
                <div className="flex-1">
                  <label className="block font-data-label text-data-label text-on-surface-variant mb-1">Status</label>
                  <div className="relative">
                    <select 
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 bg-surface border-2 border-on-background rounded-[6px] font-data-value text-data-value text-on-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow appearance-none cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="in_transit">In Transit</option>
                      <option value="delivered">Delivered</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">expand_more</span>
                  </div>
                </div>
                {/* Customer Search */}
                <div className="flex-1">
                  <label className="block font-data-label text-data-label text-on-surface-variant mb-1">Customer</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">person_search</span>
                    <input className="w-full pl-9 pr-4 py-2 bg-surface border-2 border-on-background rounded-[6px] font-data-value text-data-value text-on-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow" placeholder="Search by name..." type="text"/>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Table Card */}
          <div className="bg-surface-container-lowest rounded-[20px] shadow-[4px_4px_0px_rgba(0,0,0,1)] border-2 border-on-background overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-surface border-b-2 border-on-background">
                    <th className="px-6 py-4 font-data-label text-data-label text-on-surface-variant uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-4 font-data-label text-data-label text-on-surface-variant uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 font-data-label text-data-label text-on-surface-variant uppercase tracking-wider">Items</th>
                    <th className="px-6 py-4 font-data-label text-data-label text-on-surface-variant uppercase tracking-wider text-right">Quantity</th>
                    <th className="px-6 py-4 font-data-label text-data-label text-on-surface-variant uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 font-data-label text-data-label text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 font-data-label text-data-label text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-on-background">
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-on-surface-variant font-data-value">
                        No orders found matching the filter.
                      </td>
                    </tr>
                  )}
                  {filteredOrders.map((order: any, idx: number) => {
                    const totalQty = (order.order_items || []).reduce((acc: number, item: any) => acc + (item.quantity || 0), 0);
                    const itemsText = (order.order_items || []).map((i: any) => i.product_name).join(', ') || 'No items';
                    const mainItem = itemsText.split(',')[0];
                    const otherCount = Math.max(0, (order.order_items || []).length - 1);
                    
                    return (
                      <tr key={order.id} className="hover:bg-surface-container-high transition-colors group">
                        <td className="px-6 py-4">
                          <span className="font-code-sm text-code-sm text-on-background bg-surface-variant px-2 py-1 rounded border-2 border-on-background">#{order.id.slice(0, 8).toUpperCase()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface-variant border-2 border-on-background flex items-center justify-center font-data-label text-data-label text-on-surface-variant uppercase">
                              {order.customer_name ? order.customer_name.slice(0,2) : "UN"}
                            </div>
                            <div>
                              <p className="font-data-value text-data-value text-on-background">{order.customer_name}</p>
                              <p className="font-data-label text-data-label text-on-surface-variant capitalize">{order.source.replace('_', ' ')} Hub</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-data-value text-data-value text-on-background truncate max-w-[150px]" title={itemsText}>{mainItem}</p>
                          {otherCount > 0 && <p className="font-data-label text-data-label text-outline">+{otherCount} more items</p>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-data-value text-data-value text-on-background">{totalQty > 0 ? totalQty + " units" : "--"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-data-value text-data-value text-on-background">{new Date(order.created_at).toLocaleDateString()}</p>
                          <p className="font-data-label text-data-label text-outline">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </td>
                        <td className="px-6 py-4">
                          {order.status === 'pending' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF8E1] text-[#F57F17] font-data-label text-data-label border border-[#FFECB3]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#F57F17]"></span>
                              Pending
                            </span>
                          )}
                          {order.status === 'in_transit' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E3F2FD] text-[#1565C0] font-data-label text-data-label border border-[#BBDEFB]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1565C0]"></span>
                              In Transit
                            </span>
                          )}
                          {order.status === 'delivered' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32] font-data-label text-data-label border border-[#C8E6C9]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]"></span>
                              Delivered
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity">
                            {nextStatus[order.status] ? (
                              <button 
                                onClick={() => updateStatus(order.id, nextStatus[order.status])}
                                disabled={updatingId === order.id}
                                className="text-on-surface-variant hover:text-primary-container p-2 rounded-lg hover:bg-surface-variant transition-colors bg-surface border-2 border-on-background shadow-sm" 
                                title={`Mark as ${nextStatus[order.status]}`}
                              >
                                {updatingId === order.id ? (
                                  <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                                ) : (
                                  <span className="material-symbols-outlined text-[20px]">{order.status === 'pending' ? 'local_shipping' : 'check_circle'}</span>
                                )}
                              </button>
                            ) : (
                              <span className="material-symbols-outlined text-green-600 text-[24px]">task_alt</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Footer */}
            <div className="bg-surface border-t-2 border-on-background px-6 py-3 flex items-center justify-between">
              <p className="font-data-label text-data-label text-on-surface-variant">Showing {filteredOrders.length} entries</p>
            </div>
          </div>
        </main>
      </div>
      
      {/* BottomNavBar (Mobile) */}
      <nav className="md:hidden bg-surface flex justify-around items-center w-full py-2 fixed bottom-0 z-50 border-t border-surface-variant shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <Link className="flex flex-col items-center justify-center w-full py-1 text-on-surface-variant" href="/dashboard">
          <span className="material-symbols-outlined mb-1">dashboard</span>
          <span className="font-label-lg text-label-lg">Dashboard</span>
        </Link>
        <Link className="flex flex-col items-center justify-center w-full py-1 text-primary font-bold" href="/orders">
          <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>package_2</span>
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
