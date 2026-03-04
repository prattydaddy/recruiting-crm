import type { Lead } from "../types";

export default function ProspectModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const name = `${lead.firstName} ${lead.lastName}`.trim();
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-[480px] max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
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
              {lead.headline && (
                <p className="text-[13px] text-gray-500 mt-0.5 line-clamp-2">{lead.headline}</p>
              )}
              <p className="text-[13px] text-gray-400 mt-0.5">
                {[lead.company, lead.location].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            {lead.linkedinUrl && (
              <a
                href={lead.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-[#0A66C2] text-white rounded-lg hover:bg-[#004182] transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                View Profile
              </a>
            )}
            {lead.salesNavUrl && (
              <a
                href={lead.salesNavUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
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
        <div className="px-6 py-5 border-b border-gray-100">
          {lead.fitScore != null ? (
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${lead.fitScore >= 80 ? "bg-emerald-50" : lead.fitScore >= 50 ? "bg-amber-50" : "bg-red-50"}`}>
                <span className={`text-[22px] font-bold ${lead.fitScore >= 80 ? "text-emerald-600" : lead.fitScore >= 50 ? "text-amber-600" : "text-red-600"}`}>
                  {lead.fitScore}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-400 uppercase tracking-wide">AI Fit Score</p>
                {lead.fitAnalysis && (
                  <p className="text-[13px] text-gray-600 leading-relaxed mt-1">{lead.fitAnalysis}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-gray-300 italic">Not scored yet</p>
          )}
        </div>

        {/* Headline section */}
        {lead.headline && (
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wide mb-2">
              Headline
            </h3>
            <p className="text-[13px] text-gray-600 leading-relaxed">{lead.headline}</p>
          </div>
        )}

        {/* Details */}
        <div className="px-6 py-5">
          <h3 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wide mb-3">
            Details
          </h3>
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
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Segment</p>
              <p className="text-[13px] text-gray-700 font-medium mt-0.5">
                {lead.segment.replace("segment-", "").toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Open Profile</p>
              <p className="text-[13px] text-gray-700 font-medium mt-0.5">
                {lead.isOpenProfile ? (
                  <span className="text-emerald-500">Yes</span>
                ) : (
                  "No"
                )}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Status</p>
              <p className="text-[13px] text-gray-700 font-medium mt-0.5">{lead.stage}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">LinkedIn ID</p>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5 truncate">
                {lead.linkedinId || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
