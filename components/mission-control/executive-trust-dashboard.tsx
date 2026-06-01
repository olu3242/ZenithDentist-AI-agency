import { MetricCard } from "@/components/metric-card";
import type { MissionControlState } from "@/lib/stability";

export function ExecutiveTrustDashboard({ state }: { state: MissionControlState }) {
  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Operational reliability" value={`${state.health.operational_confidence_score}%`} detail="Traceable intelligence" tone="accent" />
        <MetricCard label="Recommendation quality" value={`${Math.round((state.recommendationLineage[0]?.historical_effectiveness ?? 0.82) * 100)}%`} detail="Outcome effectiveness" tone="success" />
        <MetricCard label="Orchestration confidence" value={`${state.health.orchestration_health}%`} detail="Approval-safe sequencing" tone="primary" />
        <MetricCard label="Optimization performance" value="+$8.4K" detail="Validated recovery lift" tone="warning" />
        <MetricCard label="Risk indicators" value={state.anomalyValidations.length} detail="Validated anomalies" tone="danger" />
      </div>
    </section>
  );
}
