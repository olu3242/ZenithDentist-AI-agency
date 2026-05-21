import type { EnterpriseCloudState } from "@/lib/enterprise-cloud";

export function EnterpriseSimulationCenter({ state }: { state: EnterpriseCloudState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Enterprise Operational Simulation Cloud</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Scenario impact across staffing, retention, resilience, and revenue recovery</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {state.simulations.map(simulation => (
          <article key={simulation.id} className="rounded border border-line bg-paper p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-base font-black text-ink">{simulation.scenario_name}</strong>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-teal">{Math.round(simulation.confidence * 100)}%</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric label="Revenue" value={`$${simulation.revenue_recovery_projection.toLocaleString()}`} />
              <Metric label="Resilience" value={`${simulation.operational_resilience}%`} />
              <Metric label="Retention" value={`+${simulation.retention_trajectory}%`} />
              <Metric label="Staffing pressure" value={`${simulation.staffing_pressure}%`} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-white p-3">
      <p className="text-xs font-black uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 text-xl font-black text-ink">{value}</p>
    </div>
  );
}
