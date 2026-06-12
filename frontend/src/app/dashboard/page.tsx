"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Package, Truck, DollarSign, CheckCircle, Clock, BarChart3, Filter, Plus } from "lucide-react";

export default function DashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    in_transit: 0,
    delivered: 0,
  });

  const fetchOrders = async () => {
    try {
      // Wake up Render backend (free tier spins down after inactivity)
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/health`).catch(() => {});
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders`);
      const data = await res.json();
      setOrders(data);
      
      const pending = data.filter((o: any) => o.status === "pending").length;
      const inTransit = data.filter((o: any) => o.status === "in_transit").length;
      const delivered = data.filter((o: any) => o.status === "delivered").length;
      
      setStats({ pending, in_transit: inTransit, delivered });
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Subscribe to realtime orders table updates
    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          console.log("Realtime event received:", payload);
          fetchOrders(); // Re-fetch on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-5 border-b border-gray-200 flex items-center">
          <img src="/logo-main.png" alt="SupplySetu AI" className="h-10 w-auto" />
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="/dashboard" className="flex items-center space-x-3 text-green-700 bg-green-50 px-4 py-3 rounded-lg font-medium">
            <Package size={20} />
            <span>Dashboard</span>
          </a>
          <a href="/orders" className="flex items-center space-x-3 text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors">
            <Filter size={20} />
            <span>All Orders</span>
          </a>
          <a href="/route-map" className="flex items-center space-x-3 text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors">
            <Truck size={20} />
            <span>Route Optimization</span>
          </a>
          <a href="/analytics" className="flex items-center space-x-3 text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors">
            <BarChart3 size={20} />
            <span>Analytics</span>
          </a>
          <a href="/simulator" className="flex items-center space-x-3 text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors">
            <Clock size={20} />
            <span>WhatsApp Simulator</span>
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Vendor Dashboard</h2>
          <div className="flex items-center space-x-4">
            <a href="/orders/new" className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm">
              <Plus size={18} />
              <span>New Voice Order</span>
            </a>
            <div className="text-gray-500 flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium">Live Sync Active</span>
          </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Pending Orders</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.pending}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-full text-orange-500">
              <Clock size={24} />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">In Transit</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.in_transit}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-full text-blue-500">
              <Truck size={24} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Delivered</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.delivered}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-full text-green-500">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800">Recent Orders (Realtime)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.slice(0, 10).map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">{order.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{order.customer_name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold 
                        ${order.status === 'pending' ? 'bg-orange-100 text-orange-700' : 
                          order.status === 'in_transit' ? 'bg-blue-100 text-blue-700' : 
                          'bg-green-100 text-green-700'}`}>
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 capitalize">{order.source.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {order.order_items?.length} items
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && (
              <div className="p-8 text-center text-gray-500">No orders found. Send a message via simulator!</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
