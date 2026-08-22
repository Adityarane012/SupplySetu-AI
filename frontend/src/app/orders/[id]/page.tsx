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
  X,
  ActivitySquare,
  Quote,
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import HistoryDiff from "@/components/HistoryDiff";

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
  deleted: Trash2,
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

function TimelineEntry({ h }: { h: any }) {
  const [expanded, setExpanded] = useState(false);
  const ChangeIcon = CHANGE_ICON[h.change_type] || Package;
  const SourceIcon = SOURCE_ICON[h.source] || Settings2;
  const hasData = Boolean(h.before_data || h.after_data);

  return (
    <li className="ml-6">
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
      
      {hasData && (
        <div className="mt-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            {expanded ? "Hide changes" : "Show changes"}
          </button>
          {expanded && (
            <HistoryDiff before={h.before_data} after={h.after_data} />
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
        <SourceIcon size={12} />
        <span className="capitalize">{h.source}</span>
        {h.actor && <span>· {h.actor}</span>}
      </div>
    </li>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [scrubberIndex, setScrubberIndex] = useState<number>(-1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<{ status: string; label: string } | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    try {
      setError(null);
      const [orderRes, historyRes, snapRes] = await Promise.all([
        fetch(`${BACKEND}/api/orders/${orderId}`),
        fetch(`${BACKEND}/api/orders/${orderId}/history`),
        fetch(`${BACKEND}/api/orders/${orderId}/snapshots`),
      ]);
      
      if (!orderRes.ok) {
        throw new Error("Failed to fetch order details");
      }
      if (!historyRes.ok) {
        throw new Error("Failed to fetch order history");
      }
      if (!snapRes.ok) {
        throw new Error("Failed to fetch snapshots");
      }
      
      setOrder(await orderRes.json());
      const histData = await historyRes.json();
      const snapData = await snapRes.json();
      if (!Array.isArray(histData)) {
        throw new Error("Invalid response format: Expected an array of history events");
      }
      setHistory(histData);
      setSnapshots(snapData);
      if (snapData.length > 0 && scrubberIndex === -1) {
        setScrubberIndex(snapData.length - 1);
      }
    } catch (err: any) {
      console.error("Error fetching order detail:", err);
      setError(err.message || "An unexpected error occurred");
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (snapshots.length === 0) return;
      if (e.key === "ArrowLeft") {
        setScrubberIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        setScrubberIndex(prev => Math.min(snapshots.length - 1, prev + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [snapshots.length]);

  const openReasonModal = (status: string, label: string) => {
    setReason("");
    setPendingAction({ status, label });
  };

  const isMissedDelivery = pendingAction?.status === "delivered" && order?.scheduled_date && new Date().toISOString().split('T')[0] > order.scheduled_date;
  const isReasonRequired = pendingAction?.status === "cancelled" || pendingAction?.status === "deleted" || isMissedDelivery;


  const confirmStatusChange = async () => {
    if (!pendingAction) return;
    if (isReasonRequired && !reason.trim()) {
      return; 
    }
    setSubmitting(true);
    try {
      if (pendingAction.status === "deleted") {
        await fetch(`${BACKEND}/api/orders/${orderId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reason.trim() }),
        });
      } else {
        const body: any = { status: pendingAction.status, reason: reason.trim() || undefined };
        if (isMissedDelivery) {
            body.outcome_reason = reason.trim();
        }
        await fetch(`${BACKEND}/api/orders/${orderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
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

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-500 gap-4">
        <p className="font-medium text-lg">⚠️ {error}</p>
        <button onClick={fetchAll} className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm transition-colors">Try Again</button>
        <a href="/orders" className="text-gray-500 font-medium hover:text-gray-700 mt-2">← Back to Orders</a>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-500 gap-4">
        <p>Order not found.</p>
        <a href="/orders" className="text-green-600 font-medium hover:text-green-700">← Back to Orders</a>
      </div>
    );
  }

  const displaySnapshot = snapshots.length > 0 && scrubberIndex >= 0 && scrubberIndex < snapshots.length ? snapshots[scrubberIndex] : null;
  const isHistorical = displaySnapshot && scrubberIndex < snapshots.length - 1;
  const displayStatus = isHistorical ? displaySnapshot.state.status : order.status;
  const displayNotes = isHistorical ? displaySnapshot.state.notes : order.notes;
  const displayItems = isHistorical ? displaySnapshot.state.items : order.order_items;
  
  const advance = NEXT_STATUS[displayStatus];
  const canCancel = displayStatus === "pending" || displayStatus === "in_transit";
  const isDeleted = displayStatus === "deleted" || !!order.deleted_at;

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
          <a href="/activity" className="flex items-center space-x-3 text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors">
            <ActivitySquare size={20} />
            <span>Activity</span>
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
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-xs text-gray-400 font-mono mb-1">#{order.id.slice(0, 8)}</p>
              <h2 className="text-2xl font-bold text-gray-800">{order.customer_name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Scheduled {order.scheduled_date} · Source {order.source?.replace("_", " ")}
              </p>
            </div>
            <div className="flex flex-col gap-2 items-end">
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold h-fit ${isDeleted ? "bg-red-100 text-red-800" : (STATUS_STYLE[displayStatus] || "bg-gray-100 text-gray-700")}`}>
                  {isDeleted ? "DELETED" : displayStatus.replace("_", " ").toUpperCase()}
                </span>
                {!isHistorical && order.status === "delivered" && order.intent_outcome && (
                   <span className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold h-fit ${
                       order.intent_outcome === 'fulfilled' ? "bg-green-50 text-green-700 border border-green-200" : 
                       order.intent_outcome === 'missed' ? "bg-red-50 text-red-700 border border-red-200" : 
                       "bg-gray-50 text-gray-700 border border-gray-200"
                   }`}>
                     {order.intent_outcome === 'fulfilled' && <CheckCircle2 size={12} />}
                     {order.intent_outcome === 'missed' && <XCircle size={12} />}
                     {order.intent_outcome === 'unknown' && <HelpCircle size={12} />}
                     Intent {order.intent_outcome}
                   </span>
                )}
            </div>
          </div>
          
          {!isHistorical && order.status === "delivered" && order.intent_outcome === "missed" && order.intent_outcome_reason && (
              <div className="mt-4 bg-red-50 p-3 rounded-lg border border-red-100 flex items-start gap-2">
                 <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                 <div>
                    <p className="text-xs font-bold text-red-700 uppercase">Reason for missing deadline</p>
                    <p className="text-sm text-red-600 mt-1">{order.intent_outcome_reason}</p>
                 </div>
              </div>
          )}

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                <Package size={16} className="text-gray-400" /> Items 
                {isHistorical && <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-[10px]">Historical</span>}
              </h3>
              <ul className="space-y-2">
                {displayItems?.length ? (
                  displayItems.map((item: any, i: number) => (
                    <li key={i} className="flex justify-between text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="font-medium text-gray-800">{item.product_name}</span>
                      <span className="text-gray-600 bg-white px-2 py-1 rounded shadow-sm">
                        {item.quantity} {item.unit}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-500 italic p-3">No items.</li>
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                <StickyNote size={16} className="text-gray-400" /> Vendor Notes
                {isHistorical && <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-[10px]">Historical</span>}
              </h3>
              {displayNotes ? (
                <div className="text-sm text-gray-700 bg-yellow-50/50 p-4 rounded-lg border border-yellow-100 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {displayNotes}
                </div>
              ) : (
                <div className="text-sm text-gray-400 italic p-4 bg-gray-50 rounded-lg border border-gray-100">
                  No notes recorded.
                </div>
              )}
            </div>
            {!isHistorical && order.raw_transcript && (
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Raw Voice/Text Transcript</p>
                <p className="text-sm text-gray-600 font-mono bg-gray-50 border border-gray-200 rounded-lg p-3">
                  “{order.raw_transcript}”
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          {!isDeleted && (
            <div className="mt-6 flex flex-wrap gap-3 items-center">
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
                <span className="text-green-600 text-sm font-semibold flex items-center h-full mr-2">✓ No further actions</span>
              )}
              <button
                onClick={() => openReasonModal("deleted", "Delete Order")}
                className="px-4 py-2 rounded-lg text-red-600 font-medium text-sm border border-red-200 hover:bg-red-50 transition-colors"
              >
                Delete Order
              </button>
            </div>
          )}
        </div>

        {/* Intent & Change History Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Change History</h3>
              <p className="text-sm text-gray-500">Every meaningful change to this order, with the captured intent behind it.</p>
            </div>
            
            {snapshots.length > 0 && (
              <div className="flex-1 min-w-[250px] max-w-sm bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Time Machine</span>
                  {isHistorical && (
                    <button onClick={() => setScrubberIndex(snapshots.length - 1)} className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-600 font-medium hover:bg-gray-100 transition-colors">
                      Return to Now
                    </button>
                  )}
                </div>
                
                <input 
                  type="range"
                  min={0}
                  max={snapshots.length - 1}
                  value={scrubberIndex >= 0 ? scrubberIndex : 0}
                  onChange={(e) => setScrubberIndex(Number(e.target.value))}
                  className="w-full accent-green-600 cursor-pointer h-2 bg-gray-200 rounded-lg appearance-none outline-none focus:ring-2 focus:ring-green-500 mb-3"
                />
                
                {displaySnapshot && (
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-800">{timeAgo(displaySnapshot.timestamp)}</span>
                      <span className="text-gray-500 capitalize">{displaySnapshot.change_type.replace('_', ' ')}</span>
                    </div>
                    {displaySnapshot.intent && (
                      <p className="text-xs text-gray-500 italic truncate max-w-full" title={displaySnapshot.intent}>
                        "{displaySnapshot.intent}"
                      </p>
                    )}
                    {displaySnapshot.approximate && (
                      <div className="mt-2 bg-red-50 border border-red-200 px-2 py-1.5 rounded flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-red-700 font-bold text-[10px] uppercase">
                          <XCircle size={10} /> Approximate Data
                        </div>
                        <span className="text-[10px] text-red-600 leading-tight">
                          {displaySnapshot.approximate_reason}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {history.length === 0 ? (
            <p className="text-sm text-gray-400">No history recorded yet.</p>
          ) : (
            <ol className="relative border-l border-gray-200 ml-2 space-y-6">
              {history.map((h) => (
                <TimelineEntry key={h.id} h={h} />
              ))}
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
              Why? {isReasonRequired ? "(required)" : "(optional — captured as intent in the history log)"}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={
                pendingAction.status === "deleted"
                  ? "e.g. Duplicate order, created by mistake"
                  : pendingAction.status === "cancelled"
                  ? "e.g. Customer no longer needs the items"
                  : isMissedDelivery 
                  ? "e.g. Delivery truck broke down"
                  : "e.g. Driver picked up the order"
              }
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {isReasonRequired && !reason.trim() && (
              <p className="text-xs text-red-500 mt-1">
                 A reason is required to {pendingAction.status === "deleted" ? "delete" : pendingAction.status === "cancelled" ? "cancel" : "miss deadline for"} this order.
              </p>
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
                disabled={submitting || (isReasonRequired && !reason.trim())}
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
