"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Package,
  Truck,
  Clock,
  Filter,
  BarChart3,
  ArrowLeft,
  Mic,
  MessageSquare,
  Hand,
  Settings2,
  PlusCircle,
  ArrowRightLeft,
  StickyNote,
  Quote,
  X,
} from "lucide-react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-orange-100 text-orange-700",
  in_transit: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const NEXT_STATUS: Record<string, { next: string; label: string }> = {
  pending: { next: "in_transit", label: "Mark In Transit" },
  in_transit: { next: "delivered", label: "Mark Delivered" },
};

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

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<{ status: string; label: string } | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    try {
      const [orderRes, historyRes] = await Promise.all([
        fetch(`${BACKEND}/api/orders/${orderId}`),
        fetch(`${BACKEND}/api/orders/${orderId}/history`),
      ]);
      if (orderRes.ok) setOrder(await orderRes.json());
      if (historyRes.ok) setHistory(await historyRes.json());
    } catch (err) {
      console.error("Error fetching order detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;
    fetchAll();

    const channel = supabase
      .channel(`order-detail-${orderId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        () => fetchAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_history", filter: `order_id=eq.${orderId}` },
        () => fetchAll()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const openReasonModal = (status: string, label: string) => {
    setReason("");
    setPendingAction({ status, label });
  };

  const confirmStatusChange = async () => {
    if (!pendingAction) return;
    if (pendingAction.status === "cancelled" && !reason.trim()) {
      return; // cancellation requires a reason
    }
    setSubmitting(true);
    try {
      await fetch(`${BACKEND}/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: pendingAction.status, reason: reason.trim() || undefined }),
      });
      setPendingAction(null);
      await fetchAll();
    } catch (err) {
      console.error("Error updating order:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading order…</div>;
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-500 gap-4">
        <p>Order not found.</p>
        <a href="/orders" className="text-green-600 font-medium hover:text-green-700">← Back to Orders</a>
      </div>
    );
  }

  const advance = NEXT_STATUS[order.status];
  const canCancel = order.status === "pending" || order.status === "in_transit";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-5 border-b border-gray-200 flex items-center">
          <img src="/logo-main.png" alt="SupplySetu AI" className="h-10 w-auto" />
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

      <main className="flex-1 p-8 max-w-5xl">
        <button
          onClick={() => router.push("/orders")}
          className="flex items-center space-x-2 text-gray-500 hover:text-gray-800 text-sm font-medium mb-6"
        >
          <ArrowLeft size={16} />
          <span>Back to Orders</span>
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs text-gray-400 font-mono mb-1">#{order.id.slice(0, 8)}</p>
              <h2 className="text-2xl font-bold text-gray-800">{order.customer_name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Scheduled {order.scheduled_date} · Source {order.source?.replace("_", " ")}
              </p>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold h-fit ${STATUS_STYLE[order.status] || "bg-gray-100 text-gray-700"}`}>
              {order.status.replace("_", " ").toUpperCase()}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Items</p>
              <ul className="text-sm text-gray-700 space-y-1">
                {order.order_items?.map((item: any) => (
                  <li key={item.id}>• {item.quantity} {item.unit} {item.product_name}</li>
                ))}
              </ul>
            </div>
            {order.raw_transcript && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Raw Voice/Text Transcript</p>
                <p className="text-sm text-gray-600 font-mono bg-gray-50 border border-gray-200 rounded-lg p-3">
                  “{order.raw_transcript}”
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            {advance && (
              <button
                onClick={() => openReasonModal(advance.next, advance.label)}
                className="px-4 py-2 rounded-lg text-white font-medium text-sm bg-blue-500 hover:bg-blue-600 transition-colors shadow-sm"
              >
                {advance.label}
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => openReasonModal("cancelled", "Cancel Order")}
                className="px-4 py-2 rounded-lg text-red-600 font-medium text-sm border border-red-200 hover:bg-red-50 transition-colors"
              >
                Cancel Order
              </button>
            )}
            {!advance && !canCancel && (
              <span className="text-green-600 text-sm font-semibold">✓ No further actions</span>
            )}
          </div>
        </div>

        {/* Intent & Change History Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-1">Change History</h3>
          <p className="text-sm text-gray-500 mb-6">Every meaningful change to this order, with the captured intent behind it.</p>

          {history.length === 0 ? (
            <p className="text-sm text-gray-400">No history recorded yet.</p>
          ) : (
            <ol className="relative border-l border-gray-200 ml-2 space-y-6">
              {history.map((h) => {
                const ChangeIcon = CHANGE_ICON[h.change_type] || Package;
                const SourceIcon = SOURCE_ICON[h.source] || Settings2;
                return (
                  <li key={h.id} className="ml-6">
                    <span className="absolute -left-[9px] flex items-center justify-center w-4 h-4 bg-green-100 rounded-full ring-4 ring-white">
                      <ChangeIcon size={10} className="text-green-700" />
                    </span>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800">{h.summary}</p>
                      <span className="text-xs text-gray-400">{timeAgo(h.created_at)}</span>
                    </div>
                    {h.intent && (
                      <p className="text-sm text-gray-600 italic mt-1 flex items-start gap-1.5">
                        <Quote size={12} className="mt-1 shrink-0 text-gray-400" />
                        {h.intent}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400">
                      <SourceIcon size={12} />
                      <span className="capitalize">{h.source}</span>
                      {h.actor && <span>· {h.actor}</span>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </main>

      {/* Reason Modal */}
      {pendingAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-800">{pendingAction.label}</h4>
              <button onClick={() => setPendingAction(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <label className="text-sm text-gray-600 mb-2 block">
              Why? {pendingAction.status === "cancelled" ? "(required)" : "(optional — captured as intent in the history log)"}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={
                pendingAction.status === "cancelled"
                  ? "e.g. Customer no longer needs the items"
                  : "e.g. Driver picked up the order"
              }
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {pendingAction.status === "cancelled" && !reason.trim() && (
              <p className="text-xs text-red-500 mt-1">A reason is required to cancel an order.</p>
            )}
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setPendingAction(null)}
                className="px-4 py-2 rounded-lg text-gray-600 font-medium text-sm hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={submitting || (pendingAction.status === "cancelled" && !reason.trim())}
                className="px-4 py-2 rounded-lg text-white font-medium text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Saving…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
