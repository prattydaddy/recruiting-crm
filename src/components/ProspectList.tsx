import ProspectModal from "./ProspectModal";
import { FeedbackButton } from "./FeedbackPopup";
import { useState, useMemo, useEffect, useCallback } from "react";
import type { Lead, LeadsResponse, LeadsStats } from "../types";

function StageBadge({ stage }: { stage: string }) {
  const styles: Record<string, string> = {
    New: "bg-gray-50 text-gray-500",
    Contacted: "bg-blue-50 text-blue-500",
    Replied: "bg-emerald-50 text-emerald-500",
    Interviewing: "bg-violet-50 text-violet-500",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${styles[stage] || styles["New"]}`}
    >
      {stage}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
  return (
    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
      <span className="text-gray-500 text-[11px] font-bold">{initials}</span>
    </div>
  );
}

function LinkedInIcon() {
  return (
    <span className="inline-flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity">
      <svg className="w-4 h-4 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    </span>
  );
}

function MoreIcon() {
  return (
    <button
      className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
      onClick={(e) => e.stopPropagation()}
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="5" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="12" cy="19" r="1.5" />
      </svg>
    </button>
  );
}

function OpenProfileBadge({ isOpen }: { isOpen: boolean }) {
  if (!isOpen) return <span className="text-[11px] text-gray-300">&mdash;</span>;
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50">
      <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

export default function ProspectList() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [modalLead, setModalLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<"" | "New" | "Contacted" | "Replied">("");
  const [scoreFilter, setScoreFilter] = useState<"" | "yes" | "lean_yes" | "lean_no" | "no" | "unscored">("");
  const [sortByScore, setSortByScore] = useState<"" | "asc" | "desc">("");
  const [feedbackCounts, setFeedbackCounts] = useState<Record<number, number>>({});
  const LIMIT = 50;

  // Fetch feedback counts for visible leads
  const fetchFeedbackCounts = useCallback(async (leadIds: number[]) => {
    if (leadIds.length === 0) return;
    try {
      const counts: Record<number, number> = {};
      await Promise.all(
        leadIds.map(async (id) => {
          const res = await fetch(`/api/leads/feedback?leadId=${id}`);
          const data = await res.json();
          counts[id] = (data.data || []).length;
        })
      );
      setFeedbackCounts((prev) => ({ ...prev, ...counts }));
    } catch {
      // ignore
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, stageFilter, scoreFilter, sortByScore]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (stageFilter) params.set("stage", stageFilter);
      if (scoreFilter) params.set("score", scoreFilter);
      if (sortByScore) params.set("sort", sortByScore === "desc" ? "score_desc" : "score_asc");

      const res = await fetch(`/api/leads?${params}`);
      const data: LeadsResponse = await res.json();
      setLeads(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      console.error("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, stageFilter, scoreFilter, sortByScore]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Fetch feedback counts when leads load
  useEffect(() => {
    if (leads.length > 0) {
      fetchFeedbackCounts(leads.map((l) => l.id));
    }
  }, [leads, fetchFeedbackCounts]);

  // Fetch stats once on mount
  useEffect(() => {
    fetch("/api/leads/stats")
      .then((r) => r.json())
      .then((data: LeadsStats) => setStats(data))
      .catch(() => {});
  }, []);

  // No more client-side filtering — API handles it all
  const filteredAndSortedLeads = leads;

  const allSelected = filteredAndSortedLeads.length > 0 && filteredAndSortedLeads.every((l) => selected.has(l.id));

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filteredAndSortedLeads.map((l) => l.id)));
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Macro stats */}
        <div className="px-8 pt-5 pb-2">
          <p className="text-[14px] text-gray-400">
            {stats
              ? `· ${stats.total.toLocaleString()} engineers · ${stats.openProfiles.toLocaleString()} open profiles`
              : "· Loading stats..."}
          </p>
        </div>

        {/* Tabs */}
        <div className="px-8 flex items-center gap-5 border-b border-gray-100">
          <button className="text-[13px] font-medium text-emerald-500 pb-2.5 border-b-2 border-emerald-500">
            All
          </button>
          <button className="text-[13px] font-medium text-gray-400 pb-2.5 border-b-2 border-transparent hover:text-gray-500">
            + Save as new view
          </button>
          <div className="flex-1" />
          <button className="text-[13px] text-gray-400 pb-2.5">Saved views</button>
        </div>

        {/* Search + toolbar */}
        <div className="px-8 py-3 flex items-center gap-3">
          <div className="relative max-w-[260px]">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search engineers..."
              className="w-full pl-9 pr-3 py-[7px] text-[13px] bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
            />
          </div>

          <div className="flex-1" />

          {/* Bulk actions */}
          {selected.size > 0 && (
            <div className="flex items-center gap-2 mr-2">
              <span className="text-[13px] text-gray-400">{selected.size} selected</span>
              <button className="px-3 py-1.5 text-[12px] font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Launch Outreach
              </button>
            </div>
          )}

          {/* Filters */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as typeof stageFilter)}
            className="px-2.5 py-[7px] text-[12px] bg-white border border-gray-200 rounded-lg text-gray-500 focus:outline-none cursor-pointer"
          >
            <option value="">All stages</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Replied">Replied</option>
          </select>
          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value as typeof scoreFilter)}
            className="px-2.5 py-[7px] text-[12px] bg-white border border-gray-200 rounded-lg text-gray-500 focus:outline-none cursor-pointer"
          >
            <option value="">All scores</option>
            <option value="yes">Yes (65+)</option>
            <option value="lean_yes">Lean Yes (50-64)</option>
            <option value="lean_no">Lean No (35-49)</option>
            <option value="no">No (&lt;35)</option>
            <option value="unscored">Unscored</option>
          </select>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-8">
          {loading ? (
            <div className="text-center py-16 text-gray-400 text-[13px]">Loading engineers...</div>
          ) : (
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-3 pr-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer w-3.5 h-3.5"
                    />
                  </th>
                  <th className="py-3 pr-4 text-left text-[11px] font-medium text-gray-400 uppercase tracking-[0.05em]">
                    Engineer
                  </th>
                  <th className="py-3 pr-4 text-left text-[11px] font-medium text-gray-400 uppercase tracking-[0.05em]">
                    Headline
                  </th>
                  <th className="py-3 pr-4 text-left text-[11px] font-medium text-gray-400 uppercase tracking-[0.05em]">
                    Company
                  </th>
                  <th className="py-3 pr-4 text-left text-[11px] font-medium text-gray-400 uppercase tracking-[0.05em]">
                    Location
                  </th>
                  <th className="py-3 pr-4 text-center text-[11px] font-medium text-gray-400 uppercase tracking-[0.05em]">
                    Open Profile
                  </th>
                  <th
                    className="py-3 pr-4 text-center text-[11px] font-medium text-gray-400 uppercase tracking-[0.05em] cursor-pointer select-none hover:text-gray-600"
                    onClick={() => setSortByScore((prev) => prev === "" ? "desc" : prev === "desc" ? "asc" : "")}
                  >
                    Score {sortByScore === "desc" ? "↓" : sortByScore === "asc" ? "↑" : ""}
                  </th>
                  <th className="py-3 pr-4 text-left text-[11px] font-medium text-gray-400 uppercase tracking-[0.05em]">
                    Status
                  </th>
                  <th className="py-3 text-center text-[11px] font-medium text-gray-400 uppercase tracking-[0.05em]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedLeads.map((lead) => {
                  const name = `${lead.firstName} ${lead.lastName}`.trim();
                  return (
                    <tr
                      key={lead.id}
                      className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer group ${selected.has(lead.id) ? "bg-indigo-50/30" : ""}`}
                      onClick={() => setModalLead(lead)}
                    >
                      <td className="py-3.5 pr-3">
                        <input
                          type="checkbox"
                          checked={selected.has(lead.id)}
                          onChange={() => toggleOne(lead.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer w-3.5 h-3.5"
                        />
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={name} />
                          <div>
                            <p className="text-[13px] font-semibold text-gray-900 leading-tight flex items-center gap-1">
                              {name}
                              <FeedbackButton
                                leadId={lead.id}
                                leadName={name}
                                feedbackCount={feedbackCounts[lead.id] || 0}
                                onCountChange={() => fetchFeedbackCounts([lead.id])}
                              />
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 text-[13px] text-gray-500 max-w-[260px] truncate">
                        {lead.headline || "—"}
                      </td>
                      <td className="py-3.5 pr-4 text-[13px] text-gray-700 font-medium">
                        {lead.company || "—"}
                      </td>
                      <td className="py-3.5 pr-4 text-[13px] text-gray-500 max-w-[160px] truncate">
                        {lead.location || "—"}
                      </td>
                      <td className="py-3.5 pr-4 text-center">
                        <OpenProfileBadge isOpen={lead.isOpenProfile} />
                      </td>
                      <td className="py-3.5 pr-4 text-center">
                        {lead.fitScore != null ? (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold ${lead.fitScore >= 80 ? "bg-emerald-50 text-emerald-700" : lead.fitScore >= 50 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                            {lead.fitScore}
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-300">&mdash;</span>
                        )}
                      </td>
                      <td className="py-3.5 pr-4">
                        <StageBadge stage={lead.stage} />
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          {lead.linkedinUrl && (
                            <a
                              href={lead.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <LinkedInIcon />
                            </a>
                          )}
                          <MoreIcon />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {!loading && leads.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-[13px]">
              No engineers match your filters
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between py-4 border-t border-gray-100">
              <p className="text-[13px] text-gray-400">
                Showing {(page - 1) * LIMIT + 1}&ndash;{Math.min(page * LIMIT, total)} of{" "}
                {total.toLocaleString()} engineers
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 text-[12px] font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-[13px] text-gray-500 tabular-nums px-2">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 text-[12px] font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {modalLead && <ProspectModal lead={modalLead} onClose={() => setModalLead(null)} />}
    </>
  );
}
