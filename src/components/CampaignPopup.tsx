import { useState, useEffect } from "react";
import type { Campaign } from "../types";

interface CampaignPopupProps {
  leadCount: number;
  onClose: () => void;
  onAdd: (campaignId: number) => Promise<void>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-gray-100 text-gray-500",
    active: "bg-emerald-50 text-emerald-600",
    paused: "bg-amber-50 text-amber-600",
    completed: "bg-blue-50 text-blue-600",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
}

export default function CampaignPopup({ leadCount, onClose, onAdd }: CampaignPopupProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data) => {
        setCampaigns(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleCreateAndAdd() {
    if (!newName.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await onAdd(data.data.id);
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddToExisting() {
    if (!selectedId) return;
    setSubmitting(true);
    setError("");
    try {
      await onAdd(selectedId);
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add leads");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-gray-900">
              Add {leadCount.toLocaleString()} lead{leadCount !== 1 ? "s" : ""} to sequence
            </h2>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Success state */}
        {success && (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-[14px] font-medium text-gray-900">
              {leadCount.toLocaleString()} lead{leadCount !== 1 ? "s" : ""} added to sequence
            </p>
          </div>
        )}

        {!success && (
          <>
            {/* Existing campaigns */}
            <div className="px-6 py-4 max-h-[280px] overflow-y-auto">
              {loading ? (
                <p className="text-[13px] text-gray-400 text-center py-4">Loading sequences...</p>
              ) : campaigns.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
                    Existing sequences
                  </p>
                  {campaigns.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                        selectedId === c.id
                          ? "border-emerald-300 bg-emerald-50/50 ring-1 ring-emerald-200"
                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-gray-800">{c.name}</span>
                          <StatusBadge status={c.status} />
                        </div>
                        <span className="text-[12px] text-gray-400">
                          {c.leadCount} lead{c.leadCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-gray-400 text-center py-2">No sequences yet</p>
              )}
            </div>

            {/* Divider */}
            <div className="px-6">
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-gray-100" />
                <span className="text-[11px] text-gray-400 font-medium">OR CREATE NEW</span>
                <div className="flex-1 border-t border-gray-100" />
              </div>
            </div>

            {/* Create new */}
            <div className="px-6 py-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateAndAdd()}
                  placeholder="Sequence name..."
                  className="flex-1 px-3 py-2 text-[13px] border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
                />
                <button
                  onClick={handleCreateAndAdd}
                  disabled={!newName.trim() || submitting}
                  className="px-3 py-2 text-[12px] font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Create & Add
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="px-6 pb-2">
                <p className="text-[12px] text-red-500">{error}</p>
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={handleAddToExisting}
                disabled={!selectedId || submitting}
                className="w-full py-2.5 text-[13px] font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span>Adding...</span>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add to Sequence
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
