"use client";

import { useEffect, useState } from "react";
import { Package, Truck, Clock, Filter, BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [weekly, setWeekly] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [sumRes, weekRes, foreRes] = await Promise.all([
          fetch("http://localhost:8000/api/analytics/summary"),
          fetch("http://localhost:8000/api/analytics/weekly"),
          fetch("http://localhost:8000/api/analytics/forecast")
        ]);

        const sumData = await sumRes.json();
        const weekData = await weekRes.json();
        const foreData = await foreRes.json();

        setSummary(sumData);
        // Format dates for weekly chart
        const formattedWeekly = weekData.map((d: any) => ({
          ...d,
          day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })
        }));
        setWeekly(formattedWeekly);
        
        // Format forecast into an array for charts if needed
        const forecastArr = Object.entries(foreData.forecast_daily_avg || {}).map(([name, avg]) => ({
          name, avg
        }));
        setForecast(forecastArr);
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
          <a href="/orders" className="flex items-center space-x-3 text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors">
            <Filter size={20} />
            <span>All Orders</span>
          </a>
          <a href="/route-map" className="flex items-center space-x-3 text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors">
            <Truck size={20} />
            <span>Route Optimization</span>
          </a>
          <a href="/analytics" className="flex items-center space-x-3 text-green-700 bg-green-50 px-4 py-3 rounded-lg font-medium">
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
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Analytics & Observability</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-gray-500">Loading analytics...</div>
        ) : (
          <div className="space-y-8">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-sm font-medium text-gray-500 uppercase">Total Orders Today</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{summary?.total_orders || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-sm font-medium text-gray-500 uppercase">Completion Rate</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{summary?.completion_rate || 0}%</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-sm font-medium text-gray-500 uppercase">Pending Items</p>
                <p className="text-3xl font-bold text-orange-500 mt-2">{summary?.pending || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-sm font-medium text-gray-500 uppercase">In Transit</p>
                <p className="text-3xl font-bold text-blue-500 mt-2">{summary?.in_transit || 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 7-Day Weekly Trend Chart */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6">7-Day Order Volume</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weekly}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={3} dot={{r: 4, fill: '#16a34a'}} activeDot={{r: 8}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Demand Forecasting Card */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Demand Forecast (Daily Avg)</h3>
                <p className="text-sm text-gray-500 mb-6">Rolling 7-day average predictions for top requested items.</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={forecast} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#4B5563', fontSize: 12}} width={100} />
                      <RechartsTooltip cursor={{fill: '#F3F4F6'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                      <Bar dataKey="avg" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top Products Table */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Today's Top Products</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {summary?.top_products?.map((prod: any, i: number) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col items-center justify-center text-center">
                    <p className="font-bold text-gray-800 capitalize text-lg mb-1">{prod.name}</p>
                    <p className="text-gray-500 text-sm font-medium">{prod.quantity} requested</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
