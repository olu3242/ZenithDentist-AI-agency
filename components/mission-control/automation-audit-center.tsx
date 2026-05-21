import { MetricCard } from "@/components/metric-card";
import type { AutomationAuditState } from "@/lib/automation-audit";

export function AutomationAuditCenter({ state }: { state: AutomationAuditState }) {
  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Coverage score" value={`${state.auditRun.coverage_score}%`} detail={`${state.auditRun.complete_count}/${state.auditRun.total_blueprints} complete`} tone="teal" />
        <MetricCard label="Partial" value={state.auditRun.partial_count} detail="Needs hardening" tone="gold" />
        <MetricCard label="Risk" value={state.auditRun.risk_count} detail="Mission Control focus" tone="rust" />
        <MetricCard label="Domains" value={state.domainCoverage.length} detail="Operational coverage" tone="blue" />
        <MetricCard label="Checklist" value={`${state.e2eChecklist.filter(item => item.complete).length}/${state.e2eChecklist.length}`} detail="E2E controls" tone="green" />
      </div>
    </section>
  );
}
