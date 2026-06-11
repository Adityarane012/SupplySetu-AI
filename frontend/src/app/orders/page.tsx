"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Package, Truck, Clock, Filter, BarChart3 } from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  const fetchOrders = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/orders");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("orders-list-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredOrders = filter === "all" ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-green-700">SupplySetu AI</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="/dashboard" className="flex items-center space-x-3 text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors">
            <Package size={20} />
            <span>Dashboard</span>
          </a>
          <a href="/orders" className="flex items-center space-x-3 text-green-700 bg-green-50 px-4 py-3 rounded-lg font-medium">
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

      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Order Management</h2>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Items Details</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order: any) => (
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
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {order.order_items?.map((item: any) => (
                      <div key={item.id}>{item.quantity} {item.unit} {item.product_name}</div>
                    ))}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-lg mr-2">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="p-8 text-center text-gray-500">No orders match this filter.</div>
          )}
        </div>
      </main>
    </div>
  );
}
