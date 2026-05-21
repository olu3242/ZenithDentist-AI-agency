import type { EnterpriseCloudState } from "@/lib/enterprise-cloud";

export function BenchmarkLeadershipBoard({ state }: { state: EnterpriseCloudState }) {
  const rows = [
    { label: "Recall recovery", rank: 74, movement: "+6" },
    { label: "No-show reduction", rank: 71, movement: "+4" },
    { label: "Review conversion", rank: 63, movement: "+3" },
    { label: "Operational resilience", rank: 79, movement: "+7" }
  ];
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Benchmark intelligence</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Enterprise benchmark leadership</h2>
      <div className="mt-5 grid gap-3">
        {rows.map(row => (
          <div key={row.label} className="grid items-center gap-3 rounded border border-line bg-paper p-4 sm:grid-cols-[1fr_90px_80px]">
            <strong className="text-sm font-black text-ink">{row.label}</strong>
            <span className="text-xl font-black text-teal">{row.rank}th</span>
            <span className="text-sm font-black text-green">{row.movement} pts</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm font-semibold text-muted">Current enterprise score: {state.enterpriseScore}/100 across active operating systems.</p>
    </section>
  );
}
