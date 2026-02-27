import { useState, useMemo } from "react";

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

const MOCK_PROSPECTS: Prospect[] = [
  { id: "p1", name: "Jordan Mitchell", score: 94, title: "Senior Software Engineer", company: "Google", tenure: "3y 2m", location: "NYC", connected: true, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "https://linkedin.com/in/jordanm", category: "Big Tech" },
  { id: "p2", name: "Priya Sharma", score: 91, title: "Staff Engineer", company: "Meta", tenure: "2y 8m", location: "NYC", connected: false, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "https://linkedin.com/in/priyas", category: "Big Tech" },
  { id: "p3", name: "Marcus Chen", score: 89, title: "Principal Engineer", company: "Stripe", tenure: "4y 1m", location: "Brooklyn, NY", connected: true, teamConnected: true, lastContacted: "2d ago", stage: "Contacted", linkedinUrl: "https://linkedin.com/in/marcusc", category: "Fintech" },
  { id: "p4", name: "Emily Rodriguez", score: 87, title: "Engineering Manager", company: "Datadog", tenure: "1y 6m", location: "NYC", connected: false, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "https://linkedin.com/in/emilyr", category: "DevTools" },
  { id: "p5", name: "Alex Kim", score: 85, title: "Senior Backend Engineer", company: "Coinbase", tenure: "2y 3m", location: "Manhattan, NY", connected: false, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "https://linkedin.com/in/alexk", category: "Crypto" },
  { id: "p6", name: "Sarah Thompson", score: 83, title: "Lead Software Engineer", company: "Figma", tenure: "3y 0m", location: "NYC", connected: true, teamConnected: false, lastContacted: "1w ago", stage: "Replied", linkedinUrl: "https://linkedin.com/in/saraht", category: "Design Tools" },
  { id: "p7", name: "David Park", score: 82, title: "Senior Full Stack Dev", company: "Vercel", tenure: "1y 9m", location: "Brooklyn, NY", connected: false, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "https://linkedin.com/in/davidp", category: "DevTools" },
  { id: "p8", name: "Lisa Wang", score: 80, title: "Staff Platform Engineer", company: "Netflix", tenure: "5y 2m", location: "NYC", connected: true, teamConnected: true, lastContacted: "3d ago", stage: "Contacted", linkedinUrl: "https://linkedin.com/in/lisaw", category: "Big Tech" },
  { id: "p9", name: "James Foster", score: 78, title: "Senior DevOps Engineer", company: "Cloudflare", tenure: "2y 1m", location: "NYC", connected: false, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "https://linkedin.com/in/jamesf", category: "Infrastructure" },
  { id: "p10", name: "Nina Patel", score: 76, title: "Software Engineer III", company: "Amazon", tenure: "3y 7m", location: "NYC", connected: false, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "https://linkedin.com/in/ninap", category: "Big Tech" },
  { id: "p11", name: "Ryan O'Brien", score: 74, title: "Senior Frontend Engineer", company: "Spotify", tenure: "2y 5m", location: "Manhattan, NY", connected: true, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "https://linkedin.com/in/ryano", category: "Media" },
  { id: "p12", name: "Amanda Liu", score: 72, title: "ML Engineer", company: "OpenAI", tenure: "1y 2m", location: "NYC", connected: false, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "https://linkedin.com/in/amandal", category: "AI/ML" },
  { id: "p13", name: "Carlos Mendez", score: 70, title: "Senior SRE", company: "Datadog", tenure: "2y 11m", location: "Brooklyn, NY", connected: false, teamConnected: true, lastContacted: null, stage: "New", linkedinUrl: "https://linkedin.com/in/carlosm", category: "DevTools" },
  { id: "p14", name: "Olivia Brown", score: 68, title: "Software Engineer II", company: "Shopify", tenure: "1y 8m", location: "NYC", connected: false, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "https://linkedin.com/in/oliviab", category: "E-commerce" },
  { id: "p15", name: "Tom Nguyen", score: 92, title: "Distinguished Engineer", company: "MongoDB", tenure: "6y 4m", location: "NYC", connected: true, teamConnected: false, lastContacted: "5d ago", stage: "Contacted", linkedinUrl: "https://linkedin.com/in/tomn", category: "Database" },
  { id: "p16", name: "Rachel Adams", score: 88, title: "VP Engineering", company: "Notion", tenure: "2y 0m", location: "NYC", connected: false, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "https://linkedin.com/in/rachela", category: "Productivity" },
  { id: "p17", name: "Kevin Lee", score: 79, title: "Senior Systems Engineer", company: "Palantir", tenure: "3y 3m", location: "NYC", connected: false, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "https://linkedin.com/in/kevinl", category: "Data" },
  { id: "p18", name: "Michelle Torres", score: 86, title: "Tech Lead", company: "Square", tenure: "2y 7m", location: "Manhattan, NY", connected: true, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "https://linkedin.com/in/michellet", category: "Fintech" },
  { id: "p19", name: "Daniel Wright", score: 71, title: "Senior Backend Dev", company: "Twilio", tenure: "1y 11m", location: "NYC", connected: false, teamConnected: false, lastContacted: null, stage: "New", linkedinUrl: "https://linkedin.com/in/danielw", category: "Communications" },
  { id: "p20", name: "Sophie Martin", score: 90, title: "Principal Software Engineer", company: "Bloomberg", tenure: "7y 1m", location: "NYC", connected: true, teamConnected: true, lastContacted: "1d ago", stage: "Replied", linkedinUrl: "https://linkedin.com/in/sophiem", category: "Finance" },
];

function ScorePill({ score }: { score: number }) {
  if (score >= 85) return <span className="inline-flex items-center justify-center min-w-[36px] px-2 py-0.5 rounded-full text-[12px] font-semibold bg-emerald-50 text-emerald-600">{score}</span>;
  if (score >= 70) return <span className="inline-flex items-center justify-center min-w-[36px] px-2 py-0.5 rounded-full text-[12px] font-semibold bg-amber-50 text-amber-600">{score}</span>;
  return <span className="inline-flex items-center justify-center min-w-[36px] px-2 py-0.5 rounded-full text-[12px] font-semibold bg-gray-100 text-gray-500">{score}</span>;
}

function StageBadge({ stage }: { stage: string }) {
  const styles: Record<string, string> = {
    "New": "bg-gray-50 text-gray-500",
    "Contacted": "bg-blue-50 text-blue-500",
    "Replied": "bg-emerald-50 text-emerald-500",
    "Interviewing": "bg-violet-50 text-violet-500",
  };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${styles[stage] || styles["New"]}`}>{stage}</span>;
}

function Avatar({ name, company }: { name: string; company: string }) {
  const companyColors: Record<string, string> = {
    "Google": "bg-blue-500", "Meta": "bg-blue-600", "Stripe": "bg-violet-500", "Datadog": "bg-purple-500",
    "Coinbase": "bg-blue-500", "Figma": "bg-rose-400", "Vercel": "bg-gray-900", "Netflix": "bg-red-500",
    "Cloudflare": "bg-orange-500", "Amazon": "bg-amber-500", "Spotify": "bg-green-500", "OpenAI": "bg-gray-800",
    "Shopify": "bg-green-600", "MongoDB": "bg-emerald-600", "Notion": "bg-gray-900", "Palantir": "bg-gray-700",
    "Square": "bg-gray-900", "Twilio": "bg-red-400", "Bloomberg": "bg-gray-800",
  };
  const bg = companyColors[company] || "bg-indigo-500";
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2);
  return (
    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
      <span className="text-white text-[11px] font-bold tracking-tight">{initials}</span>
    </div>
  );
}

function LinkedInIcon() {
  return (
    <a className="inline-flex items-center justify-center w-7 h-7 rounded bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 transition-colors cursor-pointer" onClick={e => e.stopPropagation()}>
      <svg className="w-3.5 h-3.5 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    </a>
  );
}

function MoreIcon() {
  return (
    <button className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600" onClick={e => e.stopPropagation()}>
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
    </button>
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
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(p => p.id)));
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const total = 72431;
  const scored = MOCK_PROSPECTS.length;
  const high = MOCK_PROSPECTS.filter(p => p.score >= 85).length;
  const contacted = MOCK_PROSPECTS.filter(p => p.stage === "Contacted").length;
  const replied = MOCK_PROSPECTS.filter(p => p.stage === "Replied").length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Macro stats */}
      <div className="px-8 pt-5 pb-2">
        <p className="text-[14px] text-gray-400">
          · {total.toLocaleString()} engineers · {scored} scored · {high} fit 85+ · {contacted} contacted · {replied} replied
        </p>
      </div>

      {/* Tabs */}
      <div className="px-8 flex items-center gap-5 border-b border-gray-100">
        <button className="text-[13px] font-medium text-emerald-500 pb-2.5 border-b-2 border-emerald-500">All</button>
        <button className="text-[13px] font-medium text-gray-400 pb-2.5 border-b-2 border-transparent hover:text-gray-500">+ Save as new view</button>
        <div className="flex-1" />
        <button className="text-[13px] text-gray-400 pb-2.5">Saved views</button>
      </div>

      {/* Search + toolbar */}
      <div className="px-8 py-3 flex items-center gap-3">
        <div className="relative max-w-[260px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search engineers..." className="w-full pl-9 pr-3 py-[7px] text-[13px] bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300" />
        </div>

        <div className="flex-1" />

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2 mr-2">
            <span className="text-[13px] text-gray-400">{selected.size} selected</span>
            <button className="px-3 py-1.5 text-[12px] font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Launch Outreach
            </button>
          </div>
        )}

        {/* Filters */}
        <select value={scoreFilter} onChange={e => setScoreFilter(e.target.value as any)} className="px-2.5 py-[7px] text-[12px] bg-white border border-gray-200 rounded-lg text-gray-500 focus:outline-none cursor-pointer">
          <option value="all">All scores</option>
          <option value="85+">85+</option>
          <option value="70+">70+</option>
          <option value="below70">Below 70</option>
        </select>
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value as any)} className="px-2.5 py-[7px] text-[12px] bg-white border border-gray-200 rounded-lg text-gray-500 focus:outline-none cursor-pointer">
          <option value="all">All stages</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Replied">Replied</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="px-2.5 py-[7px] text-[12px] bg-white border border-gray-200 rounded-lg text-gray-500 focus:outline-none cursor-pointer">
          <option value="score">Sort: Score ↓</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-8">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-3 pr-3 text-left w-10">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer w-3.5 h-3.5" />
              </th>
              <th className="py-3 pr-4 text-left text-[11px] font-medium text-gray-400 uppercase tracking-[0.05em]">Engineer</th>
              <th className="py-3 pr-4 text-left text-[11px] font-medium text-gray-400 uppercase tracking-[0.05em]">Score</th>
              <th className="py-3 pr-4 text-left text-[11px] font-medium text-gray-400 uppercase tracking-[0.05em]">Current Title</th>
              <th className="py-3 pr-4 text-left text-[11px] font-medium text-gray-400 uppercase tracking-[0.05em]">Company</th>
              <th className="py-3 pr-4 text-left text-[11px] font-medium text-gray-400 uppercase tracking-[0.05em]">Tenure</th>
              <th className="py-3 pr-4 text-center text-[11px] font-medium text-gray-400 uppercase tracking-[0.05em]">Connected</th>
              <th className="py-3 pr-4 text-center text-[11px] font-medium text-gray-400 uppercase tracking-[0.05em]">Team</th>
              <th className="py-3 pr-4 text-left text-[11px] font-medium text-gray-400 uppercase tracking-[0.05em]">Last Contacted</th>
              <th className="py-3 pr-4 text-left text-[11px] font-medium text-gray-400 uppercase tracking-[0.05em]">Status</th>
              <th className="py-3 text-center text-[11px] font-medium text-gray-400 uppercase tracking-[0.05em]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer group ${selected.has(p.id) ? "bg-indigo-50/30" : ""}`} onClick={() => toggleOne(p.id)}>
                <td className="py-3.5 pr-3">
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} onClick={e => e.stopPropagation()} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer w-3.5 h-3.5" />
                </td>
                <td className="py-3.5 pr-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={p.name} company={p.company} />
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900 leading-tight">{p.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{p.category}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 pr-4"><ScorePill score={p.score} /></td>
                <td className="py-3.5 pr-4 text-[13px] text-gray-500 max-w-[180px] truncate">{p.title}</td>
                <td className="py-3.5 pr-4 text-[13px] text-gray-700 font-medium">{p.company}</td>
                <td className="py-3.5 pr-4 text-[13px] text-emerald-500 font-medium tabular-nums">{p.tenure}</td>
                <td className="py-3.5 pr-4 text-center">
                  {p.connected ? (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50">
                      <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-300">—</span>
                  )}
                </td>
                <td className="py-3.5 pr-4 text-center">
                  {p.teamConnected ? (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50">
                      <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-300">—</span>
                  )}
                </td>
                <td className="py-3.5 pr-4 text-[13px] text-gray-400">{p.lastContacted || <span className="text-gray-300">Never</span>}</td>
                <td className="py-3.5 pr-4"><StageBadge stage={p.stage} /></td>
                <td className="py-3.5">
                  <div className="flex items-center justify-center gap-1">
                    <LinkedInIcon />
                    <MoreIcon />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-[13px]">No engineers match your filters</div>
        )}
      </div>
    </div>
  );
}
