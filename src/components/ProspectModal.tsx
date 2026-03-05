import { useMemo, useState } from "react";
import type { Lead } from "../types";

/**
 * New scoring format from Nate's framework:
 * {
 *   criteria: {
 *     education: { score: 6, max: 15, reasoning: "..." },
 *     companyPedigree: { score: 5, max: 25, reasoning: "..." },
 *     experienceQuality: { score: 15, max: 30, reasoning: "..." },
 *     tenureStability: { score: 11, max: 15, reasoning: "..." },
 *     proxySignals: { score: 4, max: 15, reasoning: "..." }
 *   },
 *   summary: "1-2 sentence assessment"
 * }
 *
 * Also supports legacy format with startupFit/experienceDepth/etc.
 */

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

// Legacy format
interface LegacyFitAnalysis {
  criteria: {
    startupFit: number;
    experienceDepth: number;
    technicalBreadth: number;
    growthTrajectory: number;
    locationMatch: number;
  };
  summary: string;
}

const NEW_CRITERIA_ORDER: { key: keyof NewFitAnalysis["criteria"]; label: string }[] = [
  { key: "education", label: "Education" },
  { key: "companyPedigree", label: "Company Pedigree" },
  { key: "experienceQuality", label: "Experience Quality" },
  { key: "tenureStability", label: "Tenure & Stability" },
  { key: "proxySignals", label: "Proxy Signals" },
];

const LEGACY_LABELS: Record<string, string> = {
  startupFit: "Startup Fit",
  experienceDepth: "Experience Depth",
  technicalBreadth: "Technical Breadth",
  growthTrajectory: "Growth Trajectory",
  locationMatch: "Location Match",
};

function barGradient(pct: number): string {
  if (pct >= 70) return "linear-gradient(90deg, #818cf8, #7c3aed)";
  if (pct >= 40) return "linear-gradient(90deg, #94a3b8, #64748b)";
  return "linear-gradient(90deg, #fda4af, #e11d48)";
}

function ringStrokeColor(score: number): string {
  if (score >= 65) return "url(#ringGradHigh)";
  if (score >= 35) return "url(#ringGradMid)";
  return "url(#ringGradLow)";
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

type ParsedAnalysis =
  | { type: "new"; data: NewFitAnalysis }
  | { type: "legacy"; data: LegacyFitAnalysis }
  | null;

function parseAnalysis(fitAnalysis: string | null, fitScore: number | null): ParsedAnalysis {
  if (!fitAnalysis) return null;

  try {
    const parsed = JSON.parse(fitAnalysis);
    if (parsed.criteria) {
      // Check if it's the new format (criteria values are objects with score/max)
      const firstVal = Object.values(parsed.criteria)[0];
      if (firstVal && typeof firstVal === "object" && "score" in (firstVal as Record<string, unknown>)) {
        return { type: "new", data: parsed as NewFitAnalysis };
      }
      // Legacy format (criteria values are plain numbers)
      if (parsed.summary) {
        return { type: "legacy", data: parsed as LegacyFitAnalysis };
      }
    }
  } catch {
    // not JSON
  }

  // Fallback: derive legacy from fitScore
  if (fitScore == null) return null;
  const vary = (base: number, offset: number) => Math.max(20, Math.min(100, base + offset));
  return {
    type: "legacy",
    data: {
      criteria: {
        startupFit: vary(fitScore, -8),
        experienceDepth: vary(fitScore, 5),
        technicalBreadth: vary(fitScore, -3),
        growthTrajectory: vary(fitScore, 2),
        locationMatch: vary(fitScore, 12),
      },
      summary: fitAnalysis,
    },
  };
}

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && text && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-[11px] leading-relaxed text-gray-100 bg-gray-800 rounded-lg shadow-lg whitespace-normal max-w-[280px] z-50 pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-800" />
        </span>
      )}
    </span>
  );
}

function RingProgress({ score, size = 64, strokeWidth = 5 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width={size} height={size} className="shrink-0" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.08))" }}>
      <defs>
        <linearGradient id="ringGradHigh" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="ringGradMid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="ringGradLow" x1="0%" y1="0%" x2="100%" y2="100%">
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
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="font-bold" style={{ fontSize: "18px", fill: "#1f2937" }}>
        {score}
      </text>
    </svg>
  );
}

function NewCriteriaSection({ data }: { data: NewFitAnalysis }) {
  return (
    <div className="space-y-3">
      {NEW_CRITERIA_ORDER.map(({ key, label }) => {
        const c = data.criteria[key];
        if (!c) return null;
        const pct = Math.round((c.score / c.max) * 100);
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="text-[11px] text-gray-400 font-medium w-[120px] shrink-0">{label}</span>
            <div className="flex-1 h-1 bg-gray-100/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: barGradient(pct), transition: "width 0.5s ease" }}
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
  );
}

function LegacyCriteriaSection({ data }: { data: LegacyFitAnalysis }) {
  return (
    <div className="space-y-3">
      {(Object.entries(data.criteria) as [string, number][]).map(([key, value]) => (
        <div key={key} className="flex items-center gap-3">
          <span className="text-[11px] text-gray-400 font-medium w-[120px] shrink-0">
            {LEGACY_LABELS[key] ?? key}
          </span>
          <div className="flex-1 h-1 bg-gray-100/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${value}%`, background: barGradient(value), transition: "width 0.5s ease" }}
            />
          </div>
          <span className="text-[11px] text-gray-400 font-medium w-6 text-right tabular-nums">{value}</span>
        </div>
      ))}
    </div>
  );
}

export default function ProspectModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const name = `${lead.firstName} ${lead.lastName}`.trim();
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  const analysis = useMemo(() => parseAnalysis(lead.fitAnalysis, lead.fitScore), [lead.fitAnalysis, lead.fitScore]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[480px] max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
        >
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
              <span className="text-gray-500 text-lg font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[17px] font-bold text-gray-900">{name}</h2>
              {lead.headline && <p className="text-[13px] text-gray-500 mt-0.5 line-clamp-2">{lead.headline}</p>}
              <p className="text-[13px] text-gray-400 mt-0.5">
                {[lead.company, lead.location].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            {lead.linkedinUrl && (
              <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-[#0A66C2] text-white rounded-lg hover:bg-[#004182] transition-colors">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                View Profile
              </a>
            )}
            {lead.salesNavUrl && (
              <a href={lead.salesNavUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Sales Navigator
              </a>
            )}
            <button className="px-3 py-1.5 text-[12px] font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Launch Outreach
            </button>
            <button className="px-3 py-1.5 text-[12px] font-medium bg-white text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Move to Pipeline
            </button>
          </div>
        </div>

        {/* AI Fit Score */}
        <div className="mx-4 my-4 rounded-xl bg-gradient-to-b from-gray-50/80 to-white border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="px-6 py-6">
            {lead.fitScore != null ? (
              <div className="space-y-5">
                {/* Score Header */}
                <div className="flex items-center gap-4">
                  <RingProgress score={lead.fitScore} />
                  <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">AI Fit Score</p>
                    <p className="text-[13px] font-semibold mt-0.5" style={{ color: scoreLabelColor(lead.fitScore) }}>
                      {scoreLabel(lead.fitScore)}
                    </p>
                  </div>
                </div>

                {/* Criteria Bars — with hover tooltips on scores */}
                {analysis?.type === "new" ? (
                  <NewCriteriaSection data={analysis.data} />
                ) : analysis?.type === "legacy" ? (
                  <LegacyCriteriaSection data={analysis.data} />
                ) : null}

                {/* Summary — concise, factual */}
                {analysis && (
                  <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
                    <p className="text-[13px] text-gray-600 leading-relaxed">
                      {analysis.type === "new" ? analysis.data.summary : analysis.data.summary}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[13px] text-gray-300">Not scored yet</p>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="px-6 py-5">
          <h3 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wide mb-3">Details</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Company</p>
              <p className="text-[13px] text-gray-700 font-medium mt-0.5">{lead.company || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Location</p>
              <p className="text-[13px] text-gray-700 font-medium mt-0.5">{lead.location || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Open Profile</p>
              <p className="text-[13px] text-gray-700 font-medium mt-0.5">
                {lead.isOpenProfile ? <span className="text-emerald-500">Yes</span> : "No"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Status</p>
              <p className="text-[13px] text-gray-700 font-medium mt-0.5">{lead.stage}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
