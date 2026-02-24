import { useState, useMemo } from "react";
import { DndContext, DragOverlay, closestCenter, type DragStartEvent, type DragEndEvent, type DragOverEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import Header from "./components/Header";
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

    // Determine target stage
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
    <div className="h-screen flex flex-col bg-[#f8f9fa]">
      <Header />
      <FilterBar
        account={account}
        position={position}
        search={search}
        onAccountChange={setAccount}
        onPositionChange={setPosition}
        onSearchChange={setSearch}
      />
      <div className="flex-1 overflow-x-auto px-6 pb-6">
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
  );
}
