import type { MissionControlState } from "@/lib/stability";

export function OperationalResilienceRadar({ state }: { state: MissionControlState }) {
  const scores = [
    ["Orchestration", state.health.orchestration_health],
    ["AI reliability", state.health.ai_reliability_score],
    ["Forecast quality", state.health.forecast_quality_score],
    ["Queue stability", state.health.queue_stability_score],
    ["Confidence", state.health.operational_confidence_score],
    ["Resilience", state.health.resilience_score]
  ];
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Operational Resilience Layer</p>
      <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">Degradation detection and recovery readiness</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {scores.map(([label, value]) => (
          <div key={label} className="rounded border border-card bg-background p-4">
            <div className="flex items-center justify-between">
              <strong className="text-sm font-black text-[#F8FAFC]">{label}</strong>
              <span className="text-xl font-black text-accent">{value}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-line">
              <div className="h-2 rounded-full bg-accent" style={{ width: `${value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
