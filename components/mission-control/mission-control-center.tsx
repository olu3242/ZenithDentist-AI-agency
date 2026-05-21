import { MetricCard } from "@/components/metric-card";
import { getQueueHealth, type MissionControlState } from "@/lib/stability";

export function MissionControlCenter({ state }: { state: MissionControlState }) {
  const queue = getQueueHealth(state.queueEvents);
  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Queue stability" value={`${queue.stability}%`} detail={`${queue.failed} failed, ${queue.retries} retries`} tone="teal" />
        <MetricCard label="AI reliability" value={`${state.health.ai_reliability_score}%`} detail="Grounding validation" tone="green" />
        <MetricCard label="Forecast quality" value={`${state.health.forecast_quality_score}%`} detail="Drift-adjusted score" tone="blue" />
        <MetricCard label="Resilience" value={`${state.health.resilience_score}%`} detail="Recovery readiness" tone="gold" />
        <MetricCard label="Open Dental" value={state.openDental.acceptedEvents} detail="Normalized pilot events" tone="rust" />
      </div>
    </section>
  );
}
