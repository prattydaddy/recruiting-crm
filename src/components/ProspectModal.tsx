interface Prospect {
  id: string;
  name: string;
  score: number;
  title: string;
  company: string;
  tenure: string;
  location: string;
  connected: boolean;
  teamConnected: boolean;
  lastContacted: string | null;
  stage: string;
  linkedinUrl: string;
  category: string;
}

function getScoreBreakdown(score: number) {
  // Deterministic breakdown based on score
  return {
    overall: score,
    experience: Math.min(100, Math.max(40, score + 3)),
    skillMatch: Math.min(100, Math.max(40, score - 2)),
    companyFit: Math.min(100, Math.max(40, score + 5)),
    seniority: Math.min(100, Math.max(40, score - 4)),
    locationFit: Math.min(100, Math.max(40, score + 1)),
  };
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  const color = value >= 85 ? "bg-emerald-400" : value >= 70 ? "bg-amber-400" : "bg-gray-300";
  const textColor = value >= 85 ? "text-emerald-600" : value >= 70 ? "text-amber-600" : "text-gray-400";
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] text-gray-500 w-[100px] shrink-0">{label}</span>
      <div className="flex-1 h-[5px] rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-[12px] font-semibold tabular-nums w-7 text-right ${textColor}`}>{value}</span>
    </div>
  );
}

const PHOTO_MAP: Record<string, string> = {
  p1: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=face",
  p2: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=face",
  p3: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&h=160&fit=crop&crop=face",
  p4: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&h=160&fit=crop&crop=face",
  p5: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=face",
  p6: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=face",
  p7: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&h=160&fit=crop&crop=face",
  p8: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&h=160&fit=crop&crop=face",
  p9: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=160&h=160&fit=crop&crop=face",
  p10: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop&crop=face",
  p11: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=160&h=160&fit=crop&crop=face",
  p12: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=160&h=160&fit=crop&crop=face",
  p13: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=160&h=160&fit=crop&crop=face",
  p14: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=160&h=160&fit=crop&crop=face",
  p15: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=160&h=160&fit=crop&crop=face",
  p16: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=160&h=160&fit=crop&crop=face",
  p17: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=160&h=160&fit=crop&crop=face",
  p18: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=160&h=160&fit=crop&crop=face",
  p19: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=160&h=160&fit=crop&crop=face",
  p20: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=160&h=160&fit=crop&crop=face",
};

export default function ProspectModal({ prospect, onClose }: { prospect: Prospect; onClose: () => void }) {
  const breakdown = getScoreBreakdown(prospect.score);
  const photo = PHOTO_MAP[prospect.id];
  const overallColor = prospect.score >= 85 ? "text-emerald-600" : prospect.score >= 70 ? "text-amber-600" : "text-gray-400";
  const overallBg = prospect.score >= 85 ? "bg-emerald-50 ring-emerald-200" : prospect.score >= 70 ? "bg-amber-50 ring-amber-200" : "bg-gray-50 ring-gray-200";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[480px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10">
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="px-6 pt-6 pb-5 border-b border-gray-100">
          <div className="flex items-start gap-4">
            {photo ? (
              <img src={photo} alt={prospect.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                <span className="text-gray-500 text-lg font-bold">{prospect.name.split(" ").map(n => n[0]).join("")}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-[17px] font-bold text-gray-900">{prospect.name}</h2>
              <p className="text-[13px] text-gray-500 mt-0.5">{prospect.title}</p>
              <p className="text-[13px] text-gray-400 mt-0.5">{prospect.company} · {prospect.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <a href={prospect.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-[#0A66C2] text-white rounded-lg hover:bg-[#004182] transition-colors">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              View Profile
            </a>
            <button className="px-3 py-1.5 text-[12px] font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Launch Outreach
            </button>
            <button className="px-3 py-1.5 text-[12px] font-medium bg-white text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Move to Pipeline
            </button>
          </div>
        </div>

        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wide">AI Fit Score</h3>
            <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ring-1 ring-inset ${overallBg}`}>
              <span className={`text-[18px] font-bold tabular-nums ${overallColor}`}>{breakdown.overall}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <ScoreRow label="Experience" value={breakdown.experience} />
            <ScoreRow label="Skill Match" value={breakdown.skillMatch} />
            <ScoreRow label="Company Fit" value={breakdown.companyFit} />
            <ScoreRow label="Seniority" value={breakdown.seniority} />
            <ScoreRow label="Location Fit" value={breakdown.locationFit} />
          </div>
        </div>

        <div className="px-6 py-5">
          <h3 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wide mb-3">Details</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Company</p>
              <p className="text-[13px] text-gray-700 font-medium mt-0.5">{prospect.company}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Category</p>
              <p className="text-[13px] text-gray-700 font-medium mt-0.5">{prospect.category}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Tenure</p>
              <p className="text-[13px] text-emerald-500 font-medium mt-0.5">{prospect.tenure}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Location</p>
              <p className="text-[13px] text-gray-700 font-medium mt-0.5">{prospect.location}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Connected</p>
              <p className="text-[13px] text-gray-700 font-medium mt-0.5">{prospect.connected ? "Yes ✓" : "No"}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Team Connected</p>
              <p className="text-[13px] text-gray-700 font-medium mt-0.5">{prospect.teamConnected ? "Yes ✓" : "No"}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Last Contacted</p>
              <p className="text-[13px] text-gray-700 font-medium mt-0.5">{prospect.lastContacted || "Never"}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">Stage</p>
              <p className="text-[13px] text-gray-700 font-medium mt-0.5">{prospect.stage}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
