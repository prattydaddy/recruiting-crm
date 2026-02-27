import { useState, useMemo } from "react";

interface Prospect {
  id: string;
  name: string;
  photo: string;
  score: number;
  title: string;
  company: string;
  companyLogo: string;
  tenure: string;
  location: string;
  connected: boolean;
  teamConnected: boolean;
  lastContacted: string | null;
  stage: string;
  linkedinUrl: string;
}

const MOCK_PROSPECTS: Prospect[] = [
  { id: "p1", name: "Jordan Mitchell", photo: "", score: 94, title: "Senior Software Engineer", company: "Google", companyLogo: "", tenure: "3y 2m", location: "NYC", connected: true, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "#" },
  { id: "p2", name: "Priya Sharma", photo: "", score: 91, title: "Staff Engineer", company: "Meta", companyLogo: "", tenure: "2y 8m", location: "NYC", connected: false, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "#" },
  { id: "p3", name: "Marcus Chen", photo: "", score: 89, title: "Principal Engineer", company: "Stripe", companyLogo: "", tenure: "4y 1m", location: "Brooklyn, NY", connected: true, teamConnected: true, lastContacted: "2d ago", stage: "Contacted", linkedinUrl: "#" },
  { id: "p4", name: "Emily Rodriguez", photo: "", score: 87, title: "Engineering Manager", company: "Datadog", companyLogo: "", tenure: "1y 6m", location: "NYC", connected: false, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "#" },
  { id: "p5", name: "Alex Kim", photo: "", score: 85, title: "Senior Backend Engineer", company: "Coinbase", companyLogo: "", tenure: "2y 3m", location: "Manhattan, NY", connected: false, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "#" },
  { id: "p6", name: "Sarah Thompson", photo: "", score: 83, title: "Lead Software Engineer", company: "Figma", companyLogo: "", tenure: "3y 0m", location: "NYC", connected: true, teamConnected: false, lastContacted: "1w ago", stage: "Replied", linkedinUrl: "#" },
  { id: "p7", name: "David Park", photo: "", score: 82, title: "Senior Full Stack Dev", company: "Vercel", companyLogo: "", tenure: "1y 9m", location: "Brooklyn, NY", connected: false, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "#" },
  { id: "p8", name: "Lisa Wang", photo: "", score: 80, title: "Staff Platform Engineer", company: "Netflix", companyLogo: "", tenure: "5y 2m", location: "NYC", connected: true, teamConnected: true, lastContacted: "3d ago", stage: "Contacted", linkedinUrl: "#" },
  { id: "p9", name: "James Foster", photo: "", score: 78, title: "Senior DevOps Engineer", company: "Cloudflare", companyLogo: "", tenure: "2y 1m", location: "NYC", connected: false, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "#" },
  { id: "p10", name: "Nina Patel", photo: "", score: 76, title: "Software Engineer III", company: "Amazon", companyLogo: "", tenure: "3y 7m", location: "NYC", connected: false, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "#" },
  { id: "p11", name: "Ryan O'Brien", photo: "", score: 74, title: "Senior Frontend Engineer", company: "Spotify", companyLogo: "", tenure: "2y 5m", location: "Manhattan, NY", connected: true, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "#" },
  { id: "p12", name: "Amanda Liu", photo: "", score: 72, title: "ML Engineer", company: "OpenAI", companyLogo: "", tenure: "1y 2m", location: "NYC", connected: false, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "#" },
  { id: "p13", name: "Carlos Mendez", photo: "", score: 70, title: "Senior SRE", company: "Datadog", companyLogo: "", tenure: "2y 11m", location: "Brooklyn, NY", connected: false, teamConnected: true, lastContacted: null, stage: "New", linkedinUrl: "#" },
  { id: "p14", name: "Olivia Brown", photo: "", score: 68, title: "Software Engineer II", company: "Shopify", companyLogo: "", tenure: "1y 8m", location: "NYC", connected: false, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "#" },
  { id: "p15", name: "Tom Nguyen", photo: "", score: 92, title: "Distinguished Engineer", company: "MongoDB", companyLogo: "", tenure: "6y 4m", location: "NYC", connected: true, teamConnected: false, lastContacted: "5d ago", stage: "Contacted", linkedinUrl: "#" },
  { id: "p16", name: "Rachel Adams", photo: "", score: 88, title: "VP Engineering", company: "Notion", companyLogo: "", tenure: "2y 0m", location: "NYC", connected: false, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "#" },
  { id: "p17", name: "Kevin Lee", photo: "", score: 79, title: "Senior Systems Engineer", company: "Palantir", companyLogo: "", tenure: "3y 3m", location: "NYC", connected: false, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "#" },
  { id: "p18", name: "Michelle Torres", photo: "", score: 86, title: "Tech Lead", company: "Square", companyLogo: "", tenure: "2y 7m", location: "Manhattan, NY", connected: true, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "#" },
  { id: "p19", name: "Daniel Wright", photo: "", score: 71, title: "Senior Backend Dev", company: "Twilio", companyLogo: "", tenure: "1y 11m", location: "NYC", connected: false, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "#" },
  { id: "p20", name: "Sophie Martin", photo: "", score: 90, title: "Principal Software Engineer", company: "Bloomberg", companyLogo: "", tenure: "7y 1m", location: "NYC", connected: true, teamConnected: true, lastContacted: "1d ago", stage: "Replied", linkedinUrl: "#" },
];

function ScorePill({ score }: { score: number }) {
  const bg = score >= 85 ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : score >= 70 ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-gray-50 text-gray-500 ring-gray-200";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${bg}`}>{score}</span>;
}

function StageBadge({ stage }: { stage: string }) {
  const styles: Record<string, string> = {
    "New": "bg-gray-100 text-gray-600",
    "Contacted": "bg-blue-50 text-blue-600",
    "Replied": "bg-emerald-50 text-emerald-600",
    "Interviewing": "bg-violet-50 text-violet-600",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${styles[stage] || styles["New"]}`}>{stage}</span>;
}

function Avatar({ name }: { name: string }) {
  const colors = ["bg-indigo-500", "bg-rose-500", "bg-emerald-500", "bg-amber-500", "bg-cyan-500", "bg-violet-500", "bg-pink-500", "bg-teal-500"];
  const idx = name.charCodeAt(0) % colors.length;
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2);
  return (
    <div className={`w-8 h-8 rounded-full ${colors[idx]} flex items-center justify-center shrink-0`}>
      <span className="text-white text-[11px] font-semibold">{initials}</span>
    </div>
  );
}

export default function ProspectList() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [scoreFilter, setScoreFilter] = useState<"all" | "85+" | "70+" | "below70">("all");
  const [stageFilter, setStageFilter] = useState<"all" | "New" | "Contacted" | "Replied">("all");
  const [sortBy, setSortBy] = useState<"score" | "name" | "tenure">("score");

  const filtered = useMemo(() => {
    let list = MOCK_PROSPECTS.filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.company.toLowerCase().includes(search.toLowerCase()) && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (scoreFilter === "85+" && p.score < 85) return false;
      if (scoreFilter === "70+" && p.score < 70) return false;
      if (scoreFilter === "below70" && p.score >= 70) return false;
      if (stageFilter !== "all" && p.stage !== stageFilter) return false;
      return true;
    });
    list.sort((a, b) => {
      if (sortBy === "score") return b.score - a.score;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });
    return list;
  }, [search, scoreFilter, stageFilter, sortBy]);

  const allSelected = filtered.length > 0 && filtered.every(p => selected.has(p.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(p => p.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // Stats
  const total = 72431;
  const scored = MOCK_PROSPECTS.length;
  const high = MOCK_PROSPECTS.filter(p => p.score >= 85).length;
  const contacted = MOCK_PROSPECTS.filter(p => p.stage === "Contacted").length;
  const replied = MOCK_PROSPECTS.filter(p => p.stage === "Replied").length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Macro stats */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Total Engineers</p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{total.toLocaleString()}</p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Scored</p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{scored.toLocaleString()}</p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div>
            <p className="text-[11px] font-medium text-emerald-500 uppercase tracking-wider">Fit 85+</p>
            <p className="text-2xl font-bold text-emerald-600 tabular-nums">{high}</p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div>
            <p className="text-[11px] font-medium text-blue-500 uppercase tracking-wider">Contacted</p>
            <p className="text-2xl font-bold text-blue-600 tabular-nums">{contacted}</p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div>
            <p className="text-[11px] font-medium text-violet-500 uppercase tracking-wider">Replied</p>
            <p className="text-2xl font-bold text-violet-600 tabular-nums">{replied}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 pb-3 flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search engineers..." className="w-full pl-9 pr-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300" />
        </div>

        {/* Score filter */}
        <select value={scoreFilter} onChange={e => setScoreFilter(e.target.value as any)} className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer">
          <option value="all">All scores</option>
          <option value="85+">Score 85+</option>
          <option value="70+">Score 70+</option>
          <option value="below70">Below 70</option>
        </select>

        {/* Stage filter */}
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value as any)} className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer">
          <option value="all">All stages</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Replied">Replied</option>
        </select>

        {/* Sort */}
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer">
          <option value="score">Sort: Score</option>
          <option value="name">Sort: Name</option>
        </select>

        <div className="flex-1" />

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-gray-500">{selected.size} selected</span>
            <button className="px-3 py-1.5 text-[13px] font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Launch Outreach
            </button>
            <button className="px-3 py-1.5 text-[13px] font-medium bg-white text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Move to Pipeline
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 pr-3 text-left w-8">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer" />
              </th>
              <th className="py-2 pr-3 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider">Engineer</th>
              <th className="py-2 pr-3 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider">Score</th>
              <th className="py-2 pr-3 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider">Title</th>
              <th className="py-2 pr-3 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider">Company</th>
              <th className="py-2 pr-3 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider">Tenure</th>
              <th className="py-2 pr-3 text-center text-[11px] font-medium text-gray-400 uppercase tracking-wider">Connected</th>
              <th className="py-2 pr-3 text-center text-[11px] font-medium text-gray-400 uppercase tracking-wider">Team</th>
              <th className="py-2 pr-3 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider">Last Contacted</th>
              <th className="py-2 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider">Stage</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors cursor-pointer ${selected.has(p.id) ? "bg-indigo-50/40" : ""}`} onClick={() => toggleOne(p.id)}>
                <td className="py-2.5 pr-3">
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} onClick={e => e.stopPropagation()} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer" />
                </td>
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={p.name} />
                    <div>
                      <p className="text-[13px] font-medium text-gray-900">{p.name}</p>
                      <p className="text-[11px] text-gray-400">{p.location}</p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 pr-3"><ScorePill score={p.score} /></td>
                <td className="py-2.5 pr-3 text-[13px] text-gray-600 max-w-[200px] truncate">{p.title}</td>
                <td className="py-2.5 pr-3 text-[13px] text-gray-700 font-medium">{p.company}</td>
                <td className="py-2.5 pr-3 text-[13px] text-gray-500 tabular-nums">{p.tenure}</td>
                <td className="py-2.5 pr-3 text-center">
                  {p.connected ? (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100"><svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg></span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100"><svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></span>
                  )}
                </td>
                <td className="py-2.5 pr-3 text-center">
                  {p.teamConnected ? (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100"><svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg></span>
                  ) : (
                    <span className="text-[11px] text-gray-300">—</span>
                  )}
                </td>
                <td className="py-2.5 pr-3 text-[13px] text-gray-400">{p.lastContacted || "Never"}</td>
                <td className="py-2.5"><StageBadge stage={p.stage} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">No engineers match your filters</div>
        )}
      </div>
    </div>
  );
}
