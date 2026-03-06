import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface FeedbackItem {
  id: number;
  leadId: number;
  feedback: string;
  rating: string | null;
  createdAt: string;
}

interface FeedbackPopupProps {
  leadId: number;
  leadName: string;
  anchorRect: DOMRect;
  onClose: () => void;
  onSubmitted: () => void;
}

const RATING_OPTIONS = [
  { value: "", label: "Select rating..." },
  { value: "agree", label: "Score is right" },
  { value: "too_high", label: "Score too high" },
  { value: "too_low", label: "Score too low" },
  { value: "wrong_fit", label: "Wrong fit entirely" },
];

const RATING_LABELS: Record<string, string> = {
  agree: "Score is right",
  too_high: "Score too high",
  too_low: "Score too low",
  wrong_fit: "Wrong fit entirely",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function FeedbackPopup({ leadId, leadName, anchorRect, onClose, onSubmitted }: FeedbackPopupProps) {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/leads/feedback?leadId=${leadId}`)
      .then((r) => r.json())
      .then((d) => setItems(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [leadId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  async function handleSubmit() {
    if (!feedback.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, feedback: feedback.trim(), rating: rating || null }),
      });
      const d = await res.json();
      if (d.ok && d.data) {
        setItems((prev) => [d.data, ...prev]);
        setFeedback("");
        setRating("");
        onSubmitted();
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  }

  // Position: below and to the right of the anchor
  const top = anchorRect.bottom + 6;
  const left = Math.min(anchorRect.left, window.innerWidth - 340);

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[100] w-[320px] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
      style={{ top, left }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-gray-900 truncate">{leadName}</p>
        <button
          onClick={onClose}
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Form */}
      <div className="px-4 py-3 space-y-2.5 border-b border-gray-100">
        <select
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          className="w-full px-2.5 py-[6px] text-[12px] bg-gray-50 border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
        >
          {RATING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Add feedback..."
          rows={2}
          className="w-full px-2.5 py-2 text-[12px] bg-gray-50 border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 resize-none"
        />
        <button
          onClick={handleSubmit}
          disabled={!feedback.trim() || submitting}
          className="w-full px-3 py-1.5 text-[12px] font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit Feedback"}
        </button>
      </div>

      {/* Existing feedback */}
      <div className="max-h-[200px] overflow-y-auto">
        {loading ? (
          <p className="px-4 py-3 text-[12px] text-gray-400">Loading...</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-3 text-[12px] text-gray-400">No feedback yet</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="px-4 py-2.5 border-b border-gray-50 last:border-b-0">
              {item.rating && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 mb-1">
                  {RATING_LABELS[item.rating] || item.rating}
                </span>
              )}
              <p className="text-[12px] text-gray-700 leading-relaxed">{item.feedback}</p>
              <p className="text-[10px] text-gray-400 mt-1">{timeAgo(item.createdAt)}</p>
            </div>
          ))
        )}
      </div>
    </div>,
    document.body
  );
}

// Small button component for reuse in both ProspectList and ProspectModal
export function FeedbackButton({
  leadId,
  leadName,
  feedbackCount,
  onCountChange,
}: {
  leadId: number;
  leadName: string;
  feedbackCount?: number;
  onCountChange?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (btnRef.current) {
      setRect(btnRef.current.getBoundingClientRect());
    }
    setOpen((prev) => !prev);
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleClick}
        className="relative inline-flex items-center justify-center w-7 h-7 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
        title="Feedback"
      >
        <span className="text-[14px]">💬</span>
        {(feedbackCount ?? 0) > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-emerald-500 text-white text-[9px] font-bold px-0.5">
            {feedbackCount}
          </span>
        )}
      </button>
      {open && rect && (
        <FeedbackPopup
          leadId={leadId}
          leadName={leadName}
          anchorRect={rect}
          onClose={() => setOpen(false)}
          onSubmitted={() => onCountChange?.()}
        />
      )}
    </>
  );
}
