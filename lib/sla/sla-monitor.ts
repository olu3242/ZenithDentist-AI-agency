import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { trackSlaEvent } from "@/lib/sla/sla-tracker";

export async function monitorRuntimeSla(organizationId: string) {
  const runtime = await getRuntimeHealthState();
  const compliance = runtime.traces.length ? Math.round(((runtime.traces.length - runtime.slaBreaches.length) / runtime.traces.length) * 100) : 100;
  return trackSlaEvent({
    organizationId,
    slaType: "runtime_sla",
    traceId: `sla-${Date.now()}`,
    snapshot: {
      availability: runtime.scores.reliabilityScore,
      response: compliance,
      resolution: runtime.scores.operationalScore,
      recovery: runtime.scores.healingScore
    },
    metadata: { trace_count: runtime.traces.length, sla_breaches: runtime.slaBreaches.length }
  });
}
