import { MetricCard } from "@/components/metric-card";
import type { AutomationAuditState } from "@/lib/automation-audit";

export function AutomationAuditCenter({ state }: { state: AutomationAuditState }) {
  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Coverage score" value={`${state.auditRun.coverageScore}%`} detail={`${state.auditRun.completeCount}/${state.auditRun.totalBlueprints} complete`} tone="accent" />
        <MetricCard label="Declared only" value={state.auditRun.declaredOnlyCount} detail="Needs runtime traces" tone="warning" />
        <MetricCard label="Critical gaps" value={state.auditRun.criticalGapCount} detail="Mission Control focus" tone="danger" />
        <MetricCard label="Domains" value={state.domainCoverage.length} detail="Operational coverage" tone="primary" />
        <MetricCard label="Checklist" value={`${state.e2eChecklist.filter(item => item.complete).length}/${state.e2eChecklist.length}`} detail="E2E controls" tone="success" />
      </div>
    </section>
  );
}
