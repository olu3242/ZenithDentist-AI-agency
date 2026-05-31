import type { PracticeHealthScore } from "@/lib/health";

export function HealthScoreCard({ score }: { score: PracticeHealthScore }) {
  return (
    <section className="rounded border border-card bg-white p-6 shadow-card">
      <p className="text-xs font-black uppercase tracking-wider text-accent">Practice Operational Health Score</p>
      <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <strong className="text-7xl font-black text-[#F8FAFC]">{score.overall}</strong>
          <span className="ml-3 text-sm font-bold text-success">{score.trend >= 0 ? "+" : ""}{score.trend} pt trend</span>
          <p className="mt-2 text-muted">Outperforming {score.benchmarkPercentile}% of comparable practices.</p>
        </div>
        <div className="grid gap-2 text-sm">
          {Object.entries(score.components).map(([key, value]) => (
            <div key={key} className="grid grid-cols-[110px_1fr_42px] items-center gap-2">
              <span className="capitalize text-muted">{key}</span>
              <div className="h-2 rounded-full bg-background"><div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} /></div>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
