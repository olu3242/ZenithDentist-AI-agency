import { MetricCard } from "@/components/metric-card";
import type { RuntimeHealthState } from "@/lib/runtime/automation-health";

export function RuntimeHealthDashboard({ state }: { state: RuntimeHealthState }) {
  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Operational score" value={`${state.scores.operationalScore}%`} detail="Runtime-derived only" tone="teal" />
        <MetricCard label="Reliability" value={`${state.scores.reliabilityScore}%`} detail={`${state.traces.length} live traces`} tone="green" />
        <MetricCard label="Healing" value={`${state.scores.healingScore}%`} detail={`${state.deadLetters.length} dead letters`} tone="gold" />
        <MetricCard label="Observability" value={`${state.scores.observabilityScore}%`} detail="Registry coverage" tone="blue" />
      </div>
    </section>
  );
}
