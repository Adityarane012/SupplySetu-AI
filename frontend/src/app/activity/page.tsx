"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Package, 
  Truck, 
  Clock, 
  Filter, 
  BarChart3, 
  ActivitySquare,
  PlusCircle,
  ArrowRightLeft,
  StickyNote,
  Edit3,
  Mic,
  MessageSquare,
  Hand,
  Settings2,
  Quote
} from "lucide-react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

const SOURCE_ICON: Record<string, any> = {
  voice: Mic,
  text: MessageSquare,
  manual: Hand,
  system: Settings2,
};

const CHANGE_ICON: Record<string, any> = {
  created: PlusCircle,
  status_changed: ArrowRightLeft,
  notes_changed: StickyNote,
  items_changed: Edit3,
};

const SOURCE_STYLE: Record<string, string> = {
  voice: "bg-purple-100 text-purple-700",
  text: "bg-blue-100 text-blue-700",
  manual: "bg-orange-100 text-orange-700",
  system: "bg-gray-100 text-gray-700",
};

function timeAgo(iso: string) {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [changeTypeFilter, setChangeTypeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const fetchActivity = async () => {
    try {
      setError(null);
      let url = `${BACKEND}/api/orders/activity?limit=50`;
      if (changeTypeFilter !== "all") {
        url += `&change_type=${changeTypeFilter}`;
      }
      if (sourceFilter !== "all") {
        url += `&source=${sourceFilter}`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch activity from the server");
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error("Invalid response format: Expected an array of activities");
      }
      setActivities(data);
    } catch (err: any) {
      console.error("Error fetching activity:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();

    const channel = supabase
      .channel("activity-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_history" },
        () => fetchActivity()
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [changeTypeFilter, sourceFilter]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col shrink-0">
        <div className="p-5 border-b border-gray-200 flex items-center">
          <img src="/logo-main.png" alt="SupplySetu AI" className="h-10 w-auto" />
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
          <a href="/analytics" className="flex items-center space-x-3 text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors">
            <BarChart3 size={20} />
            <span>Analytics</span>
          </a>
          <a href="/simulator" className="flex items-center space-x-3 text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors">
            <Clock size={20} />
            <span>WhatsApp Simulator</span>
          </a>
          <a href="/activity" className="flex items-center space-x-3 text-green-700 bg-green-50 px-4 py-3 rounded-lg font-medium">
            <ActivitySquare size={20} />
            <span>Activity</span>
          </a>
        </nav>
      </div>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <h2 className="text-3xl font-bold text-gray-800">Global Activity Feed</h2>
          <div className="flex items-center space-x-3 flex-wrap gap-y-3">
            <select 
              value={changeTypeFilter} 
              onChange={(e) => setChangeTypeFilter(e.target.value)}
              className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            >
              <option value="all">All Changes</option>
              <option value="created">Created</option>
              <option value="status_changed">Status Changed</option>
              <option value="items_changed">Items Changed</option>
              <option value="notes_changed">Notes Changed</option>
            </select>
            <select 
              value={sourceFilter} 
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            >
              <option value="all">All Sources</option>
              <option value="voice">Voice</option>
              <option value="text">Text</option>
              <option value="manual">Manual</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {error ? (
            <div className="p-8 text-center bg-red-50 border-t border-red-100">
              <p className="text-red-600 font-medium">{error}</p>
              <button onClick={fetchActivity} className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm transition-colors">
                Try Again
              </button>
            </div>
          ) : loading ? (
            <div className="p-12 text-center text-gray-500">Loading activity...</div>
          ) : activities.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">No activity matches these filters.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-header-group">
                <tr>
                  <th className="px-6 py-4 w-12"></th>
                  <th className="px-6 py-4">Change</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activities.map((act: any) => {
                  const ChangeIcon = CHANGE_ICON[act.change_type] || ActivitySquare;
                  const SrcIcon = SOURCE_ICON[act.source] || Settings2;
                  
                  return (
                    <tr key={act.id} className="hover:bg-gray-50 transition-colors flex flex-col sm:table-row">
                      <td className="px-6 py-4 hidden sm:table-cell align-top pt-5">
                        <ChangeIcon className="text-gray-400" size={20} />
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-start gap-3 sm:hidden mb-2">
                          <ChangeIcon className="text-gray-400 mt-0.5" size={16} />
                          <span className="text-sm font-medium text-gray-800">{act.summary}</span>
                        </div>
                        <div className="hidden sm:block text-sm font-medium text-gray-800 mb-1">
                          {act.summary}
                        </div>
                        {act.intent && (
                          <div className="text-sm text-gray-600 italic flex items-start gap-1.5 bg-gray-50 p-2 rounded border border-gray-100">
                            <Quote size={12} className="mt-1 shrink-0 text-gray-400" />
                            <span>{act.intent}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-2 sm:py-4 align-top">
                        <a href={`/orders/${act.order_id}`} className="text-sm font-medium text-green-700 hover:underline inline-flex items-center gap-1">
                          {act.orders?.customer_name || 'Unknown'} <span className="text-gray-400 font-normal text-xs">#{act.order_id.slice(0, 6)}</span>
                        </a>
                      </td>
                      <td className="px-6 py-2 sm:py-4 align-top">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${SOURCE_STYLE[act.source] || SOURCE_STYLE.system}`}>
                          <SrcIcon size={12} />
                          <span className="capitalize">{act.source}</span>
                        </div>
                      </td>
                      <td className="px-6 py-2 sm:py-4 text-left sm:text-right text-sm text-gray-500 align-top pb-4 sm:pb-4">
                        {timeAgo(act.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
