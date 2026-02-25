import { useState, useMemo } from "react";
import { DndContext, DragOverlay, closestCenter, type DragStartEvent, type DragEndEvent, type DragOverEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import FilterBar from "./components/FilterBar";
import KanbanColumn from "./components/KanbanColumn";
import CandidateCard from "./components/CandidateCard";
import { candidates as initialCandidates } from "./data";
import type { Candidate, Stage } from "./types";
import { STAGES } from "./types";

export default function App() {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [account, setAccount] = useState("All");
  const [position, setPosition] = useState("All");
  const [search, setSearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      if (account !== "All" && c.account !== account) return false;
      if (position !== "All" && c.targetPosition !== position) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.company.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [candidates, account, position, search]);

  const activeCount = useMemo(() => {
    return candidates.filter((c) => c.stage !== "rejected" && c.stage !== "hired").length;
  }, [candidates]);

  const grouped = useMemo(() => {
    const map: Record<Stage, Candidate[]> = { sourced: [], screening: [], interview: [], offer: [], hired: [], rejected: [] };
    filtered.forEach((c) => map[c.stage].push(c));
    return map;
  }, [filtered]);

  const activeCandidate = activeId ? candidates.find((c) => c.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const overId = over.id as string;
    const activeCandidate = candidates.find((c) => c.id === active.id);
    if (!activeCandidate) return;

    let targetStage: Stage | null = null;
    if (STAGES.some((s) => s.key === overId)) {
      targetStage = overId as Stage;
    } else {
      const overCandidate = candidates.find((c) => c.id === overId);
      if (overCandidate) targetStage = overCandidate.stage;
    }

    if (targetStage && activeCandidate.stage !== targetStage) {
      setCandidates((prev) =>
        prev.map((c) => (c.id === active.id ? { ...c, stage: targetStage } : c))
      );
    }
  }

  function handleDragEnd(_event: DragEndEvent) {
    setActiveId(null);
  }

  return (
    <div className="h-screen flex bg-white">
      {/* Sidebar */}
      <aside className="w-[220px] bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="px-4 py-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold tracking-tight">K</span>
          </div>
          <span className="text-[15px] font-semibold text-gray-900 tracking-tight">KythCRM</span>
        </div>
        <nav className="px-2 mt-1">
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-900 text-[13px] font-medium">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h4v10H3zM10 3h4v17h-4zM17 7h4v13h-4z" />
            </svg>
            Prospecting
          </button>
        </nav>
      </aside>

      {/* Right side: search bar + content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#f8f9fa]">
        {/* Global search bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-2.5">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search for anything..."
              className="w-full pl-10 pr-4 py-2 text-[13px] bg-gray-50 border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
            />
          </div>
        </div>

        {/* Page header */}
        <div className="px-6 pt-6 pb-0">
          <h1 className="text-3xl font-bold text-gray-900">Kyth Prospecting</h1>
          <p className="text-sm text-gray-400 mt-1">
            · {candidates.length} candidates · {activeCount} active
          </p>
        </div>

        {/* View tabs */}
        <div className="px-6 pt-4 pb-0 flex items-center gap-4 border-b border-gray-200">
          <button className="text-[13px] font-medium text-blue-600 pb-2.5 border-b-2 border-blue-600">
            All
          </button>
          <button className="text-[13px] font-medium text-gray-400 pb-2.5 border-b-2 border-transparent hover:text-gray-600">
            + Save as new view
          </button>
        </div>

        {/* Filters */}
        <FilterBar
          account={account}
          position={position}
          search={search}
          onAccountChange={setAccount}
          onPositionChange={setPosition}
          onSearchChange={setSearch}
        />

        {/* Kanban */}
        <div className="flex-1 overflow-x-auto px-6 pt-4 pb-6">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 h-full">
              {STAGES.map((s) => (
                <KanbanColumn key={s.key} stage={s.key} candidates={grouped[s.key]} />
              ))}
            </div>
            <DragOverlay>
              {activeCandidate ? <CandidateCard candidate={activeCandidate} /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  );
}
