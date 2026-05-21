import { MetricCard } from "@/components/metric-card";
import type { EnterpriseCloudState } from "@/lib/enterprise-cloud";

export function HealthcareCloudCenter({ state }: { state: EnterpriseCloudState }) {
  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Enterprise health" value={`${state.enterpriseScore}/100`} detail="Cloud-wide operating posture" tone="teal" />
        <MetricCard label="Recovery priority" value={`$${state.revenueOpportunity.toLocaleString()}`} detail="Revenue recovery queued" tone="green" />
        <MetricCard label="Risk probability" value={`${state.riskProbability}%`} detail="Highest active forecast" tone="rust" />
        <MetricCard label="Cloud layers" value={state.layers.length} detail="Coordinated intelligence layers" tone="blue" />
      </div>
      <div className="rounded border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-muted">Zenith Healthcare Operations Cloud</p>
            <h2 className="text-2xl font-black text-ink">Living operational intelligence infrastructure</h2>
          </div>
          <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-teal">Realtime-ready</span>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {state.layers.map(layer => (
            <div key={layer.id} className="rounded border border-line bg-paper p-4">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-sm font-black text-ink">{layer.layer_key.replace(/_/g, " ")}</strong>
                <span className="rounded-full bg-white px-2 py-1 text-[11px] font-black uppercase text-muted">{layer.status}</span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-line">
                <div className="h-2 rounded-full bg-teal" style={{ width: `${layer.coordination_score}%` }} />
              </div>
              <p className="mt-3 text-sm font-semibold text-muted">{layer.coordination_score}% coordination, {Math.round(layer.confidence * 100)}% confidence</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
