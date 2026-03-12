import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import type { Lead } from "../types";

/* ── Score helpers (shared with ProspectModal) ─────────────────────────── */

interface CriterionScore {
  score: number;
  max: number;
  reasoning?: string;
}

interface NewFitAnalysis {
  criteria: {
    education: CriterionScore;
    companyPedigree: CriterionScore;
    experienceQuality: CriterionScore;
    tenureStability: CriterionScore;
    proxySignals: CriterionScore;
  };
  summary: string;
}

const CRITERIA_ORDER: { key: keyof NewFitAnalysis["criteria"]; label: string }[] = [
  { key: "education", label: "Education" },
  { key: "companyPedigree", label: "Company Pedigree" },
  { key: "experienceQuality", label: "Experience Quality" },
  { key: "tenureStability", label: "Tenure & Stability" },
  { key: "proxySignals", label: "Proxy Signals" },
];

function barGradient(pct: number): string {
  if (pct >= 70) return "linear-gradient(90deg, #818cf8, #7c3aed)";
  if (pct >= 40) return "linear-gradient(90deg, #94a3b8, #64748b)";
  return "linear-gradient(90deg, #fda4af, #e11d48)";
}

function ringStrokeColor(score: number): string {
  if (score >= 65) return "url(#tRingHigh)";
  if (score >= 35) return "url(#tRingMid)";
  return "url(#tRingLow)";
}

function scoreLabel(score: number): string {
  if (score >= 65) return "Strong Yes";
  if (score >= 50) return "Lean Yes";
  if (score >= 35) return "Lean No";
  return "No";
}

function scoreLabelColor(score: number): string {
  if (score >= 65) return "#7c3aed";
  if (score >= 50) return "#64748b";
  if (score >= 35) return "#f59e0b";
  return "#e11d48";
}

function parseAnalysis(fitAnalysis: string | null): NewFitAnalysis | null {
  if (!fitAnalysis) return null;
  try {
    const parsed = JSON.parse(fitAnalysis);
    if (parsed.criteria) {
      const firstVal = Object.values(parsed.criteria)[0];
      if (firstVal && typeof firstVal === "object" && "score" in (firstVal as Record<string, unknown>)) {
        return parsed as NewFitAnalysis;
      }
    }
  } catch { /* ignore */ }
  return null;
}

/* ── Ring Progress ─────────────────────────────────────────────────────── */

function RingProgress({ score, size = 72, strokeWidth = 5 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width={size} height={size} className="shrink-0">
      <defs>
        <linearGradient id="tRingHigh" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="tRingMid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="tRingLow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fda4af" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} opacity={0.5} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={ringStrokeColor(score)} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="font-bold" style={{ fontSize: "20px", fill: "#1f2937" }}>
        {score}
      </text>
    </svg>
  );
}

/* ── Tooltip ───────────────────────────────────────────────────────────── */

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLSpanElement>(null);

  const handleEnter = useCallback(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ top: rect.top + rect.height / 2, left: rect.right + 10 });
    }
    setShow(true);
  }, []);

  return (
    <span ref={ref} className="relative inline-flex" onMouseEnter={handleEnter} onMouseLeave={() => setShow(false)}>
      {children}
      {show && text && createPortal(
        <span
          className="fixed px-3 py-2 text-[11px] leading-relaxed text-gray-100 bg-gray-800 rounded-lg shadow-lg whitespace-normal w-[220px] pointer-events-none"
          style={{ top: pos.top, left: pos.left, transform: "translateY(-50%)", zIndex: 9999 }}
        >
          {text}
        </span>,
        document.body
      )}
    </span>
  );
}

/* ── Feedback Modal ────────────────────────────────────────────────────── */

function FeedbackModal({
  rating,
  onSubmit,
  onClose,
}: {
  rating: "agree" | "too_high";
  onSubmit: (text: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      onSubmit(text);
    }
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[400px] p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[15px] font-semibold text-gray-900 mb-1">
          {rating === "agree" ? "✅ Scoring looks right" : "❌ Scoring is off"}
        </h3>
        <p className="text-[12px] text-gray-400 mb-3">
          {rating === "agree" ? "What makes this candidate a good fit?" : "Why is the score wrong? What would you rate them?"}
        </p>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe why..."
          className="w-full h-24 px-3 py-2 text-[13px] border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
        />
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-[12px] text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={() => onSubmit(text)}
            className="px-4 py-1.5 text-[12px] font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Submit & Next ⌘↵
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main TinderView ───────────────────────────────────────────────────── */

export default function TinderView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [feedbackModal, setFeedbackModal] = useState<"agree" | "too_high" | null>(null);
  const [sliding, setSliding] = useState<"left" | "right" | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<number>>(new Set());

  // Fetch scored leads (page-based, fetch in chunks)
  const fetchLeads = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        score: "yes",
        limit: "50",
        page: String(page),
        sortByScore: "desc",
      });
      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      if (page === 1) {
        setLeads(data.data);
        setTotal(data.total);
      } else {
        setLeads((prev) => [...prev, ...data.data]);
      }
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads(1);
  }, [fetchLeads]);

  // Prefetch next page when nearing end
  useEffect(() => {
    if (index >= leads.length - 10 && leads.length < total) {
      const nextPage = Math.floor(leads.length / 50) + 1;
      fetchLeads(nextPage);
    }
  }, [index, leads.length, total, fetchLeads]);

  const currentLead = leads[index] ?? null;
  const analysis = useMemo(
    () => currentLead ? parseAnalysis(currentLead.fitAnalysis) : null,
    [currentLead]
  );

  const advance = useCallback(() => {
    setSliding("left");
    setTimeout(() => {
      setIndex((i) => Math.min(i + 1, leads.length - 1));
      setSliding(null);
    }, 200);
  }, [leads.length]);

  const handleVote = useCallback((rating: "agree" | "too_high") => {
    setFeedbackModal(rating);
  }, []);

  const submitFeedback = useCallback(async (text: string) => {
    if (!currentLead) return;
    const rating = feedbackModal;
    setFeedbackModal(null);

    try {
      await fetch("/api/leads/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: currentLead.id,
          rating,
          feedback: text,
        }),
      });
      setReviewedIds((prev) => new Set(prev).add(currentLead.id));
    } catch (err) {
      console.error("Feedback error:", err);
    }
    advance();
  }, [currentLead, feedbackModal, advance]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (feedbackModal) return; // Don't intercept while modal is open
      if (e.key === "ArrowLeft") handleVote("too_high");
      if (e.key === "ArrowRight") handleVote("agree");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleVote, feedbackModal]);

  if (loading && leads.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-[13px] text-gray-400">Loading scored candidates...</div>
      </div>
    );
  }

  if (!currentLead) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[15px] text-gray-600 font-medium">All done! 🎉</p>
          <p className="text-[13px] text-gray-400 mt-1">You've reviewed all scored candidates.</p>
        </div>
      </div>
    );
  }

  const name = `${currentLead.firstName} ${currentLead.lastName}`.trim();
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#f8f9fa] relative overflow-hidden">
      {/* Counter */}
      <div className="absolute top-6 right-8 text-[13px] text-gray-400 font-medium tabular-nums">
        {index + 1} / {total.toLocaleString()}
      </div>

      {/* Card */}
      <div
        className={`w-[480px] bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-200 ${
          sliding === "left" ? "opacity-0 -translate-x-16" : sliding === "right" ? "opacity-0 translate-x-16" : "opacity-100 translate-x-0"
        }`}
      >
        {/* Profile Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-3">
            <span className="text-gray-500 text-xl font-bold">{initials}</span>
          </div>
          <h2 className="text-[19px] font-bold text-gray-900">{name}</h2>
          {currentLead.headline && (
            <p className="text-[13px] text-gray-500 mt-1 line-clamp-2 max-w-[380px] mx-auto">{currentLead.headline}</p>
          )}
          {currentLead.location && (
            <p className="text-[12px] text-gray-400 mt-1">{currentLead.location}</p>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {currentLead.linkedinUrl && (
              <a href={currentLead.linkedinUrl} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-[#0A66C2] text-white rounded-lg hover:bg-[#004182] transition-colors">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                View Profile
              </a>
            )}
            {currentLead.salesNavUrl && (
              <a href={currentLead.salesNavUrl} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Sales Nav
              </a>
            )}
          </div>
        </div>

        {/* Score Section */}
        {currentLead.fitScore != null && (
          <div className="mx-5 mb-4 rounded-xl bg-gradient-to-b from-gray-50/80 to-white border border-gray-100">
            <div className="px-5 py-5">
              {/* Score Header */}
              <div className="flex items-center gap-4 mb-4">
                <RingProgress score={currentLead.fitScore} />
                <div>
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">AI Fit Score</p>
                  <p className="text-[14px] font-semibold mt-0.5" style={{ color: scoreLabelColor(currentLead.fitScore) }}>
                    {scoreLabel(currentLead.fitScore)}
                  </p>
                </div>
              </div>

              {/* Criteria Bars */}
              {analysis && (
                <div className="space-y-2.5">
                  {CRITERIA_ORDER.map(({ key, label }) => {
                    const c = analysis.criteria[key];
                    if (!c) return null;
                    const pct = Math.round((c.score / c.max) * 100);
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-[11px] text-gray-400 font-medium w-[120px] shrink-0">{label}</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: barGradient(pct) }}
                          />
                        </div>
                        <Tooltip text={c.reasoning || ""}>
                          <span className="text-[11px] text-gray-500 font-medium w-[42px] text-right tabular-nums cursor-default hover:text-gray-900 transition-colors">
                            {c.score}/{c.max}
                          </span>
                        </Tooltip>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Summary */}
              {analysis?.summary && (
                <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 mt-4">
                  <p className="text-[12px] text-gray-600 leading-relaxed">{analysis.summary}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vote Buttons */}
        <div className="px-6 pb-6 pt-2">
          <div className="flex items-center justify-center gap-8">
            {/* Reject */}
            <button
              onClick={() => handleVote("too_high")}
              className="group w-14 h-14 rounded-full border-2 border-red-200 bg-white flex items-center justify-center hover:bg-red-50 hover:border-red-400 hover:scale-110 active:scale-95 transition-all duration-150 shadow-sm"
              title="Score is wrong (←)"
            >
              <svg className="w-6 h-6 text-red-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Keyboard hint */}
            <div className="text-[10px] text-gray-300 text-center">
              <span>← →</span>
            </div>

            {/* Approve */}
            <button
              onClick={() => handleVote("agree")}
              className="group w-14 h-14 rounded-full border-2 border-emerald-200 bg-white flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-400 hover:scale-110 active:scale-95 transition-all duration-150 shadow-sm"
              title="Score looks right (→)"
            >
              <svg className="w-6 h-6 text-emerald-400 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Reviewed indicator */}
      {reviewedIds.has(currentLead.id) && (
        <div className="mt-3 text-[11px] text-emerald-500 font-medium">✓ Already reviewed</div>
      )}

      {/* Feedback Modal */}
      {feedbackModal && (
        <FeedbackModal
          rating={feedbackModal}
          onSubmit={submitFeedback}
          onClose={() => { setFeedbackModal(null); advance(); }}
        />
      )}
    </div>
  );
}
