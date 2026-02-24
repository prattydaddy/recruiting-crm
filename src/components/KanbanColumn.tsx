import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Candidate, Stage } from "../types";
import { STAGES } from "../types";
import CandidateCard from "./CandidateCard";

interface Props {
  stage: Stage;
  candidates: Candidate[];
}

export default function KanbanColumn({ stage, candidates }: Props) {
  const stageInfo = STAGES.find((s) => s.key === stage)!;
  const { setNodeRef } = useDroppable({ id: stage });

  return (
    <div className="flex flex-col min-w-[280px] w-[280px] flex-shrink-0">
      <div className="flex items-center gap-2 px-2 pb-3">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stageInfo.color }} />
        <span className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">{stageInfo.label}</span>
        <span className="text-[11px] text-gray-400 font-medium">{candidates.length}</span>
      </div>
      <div ref={setNodeRef} className="flex flex-col gap-2 flex-1 min-h-[200px] pb-4">
        <SortableContext items={candidates.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {candidates.map((c) => (
            <CandidateCard key={c.id} candidate={c} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
