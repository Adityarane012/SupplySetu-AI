"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface ReasonModalProps {
  title: string;
  reasonRequired: boolean;
  placeholder: string;
  requiredMessage: string;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
}

export default function ReasonModal({
  title,
  reasonRequired,
  placeholder,
  requiredMessage,
  onConfirm,
  onClose,
}: ReasonModalProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (reasonRequired && !reason.trim()) return;
    setSubmitting(true);
    try {
      await onConfirm(reason.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-gray-800">{title}</h4>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <label className="text-sm text-gray-600 mb-2 block">
          Why? {reasonRequired ? "(required)" : "(optional — captured as intent in the history log)"}
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {reasonRequired && !reason.trim() && (
          <p className="text-xs text-red-500 mt-1">{requiredMessage}</p>
        )}
        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-600 font-medium text-sm hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting || (reasonRequired && !reason.trim())}
            className="px-4 py-2 rounded-lg text-white font-medium text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
