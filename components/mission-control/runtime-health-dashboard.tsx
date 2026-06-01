import { MetricCard } from "@/components/metric-card";
import type { RuntimeHealthState } from "@/lib/runtime/automation-health";

export function RuntimeHealthDashboard({ state }: { state: RuntimeHealthState }) {
  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Operational score" value={`${state.scores.operationalScore}%`} detail="Runtime-derived only" tone="accent" />
        <MetricCard label="Reliability" value={`${state.scores.reliabilityScore}%`} detail={`${state.traces.length} live traces`} tone="success" />
        <MetricCard label="Healing" value={`${state.scores.healingScore}%`} detail={`${state.deadLetters.length} dead letters`} tone="warning" />
        <MetricCard label="Observability" value={`${state.scores.observabilityScore}%`} detail="Registry coverage" tone="primary" />
      </div>
    </section>
  );
}
