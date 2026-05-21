import type { EnterpriseCloudState } from "@/lib/enterprise-cloud";

export function EnterpriseHealthRadar({ state }: { state: EnterpriseCloudState }) {
  const scores = [
    { label: "Enterprise", value: state.enterpriseScore },
    { label: "Location", value: 84 },
    { label: "Provider", value: 81 },
    { label: "Patient engagement", value: 78 },
    { label: "Resilience", value: 88 },
    { label: "Optimization adoption", value: 86 }
  ];
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Practice + enterprise health engine</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Operational health radar</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {scores.map(score => (
          <div key={score.label} className="rounded border border-line bg-paper p-4">
            <div className="flex items-center justify-between">
              <strong className="text-sm font-black text-ink">{score.label}</strong>
              <span className="text-xl font-black text-teal">{score.value}</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-line">
              <div className="h-2 rounded-full bg-teal" style={{ width: `${score.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
