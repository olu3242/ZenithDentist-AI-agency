import type { OperationalSimulation } from "@/lib/runtime/simulation-engine";

export function SimulationLab({ simulations }: { simulations: OperationalSimulation[] }) {
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Operational Simulation Center</p>
      <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">Reliability lab</h2>
      <div className="mt-5 grid gap-3">
        {simulations.slice(0, 6).map(simulation => (
          <div key={simulation.id} className="rounded border border-card bg-background p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <strong className="text-sm font-black text-[#F8FAFC]">{simulation.title}</strong>
              <span className="text-xs font-black uppercase text-accent">{simulation.confidence}% confidence</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-muted">
              Reliability {simulation.projectedImpact.reliabilityDelta > 0 ? "+" : ""}{simulation.projectedImpact.reliabilityDelta} · SLA risk {simulation.projectedImpact.slaRiskDelta > 0 ? "+" : ""}{simulation.projectedImpact.slaRiskDelta} · {simulation.projectedImpact.recoveryMinutes}m recovery
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {simulation.checkpoints.map(checkpoint => (
                <span key={checkpoint} className="rounded bg-white px-3 py-2 text-xs font-bold text-muted">{checkpoint}</span>
              ))}
            </div>
          </div>
        ))}
        {!simulations.length ? <div className="rounded border border-card bg-background p-4 text-sm font-semibold text-muted">No simulations are needed for the current runtime posture.</div> : null}
      </div>
    </section>
  );
}
