import type { PracticeHealthScore } from "@/lib/health";

export function PracticeHealthRadar({ score }: { score: PracticeHealthScore }) {
  const entries = Object.entries(score.components);
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Practice Health Radar</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {entries.map(([label, value]) => (
          <div key={label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="capitalize text-muted">{label}</span>
              <strong>{value}</strong>
            </div>
            <div className="h-2 rounded-full bg-paper">
              <div className="h-full rounded-full bg-teal" style={{ width: `${value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
