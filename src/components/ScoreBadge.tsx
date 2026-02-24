export default function ScoreBadge({ score }: { score: number }) {
  const bg = score >= 80 ? "bg-emerald-50 text-emerald-700" : score >= 50 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold ${bg}`}>
      {score}
    </span>
  );
}
